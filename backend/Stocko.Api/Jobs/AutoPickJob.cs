using Hangfire;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Models;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class AutoPickJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    public AutoPickJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [DisableConcurrentExecution(60 * 10)]
    public async Task ExecuteAsync()
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));
        Console.WriteLine($"🕐 AutoPickJob iniciado: {DateTime.UtcNow:HH:mm:ss}");

        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StockoDbContext>();
        var gameWeekService = scope.ServiceProvider.GetRequiredService<GameWeekService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var currentWeek = await gameWeekService.GetOrCreateCurrentWeekAsync();

        var previousWeek = await db.GameWeeks
            .Where(w => w.WeekEnd < currentWeek.WeekStart)
            .OrderByDescending(w => w.WeekEnd)
            .FirstOrDefaultAsync(cts.Token);

        if (previousWeek == null)
        {
            Console.WriteLine("⏭️ AutoPickJob: nenhuma semana anterior encontrada");
            return;
        }

        var allUsers = await db.Users.Select(u => u.Id).ToListAsync(cts.Token);

        var usersWithPicks = await db.Picks
            .Where(p => p.GameWeekId == currentWeek.Id)
            .Select(p => p.UserId)
            .Distinct()
            .ToListAsync(cts.Token);

        var usersWithoutPicks = allUsers
            .Where(u => !usersWithPicks.Contains(u))
            .ToList();

        var allPreviousPicks = await db.Picks
            .Where(p => usersWithoutPicks.Contains(p.UserId) && p.GameWeekId == previousWeek.Id)
            .ToListAsync(cts.Token);

        int autoPickCount = 0;

        foreach (var userId in usersWithoutPicks)
        {
            cts.Token.ThrowIfCancellationRequested();

            var previousPicks = allPreviousPicks.Where(p => p.UserId == userId).ToList();
            if (!previousPicks.Any()) continue;

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

            await db.Picks.AddRangeAsync(newPicks, cts.Token);
            autoPickCount++;

            var user = await db.Users.FindAsync([userId], cts.Token);
            if (user != null)
                await notificationService.SendAutoPickConfirmationAsync(userId, user.StreakWeeks);
        }

        await db.SaveChangesAsync(cts.Token);
        Console.WriteLine($"✅ AutoPickJob: {autoPickCount} utilizadores receberam auto-pick");
    }
}
