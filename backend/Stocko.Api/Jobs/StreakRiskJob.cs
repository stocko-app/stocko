using Microsoft.EntityFrameworkCore;
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

        var currentWeek = await _gameWeekService.GetOrCreateCurrentWeekAsync();

        // Utilizadores que já fizeram picks esta semana
        var usersWithPicks = (await _db.Picks
            .Where(p => p.GameWeekId == currentWeek.Id)
            .Select(p => p.UserId)
            .Distinct()
            .ToListAsync()).ToHashSet();

        // Utilizadores com streak > 3 que NÃO fizeram picks esta semana
        var atRisk = await _db.Users
            .Where(u => u.StreakWeeks > 3 && !usersWithPicks.Contains(u.Id))
            .ToListAsync();

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
