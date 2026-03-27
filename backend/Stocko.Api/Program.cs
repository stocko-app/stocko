using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Data.Seeds;
using Stocko.Api.Jobs;
using Stocko.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<StockoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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

// Hangfire
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(c =>
        c.UseNpgsqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))));
builder.Services.AddHangfireServer();

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<GameWeekService>();
builder.Services.AddScoped<ScoringService>();
builder.Services.AddHttpClient<MarketDataService>();
builder.Services.AddScoped<MarketDataService>();
builder.Services.AddScoped<AchievementService>();
builder.Services.AddHttpClient<NotificationService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddMemoryCache();

// Jobs
builder.Services.AddScoped<MarketDataJob>();
builder.Services.AddScoped<DailyScoringJob>();
builder.Services.AddScoped<AutoPickJob>();
builder.Services.AddScoped<AutoCaptainJob>();
builder.Services.AddScoped<DeadlineReminderJob>();
builder.Services.AddScoped<CaptainReminderJob>();
builder.Services.AddScoped<StreakRiskJob>();
builder.Services.AddScoped<MonthlyLeagueJob>();

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

    jobs.AddOrUpdate<MarketDataJob>(
        "market-data-hourly",
        job => job.ExecuteAsync(),
        "0 8-18 * * 1-5",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<DailyScoringJob>(
        "daily-scoring",
        job => job.ExecuteAsync(),
        "15 18 * * 2-6",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<AutoPickJob>(
        "auto-pick",
        job => job.ExecuteAsync(),
        "5 8 * * 1",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<MonthlyLeagueJob>(
        "monthly-league",
        job => job.ExecuteAsync(),
        "0 1 1 * *",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<StreakRiskJob>(
        "streak-risk",
        job => job.ExecuteAsync(),
        "0 20 * * 0",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<DeadlineReminderJob>(
        "deadline-reminder",
        job => job.ExecuteAsync(),
        "0 6 * * 1",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<CaptainReminderJob>(
        "captain-reminder",
        job => job.ExecuteAsync(),
        "15 8 * * 1-4",
        new RecurringJobOptions { TimeZone = lisbonTz });

    jobs.AddOrUpdate<AutoCaptainJob>(
        "auto-captain",
        job => job.ExecuteAsync(),
        "5 0 * * 5",
        new RecurringJobOptions { TimeZone = lisbonTz });
}

app.Run();