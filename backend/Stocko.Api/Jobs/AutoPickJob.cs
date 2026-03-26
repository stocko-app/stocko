using Stocko.Api.Data;
using Stocko.Api.Models;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class AutoPickJob
{
    private readonly StockoDbContext _db;
    private readonly GameWeekService _gameWeekService;
    private readonly NotificationService _notificationService;

    public AutoPickJob(StockoDbContext db, GameWeekService gameWeekService, NotificationService notificationService)
    {
        _db = db;
        _gameWeekService = gameWeekService;
        _notificationService = notificationService;
    }

    public async Task ExecuteAsync()
    {
        Console.WriteLine($"🕐 AutoPickJob iniciado: {DateTime.UtcNow:HH:mm:ss}");

        var currentWeek = _gameWeekService.GetOrCreateCurrentWeek();

        // Buscar semana anterior
        var previousWeek = _db.GameWeeks
            .Where(w => w.WeekEnd < currentWeek.WeekStart)
            .OrderByDescending(w => w.WeekEnd)
            .FirstOrDefault();

        if (previousWeek == null)
        {
            Console.WriteLine("⏭️ AutoPickJob: nenhuma semana anterior encontrada");
            return;
        }

        // Buscar todos os utilizadores
        var allUsers = _db.Users.Select(u => u.Id).ToList();

        // Buscar utilizadores que já fizeram picks esta semana
        var usersWithPicks = _db.Picks
            .Where(p => p.GameWeekId == currentWeek.Id)
            .Select(p => p.UserId)
            .Distinct()
            .ToList();

        // Utilizadores sem picks esta semana
        var usersWithoutPicks = allUsers
            .Where(u => !usersWithPicks.Contains(u))
            .ToList();

        int autoPickCount = 0;

        foreach (var userId in usersWithoutPicks)
        {
            // Buscar picks da semana anterior
            var previousPicks = _db.Picks
                .Where(p => p.UserId == userId && p.GameWeekId == previousWeek.Id)
                .ToList();

            if (!previousPicks.Any()) continue;

            // Copiar picks para a semana actual
            var newPicks = previousPicks.Select(p => new Pick
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                GameWeekId = currentWeek.Id,
                StockId = p.StockId,
                IsCaptainDraft = p.IsCaptainDraft,
                CaptainActivatedDay = null,
                Points = 0,
                IsAuto = true,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await _db.Picks.AddRangeAsync(newPicks);
            autoPickCount++;

            var user = await _db.Users.FindAsync(userId);
            if (user != null)
                await _notificationService.SendAutoPickConfirmationAsync(userId, user.StreakWeeks);
        }

        await _db.SaveChangesAsync();
        Console.WriteLine($"✅ AutoPickJob: {autoPickCount} utilizadores receberam auto-pick");
    }
}