using Hangfire;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

/// <summary>
/// Scoring por mercado. Cada fase usa scope próprio para libertar conexões Postgres
/// antes de notificações ou fases seguintes (evita esgotar pool na VM 256MB).
/// </summary>
public class MarketScoringJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    public static readonly string[] MarketsJP    = ["JP"];
    public static readonly string[] MarketsEU    = ["EU", "PT"];
    public static readonly string[] MarketsUS    = ["US", "EMERGING"];
    public static readonly string[] MarketsCrypto = ["CRYPTO", "COMMODITY"];

    public MarketScoringJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [DisableConcurrentExecution(60 * 15)]
    public async Task ExecuteJPAsync()
        => await ExecuteForMarketsAsync(MarketsJP, "JP");

    [DisableConcurrentExecution(60 * 15)]
    public async Task ExecuteEUAsync()
        => await ExecuteForMarketsAsync(MarketsEU, "EU/PT");

    [DisableConcurrentExecution(60 * 15)]
    public async Task ExecuteUSAsync()
    {
        await ExecuteForMarketsAsync(MarketsUS, "US/EMERGING");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (today.DayOfWeek == DayOfWeek.Friday)
            await SendWeeklyResultsAsync();
    }

    [DisableConcurrentExecution(60 * 15)]
    public async Task ExecuteCryptoAsync()
        => await ExecuteForMarketsAsync(MarketsCrypto, "CRYPTO/COMMODITY");

    private async Task ExecuteForMarketsAsync(string[] markets, string label)
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(6));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (today.DayOfWeek == DayOfWeek.Saturday || today.DayOfWeek == DayOfWeek.Sunday)
        {
            Console.WriteLine($"⏭️ MarketScoringJob [{label}] ignorado — fim de semana");
            return;
        }

        Console.WriteLine($"🕐 MarketScoringJob [{label}] iniciado: {today}");
        try
        {
            await using (var scope = _scopeFactory.CreateAsyncScope())
            {
                var scoring = scope.ServiceProvider.GetRequiredService<ScoringService>();
                await scoring.CalculateDailyScoresAsync(today, markets);
            }

            await using (var scope = _scopeFactory.CreateAsyncScope())
            {
                var gameWeekService = scope.ServiceProvider.GetRequiredService<GameWeekService>();
                var scoring = scope.ServiceProvider.GetRequiredService<ScoringService>();
                var currentWeek = await gameWeekService.GetOrCreateCurrentWeekAsync();
                await scoring.UpdateRanksAsync(currentWeek.Id);
            }

            Console.WriteLine($"✅ MarketScoringJob [{label}] concluído: {today}");
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine($"⏱️ MarketScoringJob [{label}] cancelado por timeout às {DateTime.UtcNow:HH:mm:ss}");
        }
    }

    private async Task SendWeeklyResultsAsync()
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));

        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StockoDbContext>();
        var gameWeekService = scope.ServiceProvider.GetRequiredService<GameWeekService>();
        var scoring = scope.ServiceProvider.GetRequiredService<ScoringService>();
        var notifications = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var currentWeek = await gameWeekService.GetOrCreateCurrentWeekAsync();
        await scoring.UpdateStreaksAsync(currentWeek.Id);

        var scores = await db.WeeklyScores
            .Where(ws => ws.GameWeekId == currentWeek.Id)
            .ToListAsync(cts.Token);

        var totalPlayers = scores.Count;
        foreach (var score in scores)
        {
            cts.Token.ThrowIfCancellationRequested();
            await notifications.SendWeeklyResultAsync(
                score.UserId, score.RankGlobal, score.TotalPoints, totalPlayers);
        }

        Console.WriteLine($"📢 Resultado semanal enviado a {totalPlayers} jogadores");
    }
}
