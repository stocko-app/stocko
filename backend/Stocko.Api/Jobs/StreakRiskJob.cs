using Hangfire;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class StreakRiskJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    public StreakRiskJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [DisableConcurrentExecution(60 * 10)]
    public async Task ExecuteAsync()
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));
        Console.WriteLine($"🕐 StreakRiskJob iniciado: {DateTime.UtcNow:HH:mm:ss}");

        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StockoDbContext>();
        var gameWeekService = scope.ServiceProvider.GetRequiredService<GameWeekService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var currentWeek = await gameWeekService.GetOrCreateCurrentWeekAsync();

        var usersWithPicks = (await db.Picks
            .Where(p => p.GameWeekId == currentWeek.Id)
            .Select(p => p.UserId)
            .Distinct()
            .ToListAsync(cts.Token)).ToHashSet();

        var atRisk = await db.Users
            .Where(u => u.StreakWeeks > 3 && !usersWithPicks.Contains(u.Id))
            .ToListAsync(cts.Token);

        if (!atRisk.Any())
        {
            Console.WriteLine("⏭️ StreakRiskJob: nenhum utilizador em risco");
            return;
        }

        foreach (var user in atRisk)
        {
            cts.Token.ThrowIfCancellationRequested();
            await notificationService.SendStreakRiskAsync(user.Id, user.StreakWeeks);
        }

        Console.WriteLine($"✅ StreakRiskJob: aviso enviado a {atRisk.Count} utilizadores");
    }
}
