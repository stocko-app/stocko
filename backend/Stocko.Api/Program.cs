using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Data.Seeds;
using Stocko.Api.Jobs;
using Stocko.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Database — pool limitado para não esgotar conexões do Supabase free tier (max ~60)
var connString = builder.Configuration.GetConnectionString("DefaultConnection")!;
var connStringWithPool = connString
    + ";Maximum Pool Size=8;Minimum Pool Size=1;Connection Idle Lifetime=30";

builder.Services.AddDbContext<StockoDbContext>(options =>
    options.UseNpgsql(connStringWithPool));

// Supabase Client
builder.Services.AddScoped<Supabase.Client>(_ =>
{
    var url = builder.Configuration["Supabase:Url"]!;
    var key = builder.Configuration["Supabase:ServiceRoleKey"]!;
    var options = new Supabase.SupabaseOptions { AutoConnectRealtime = false };
    var client = new Supabase.Client(url, key, options);
    client.InitializeAsync().Wait();
    return client;
});

// Hangfire — pool próprio pequeno + workers limitados
var hangfireConnString = connString
    + ";Maximum Pool Size=5;Minimum Pool Size=1;Connection Idle Lifetime=30";
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(c =>
        c.UseNpgsqlConnection(hangfireConnString)));
builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 3; // reduzir workers para poupar conexões
});

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<GameWeekService>();
builder.Services.AddScoped<ScoringService>();
builder.Services.AddHttpClient<MarketDataService>();
builder.Services.AddScoped<MarketDataService>();
builder.Services.AddScoped<AchievementService>();
builder.Services.AddHttpClient<NotificationService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddHttpClient<NewsService>();
builder.Services.AddScoped<NewsService>();
builder.Services.AddMemoryCache();

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

app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire");
}

app.UseCors("WebPolicy");
app.UseHttpsRedirection();
app.UseMiddleware<SupabaseAuthMiddleware>();
app.MapControllers();

// Health check
app.MapGet("/health", () => "OK");

// Seed base de dados
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<StockoDbContext>();
    await db.Database.MigrateAsync();
    await StockSeeder.SeedAsync(db);
}

// Registar cron jobs via DI (evita o problema do JobStorage.Current em produção)
using (var scope = app.Services.CreateScope())
{
    var jobs = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    var lisbonTz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Lisbon");

    // Market data: cobre JP (1h-7h30) + EU/PT (9h-17h30) + US (14h30-22h) + Crypto (24h)
    jobs.AddOrUpdate<MarketDataJob>(
        "market-data",
        job => job.ExecuteAsync(),
        "0 1-22 * * 1-5",   // cada hora das 01h às 22h Seg-Sex
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