using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Stocko.Api.Data;
using Stocko.Api.Data.Seeds;
using Stocko.Api.Filters;
using Stocko.Api.Jobs;
using Stocko.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Database — ligação directa ao Supabase Postgres para pedidos da API.
// NOTA: pooler (6543) foi testado em e4d1ba9 e revertido em 7b09b24 por instabilidade com EF.
var directConn = builder.Configuration.GetConnectionString("DirectConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")!;
var directConnBuilder = new NpgsqlConnectionStringBuilder(directConn)
{
    // Só EF usa Postgres agora (Hangfire em memória) — pool único na VM 256MB
    MaxPoolSize = 6,
    MinPoolSize = 0,
    ConnectionIdleLifetime = 60,
    ConnectionLifetime = 600,
    Timeout = 15,
    KeepAlive = 30,
    TcpKeepAlive = true
};
var efConnString = directConnBuilder.ConnectionString;

builder.Services.AddDbContext<StockoDbContext>(options =>
    options.UseNpgsql(efConnString, npgsql =>
    {
        npgsql.CommandTimeout(30);
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(4),
            errorCodesToAdd: null);
    }));

// Supabase Client — Singleton para evitar InitializeAsync().Wait() em cada request
builder.Services.AddSingleton<Supabase.Client>(sp =>
{
    var url = builder.Configuration["Supabase:Url"]!;
    var key = builder.Configuration["Supabase:ServiceRoleKey"]!;
    var options = new Supabase.SupabaseOptions { AutoConnectRealtime = false };
    var client = new Supabase.Client(url, key, options);
    client.InitializeAsync().Wait();
    return client;
});

// Hangfire em memória — recurring jobs são re-registados no arranque (Program.cs).
// Elimina polling permanente ao Postgres (causa principal de esgotamento no free tier).
builder.Services.AddHangfire(config => config.UseMemoryStorage());
builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 1;
    options.Queues = new[] { "default" };
    options.SchedulePollingInterval = TimeSpan.FromSeconds(30);
});

builder.Services.AddRequestTimeouts(options =>
{
    options.DefaultPolicy = new Microsoft.AspNetCore.Http.Timeouts.RequestTimeoutPolicy
    {
        Timeout = TimeSpan.FromSeconds(25)
    };
});

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<GameWeekService>();
builder.Services.AddScoped<ScoringService>();
builder.Services.AddHttpClient<MarketDataService>(client =>
{
    // Timeout por chamada HTTP — evita que APIs lentas bloqueiem threads indefinidamente
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddScoped<MarketDataService>();
builder.Services.AddScoped<AchievementService>();
builder.Services.AddHttpClient<NotificationService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddScoped<NotificationService>();
builder.Services.AddHttpClient<NewsService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddScoped<NewsService>();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<HealthMonitorState>();
builder.Services.AddHostedService<DbHeartbeatBackgroundService>();
builder.Services.AddSingleton<JobTimingFilter>();

// Jobs
builder.Services.AddScoped<MarketDataJob>();
builder.Services.AddScoped<MarketScoringJob>();
builder.Services.AddScoped<AutoPickJob>();
builder.Services.AddScoped<AutoCaptainJob>();
builder.Services.AddScoped<DeadlineReminderJob>();
builder.Services.AddScoped<CaptainReminderJob>();
builder.Services.AddScoped<StreakRiskJob>();
builder.Services.AddScoped<MonthlyLeagueJob>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://stocko.pt",
            "https://www.stocko.pt"
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

var app = builder.Build();

GlobalJobFilters.Filters.Add(app.Services.GetRequiredService<JobTimingFilter>());

app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire");
}

app.UseCors("WebPolicy");
app.UseHttpsRedirection();
app.UseRequestTimeouts();
app.UseMiddleware<SupabaseAuthMiddleware>();
app.MapControllers();

// Liveness rápido — só para debug manual; a Fly usa /health (com BD) para auto-restart.
app.MapGet("/health/live", () => Results.Text("OK"));

// Readiness — Postgres com timeout 4s; Fly health check reinicia a máquina se falhar
app.MapGet("/health", async (HttpContext ctx, IServiceScopeFactory scopes, HealthMonitorState monitor, ILoggerFactory logs) =>
{
    var log = logs.CreateLogger("Health");
    await using var scope = scopes.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<StockoDbContext>();

    var result = await SystemHealthProbe.CheckDatabaseAsync(
        db, TimeSpan.FromSeconds(4), ctx.RequestAborted);
    monitor.RecordDbCheck(result);

    if (result.Ok)
        return Results.Text("OK");

    var snap = SystemHealthProbe.CaptureRuntime();
    log.LogWarning(
        "Health FAIL ms={Ms} error={Error} consecutiveFails={Fails} threads={Avail}/{Max} heapMb={Heap}",
        result.ElapsedMs,
        result.Error ?? "connect-false",
        monitor.ConsecutiveDbFailures,
        snap.ThreadPoolAvailableWorkers,
        snap.ThreadPoolMaxWorkers,
        snap.GcHeapMb);

    return Results.StatusCode(503);
});

// Diagnóstico manual — ver estado antes da app ficar totalmente presa
app.MapGet("/health/diag", (HealthMonitorState monitor, IConfiguration config, HttpContext ctx) =>
{
    var requiredKey = config["Diagnostics:Key"];
    if (!string.IsNullOrEmpty(requiredKey))
    {
        var provided = ctx.Request.Headers["X-Stocko-Diag-Key"].FirstOrDefault();
        if (!string.Equals(requiredKey, provided, StringComparison.Ordinal))
            return Results.Unauthorized();
    }

    var snap = SystemHealthProbe.CaptureRuntime();
    return Results.Json(new
    {
        checkedAtUtc = DateTime.UtcNow,
        runtime = snap,
        database = new
        {
            monitor.LastDbCheckUtc,
            monitor.LastDbCheckMs,
            monitor.LastDbCheckOk,
            monitor.LastDbCheckError,
            monitor.ConsecutiveDbFailures,
            monitor.TotalDbChecks,
            monitor.TotalDbFailures
        },
        recentJobs = monitor.GetRecentJobs()
    });
});

// Seed base de dados — migrações e seed usam a mesma ligação directa do EF Core
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<StockoDbContext>();
    await db.Database.MigrateAsync();
    await StockSeeder.SeedAsync(db);
}

