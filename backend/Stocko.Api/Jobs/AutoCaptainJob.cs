using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class AutoCaptainJob
{
    private readonly StockoDbContext _db;
    private readonly GameWeekService _gameWeekService;
    private readonly NotificationService _notificationService;

    public AutoCaptainJob(StockoDbContext db, GameWeekService gameWeekService, NotificationService notificationService)
    {
        _db = db;
        _gameWeekService = gameWeekService;
        _notificationService = notificationService;
    }

    public async Task ExecuteAsync()
    {
        Console.WriteLine($"🕐 AutoCaptainJob iniciado: {DateTime.UtcNow:HH:mm:ss}");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentWeek = _gameWeekService.GetOrCreateCurrentWeek();

        // Picks desta semana sem capitão activado
        var picksWithoutCaptain = await _db.Picks
            .Include(p => p.Stock)
            .Where(p => p.GameWeekId == currentWeek.Id && p.CaptainActivatedDay == null)
            .OrderBy(p => p.UserId)
            .ThenBy(p => p.CreatedAt)
            .ToListAsync();

        if (!picksWithoutCaptain.Any())
        {
            Console.WriteLine("⏭️ AutoCaptainJob: nenhum utilizador sem capitão");
            return;
        }

        // Agrupar por utilizador e aplicar ao 1º pick de cada um
        var grouped = picksWithoutCaptain.GroupBy(p => p.UserId);
        int count = 0;

        foreach (var group in grouped)
        {
            var firstPick = group.First();
            firstPick.CaptainActivatedDay = today;
            count++;

            await _notificationService.SendAutoCaptainAsync(group.Key, firstPick.Stock.Ticker);
        }

        await _db.SaveChangesAsync();
        Console.WriteLine($"✅ AutoCaptainJob: capitão auto-aplicado a {count} utilizadores");
    }
}
