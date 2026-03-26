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

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
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

// Registar cron jobs (timezone Lisboa)
var lisbonTz = "Europe/Lisbon";

// Buscar preços a cada hora (dias úteis 08h-18h)
RecurringJob.AddOrUpdate<MarketDataJob>(
    "market-data-hourly",
    job => job.ExecuteAsync(),
    "0 8-18 * * 1-5",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById(lisbonTz) });

// Calcular pontuação diária (Terça a Sexta às 18h15)
RecurringJob.AddOrUpdate<DailyScoringJob>(
    "daily-scoring",
    job => job.ExecuteAsync(),
    "15 18 * * 2-6",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById(lisbonTz) });

// Auto-pick (Segunda às 08h05)
RecurringJob.AddOrUpdate<AutoPickJob>(
    "auto-pick",
    job => job.ExecuteAsync(),
    "5 8 * * 1",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById(lisbonTz) });

// Deadline reminder (Segunda às 06h00 — 2h antes do deadline das 08h00)
RecurringJob.AddOrUpdate<DeadlineReminderJob>(
    "deadline-reminder",
    job => job.ExecuteAsync(),
    "0 6 * * 1",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById(lisbonTz) });

// Captain reminder (Seg-Qui às 08h15 — só para quem ainda não usou capitão)
RecurringJob.AddOrUpdate<CaptainReminderJob>(
    "captain-reminder",
    job => job.ExecuteAsync(),
    "15 8 * * 1-4",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById(lisbonTz) });

// Auto-capitão (Sexta às 00h05)
RecurringJob.AddOrUpdate<AutoCaptainJob>(
    "auto-captain",
    job => job.ExecuteAsync(),
    "5 0 * * 5",
    new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById(lisbonTz) });

app.Run();