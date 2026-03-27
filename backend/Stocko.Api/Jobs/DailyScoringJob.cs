using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class DailyScoringJob
{
    private readonly ScoringService _scoringService;
    private readonly NotificationService _notificationService;
    private readonly StockoDbContext _db;

    public DailyScoringJob(ScoringService scoringService, NotificationService notificationService, StockoDbContext db)
    {
        _scoringService = scoringService;
        _notificationService = notificationService;
        _db = db;
    }

    public async Task ExecuteAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (today.DayOfWeek == DayOfWeek.Saturday || today.DayOfWeek == DayOfWeek.Sunday)
        {
            Console.WriteLine($"⏭️ DailyScoringJob ignorado — fim de semana");
            return;
        }

        Console.WriteLine($"🕐 DailyScoringJob iniciado: {today}");
        await _scoringService.CalculateDailyScoresAsync(today);

        // Actualizar streaks e enviar resultado apenas na Sexta
        if (today.DayOfWeek == DayOfWeek.Friday)
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
                    score.UserId,
                    score.RankGlobal,
                    score.TotalPoints,
                    totalPlayers);
            }

            Console.WriteLine($"📢 Resultado semanal enviado a {totalPlayers} jogadores");
        }

        Console.WriteLine($"✅ DailyScoringJob concluído: {today}");
    }
}