// Limpar sockets mortos herdados de deploys anteriores
NpgsqlConnection.ClearAllPools();

// Registar cron jobs via DI (evita o problema do JobStorage.Current em produção)
using (var scope = app.Services.CreateScope())
{
    var jobs = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    var lisbonTz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Lisbon");

    jobs.RemoveIfExists("market-data");

    // Market data: actualizar apenas o grupo necessário antes do respectivo scoring.
    // Evita correr todos os tickers de hora a hora e esgotar Fly/Supabase/APIs free tier.
    jobs.AddOrUpdate<MarketDataJob>(
        "market-data-jp",
        job => job.ExecuteJPAsync(),
        "30 7 * * 1-5",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<MarketDataJob>(
        "market-data-eu",
        job => job.ExecuteEUAsync(),
        "30 17 * * 1-5",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<MarketDataJob>(
        "market-data-us",
        job => job.ExecuteUSAsync(),
        "15 21 * * 1-5",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<MarketDataJob>(
        "market-data-crypto",
        job => job.ExecuteCryptoAsync(),
        "15 0 * * 2-6",
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Scoring JP: após fecho Nikkei (~07h45 Lisboa)
    jobs.AddOrUpdate<MarketScoringJob>(
        "scoring-jp",
        job => job.ExecuteJPAsync(),
        "45 7 * * 1-5",
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Scoring EU/PT: após fecho europeu (~17h45 Lisboa)
    jobs.AddOrUpdate<MarketScoringJob>(
        "scoring-eu",
        job => job.ExecuteEUAsync(),
        "45 17 * * 1-5",
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Scoring US/EMERGING: após fecho Wall Street (~21h30 Lisboa) + resultados na Sexta
    jobs.AddOrUpdate<MarketScoringJob>(
        "scoring-us",
        job => job.ExecuteUSAsync(),
        "30 21 * * 1-5",
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Scoring Crypto/Commodity: meia-noite Lisboa (00h30)
    jobs.AddOrUpdate<MarketScoringJob>(
        "scoring-crypto",
        job => job.ExecuteCryptoAsync(),
        "30 0 * * 2-6",     // Ter-Sab (scoring do dia anterior Seg-Sex)
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Auto-pick: Segunda 00h05 (logo após deadline Domingo 23h59)
    jobs.AddOrUpdate<AutoPickJob>(
        "auto-pick",
        job => job.ExecuteAsync(),
        "5 0 * * 1",
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Auto-captain: Sexta 00h05 (último dia para activar)
    jobs.AddOrUpdate<AutoCaptainJob>(
        "auto-captain",
        job => job.ExecuteAsync(),
        "5 0 * * 5",
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Deadline reminder: Domingo 18h (lembrar quem não fez picks)
    jobs.AddOrUpdate<DeadlineReminderJob>(
        "deadline-reminder",
        job => job.ExecuteAsync(),
        "0 18 * * 0",
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Captain reminder: Seg-Qui 09h00 (lembrar quem não activou capitão)
    jobs.AddOrUpdate<CaptainReminderJob>(
        "captain-reminder",
        job => job.ExecuteAsync(),
        "0 9 * * 1-4",
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Streak risk: Domingo 20h (quem tem streak e não fez picks)
    jobs.AddOrUpdate<StreakRiskJob>(
        "streak-risk",
        job => job.ExecuteAsync(),
        "0 20 * * 0",
        new RecurringJobOptions { TimeZone = lisbonTz });

    // Ligas mensais: 1º de cada mês às 01h
    jobs.AddOrUpdate<MonthlyLeagueJob>(
        "monthly-league",
        job => job.ExecuteAsync(),
        "0 1 1 * *",
        new RecurringJobOptions { TimeZone = lisbonTz });
}

app.Run();