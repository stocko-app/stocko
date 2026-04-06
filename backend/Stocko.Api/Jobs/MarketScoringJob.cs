using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

/// <summary>
/// Job de scoring por tipo de mercado.
/// Corre várias vezes por dia, cada vez após o fecho de um grupo de mercados.
/// </summary>
public class MarketScoringJob
{
    private readonly ScoringService _scoringService;
    private readonly NotificationService _notificationService;
    private readonly StockoDbContext _db;

    // Mercados agrupados por horário de fecho
    public static readonly string[] MarketsJP    = ["JP"];
    public static readonly string[] MarketsEU    = ["EU", "PT"];
    public static readonly string[] MarketsUS    = ["US", "EMERGING"];
    public static readonly string[] MarketsCrypto = ["CRYPTO", "COMMODITY"];

    public MarketScoringJob(ScoringService scoringService, NotificationService notificationService, StockoDbContext db)
    {
        _scoringService = scoringService;
        _notificationService = notificationService;
        _db = db;
    }

    // Chamado após fecho do mercado japonês (~07h45 Lisboa)
    public async Task ExecuteJPAsync()
        => await ExecuteForMarketsAsync(MarketsJP, "JP");

    // Chamado após fecho dos mercados europeus (~17h45 Lisboa)
    public async Task ExecuteEUAsync()
        => await ExecuteForMarketsAsync(MarketsEU, "EU/PT");

    // Chamado após fecho dos mercados americanos (~21h30 Lisboa)
    public async Task ExecuteUSAsync()
    {
        await ExecuteForMarketsAsync(MarketsUS, "US/EMERGING");

        // Após o fecho US é o fim do dia de scoring — enviar resultados na Sexta
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (today.DayOfWeek == DayOfWeek.Friday)
            await SendWeeklyResultsAsync();
    }

    // Chamado à meia-noite Lisboa para crypto/commodity (~00h30 UTC)
    public async Task ExecuteCryptoAsync()
        => await ExecuteForMarketsAsync(MarketsCrypto, "CRYPTO/COMMODITY");

    // ── lógica comum ─────────────────────────────────────────────────────────

    private async Task ExecuteForMarketsAsync(string[] markets, string label)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (today.DayOfWeek == DayOfWeek.Saturday || today.DayOfWeek == DayOfWeek.Sunday)
        {
            Console.WriteLine($"⏭️ MarketScoringJob [{label}] ignorado — fim de semana");
            return;
        }

        Console.WriteLine($"🕐 MarketScoringJob [{label}] iniciado: {today}");
        await _scoringService.CalculateDailyScoresAsync(today, markets);

        // Actualizar ranks após cada scoring para manter rankings actualizados
        var gameWeekService = new GameWeekService(_db);
        var currentWeek = gameWeekService.GetOrCreateCurrentWeek();
        await _scoringService.UpdateRanksAsync(currentWeek.Id);

        Console.WriteLine($"✅ MarketScoringJob [{label}] concluído: {today}");
    }

    private async Task SendWeeklyResultsAsync()
    {
        var gameWeekService = new GameWeekService(_db);
        var currentWeek = gameWeekService.GetOrCreateCurrentWeek();

        await _scoringService.UpdateStreaksAsync(currentWeek.Id);

        var scores = _db.WeeklyScores
            .Where(ws => ws.GameWeekId == currentWeek.Id)
            .ToList();

        var totalPlayers = scores.Count;
        foreach (var score in scores)
        {
            await _notificationService.SendWeeklyResultAsync(
                score.UserId, score.RankGlobal, score.TotalPoints, totalPlayers);
        }

        Console.WriteLine($"📢 Resultado semanal enviado a {totalPlayers} jogadores");
    }
}
