using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class StreakRiskJob
{
    private readonly StockoDbContext _db;
    private readonly GameWeekService _gameWeekService;
    private readonly NotificationService _notificationService;

    public StreakRiskJob(StockoDbContext db, GameWeekService gameWeekService, NotificationService notificationService)
    {
        _db = db;
        _gameWeekService = gameWeekService;
        _notificationService = notificationService;
    }

    public async Task ExecuteAsync()
    {
        Console.WriteLine($"🕐 StreakRiskJob iniciado: {DateTime.UtcNow:HH:mm:ss}");

        var currentWeek = _gameWeekService.GetOrCreateCurrentWeek();

        // Utilizadores que já fizeram picks esta semana
        var usersWithPicks = _db.Picks
            .Where(p => p.GameWeekId == currentWeek.Id)
            .Select(p => p.UserId)
            .Distinct()
            .ToHashSet();

        // Utilizadores com streak > 3 que NÃO fizeram picks esta semana
        var atRisk = _db.Users
            .Where(u => u.StreakWeeks > 3 && !usersWithPicks.Contains(u.Id))
            .ToList();

        if (!atRisk.Any())
        {
            Console.WriteLine("⏭️ StreakRiskJob: nenhum utilizador em risco");
            return;
        }

        foreach (var user in atRisk)
            await _notificationService.SendStreakRiskAsync(user.Id, user.StreakWeeks);

        Console.WriteLine($"✅ StreakRiskJob: aviso enviado a {atRisk.Count} utilizadores");
    }
}
