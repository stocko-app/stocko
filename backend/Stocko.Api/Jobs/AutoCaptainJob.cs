using Hangfire;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class AutoCaptainJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    public AutoCaptainJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [DisableConcurrentExecution(60 * 10)]
    public async Task ExecuteAsync()
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));
        Console.WriteLine($"🕐 AutoCaptainJob iniciado: {DateTime.UtcNow:HH:mm:ss}");

        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StockoDbContext>();
        var gameWeekService = scope.ServiceProvider.GetRequiredService<GameWeekService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentWeek = await gameWeekService.GetOrCreateCurrentWeekAsync();

        var picksWithoutCaptain = await db.Picks
            .Include(p => p.Stock)
            .Where(p => p.GameWeekId == currentWeek.Id && p.CaptainActivatedDay == null)
            .OrderBy(p => p.UserId)
            .ThenBy(p => p.CreatedAt)
            .ToListAsync(cts.Token);

        if (!picksWithoutCaptain.Any())
        {
            Console.WriteLine("⏭️ AutoCaptainJob: nenhum utilizador sem capitão");
            return;
        }

        var grouped = picksWithoutCaptain.GroupBy(p => p.UserId);
        int count = 0;

        foreach (var group in grouped)
        {
            cts.Token.ThrowIfCancellationRequested();

            var firstPick = group.First();
            firstPick.CaptainActivatedDay = today;
            count++;

            await notificationService.SendAutoCaptainAsync(group.Key, firstPick.Stock.Ticker);
        }

        await db.SaveChangesAsync(cts.Token);
        Console.WriteLine($"✅ AutoCaptainJob: capitão auto-aplicado a {count} utilizadores");
    }
}
