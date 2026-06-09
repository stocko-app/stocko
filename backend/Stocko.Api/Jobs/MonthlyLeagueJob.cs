using Hangfire;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class MonthlyLeagueJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    private static readonly List<string> TierOrder = new()
    {
        "bronze", "silver", "gold", "platinum", "diamond", "elite"
    };

    private static readonly Dictionary<string, int> TierThresholds = new()
    {
        { "silver",   200  },
        { "platinum", 500  },
        { "diamond",  1000 },
        { "elite",    1000 }
    };

    public MonthlyLeagueJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [DisableConcurrentExecution(60 * 30)]
    public async Task ExecuteAsync()
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(10));
        Console.WriteLine($"🕐 MonthlyLeagueJob iniciado: {DateTime.UtcNow:yyyy-MM-dd HH:mm}");

        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StockoDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var totalUsers = await db.Users.CountAsync(cts.Token);
        var activeTiers = GetActiveTiers(totalUsers);

        Console.WriteLine($"📊 Total utilizadores: {totalUsers} | Tiers activos: {string.Join(", ", activeTiers)}");

        var now = DateTime.UtcNow;
        var firstDayLastMonth = DateOnly.FromDateTime(new DateTime(now.Year, now.Month, 1).AddMonths(-1));
        var lastDayLastMonth = DateOnly.FromDateTime(new DateTime(now.Year, now.Month, 1).AddDays(-1));

        Console.WriteLine($"📅 Período: {firstDayLastMonth} → {lastDayLastMonth}");

        int promoted = 0;
        int relegated = 0;

        foreach (var tier in activeTiers)
        {
            cts.Token.ThrowIfCancellationRequested();

            var usersInTier = await db.Users
                .Where(u => u.LeagueTier == tier)
                .ToListAsync(cts.Token);

            if (usersInTier.Count < 2) continue;

            var userIds = usersInTier.Select(u => u.Id).ToList();
            var dailyTotals = await db.DailyScores
                .Where(ds => userIds.Contains(ds.UserId) &&
                             ds.Date >= firstDayLastMonth &&
                             ds.Date <= lastDayLastMonth)
                .GroupBy(ds => ds.UserId)
                .Select(g => new { UserId = g.Key, Points = g.Sum(ds => ds.Total) })
                .ToListAsync(cts.Token);

            var monthlyPoints = usersInTier
                .Select(u => new
                {
                    User = u,
                    Points = dailyTotals.FirstOrDefault(d => d.UserId == u.Id)?.Points ?? 0m
                })
                .OrderByDescending(x => x.Points)
                .ToList();

            var count = monthlyPoints.Count;
            var promotionCount = Math.Max(1, (int)Math.Ceiling(count * 0.2));
            var relegationCount = Math.Max(1, (int)Math.Floor(count * 0.2));

            var nextTier = GetNextTier(tier, activeTiers);
            var prevTier = GetPrevTier(tier, activeTiers);

            if (nextTier != null)
            {
                for (int i = 0; i < promotionCount; i++)
                {
                    var user = monthlyPoints[i].User;
                    user.LeagueTier = nextTier;

                    if (TierOrder.IndexOf(nextTier) > TierOrder.IndexOf(user.BestLeagueTier))
                        user.BestLeagueTier = nextTier;

                    promoted++;
                    await notificationService.SendTierPromotionAsync(user.Id, nextTier);
                }
            }

            if (prevTier != null)
            {
                for (int i = count - relegationCount; i < count; i++)
                {
                    monthlyPoints[i].User.LeagueTier = prevTier;
                    relegated++;
                }
            }
        }

        await db.SaveChangesAsync(cts.Token);
        Console.WriteLine($"✅ MonthlyLeagueJob concluído — promovidos: {promoted} | relegados: {relegated}");
    }

    private List<string> GetActiveTiers(int totalUsers)
    {
        var active = new List<string> { "bronze", "gold" };

        if (totalUsers >= TierThresholds["silver"])
            active.Insert(1, "silver");

        if (totalUsers >= TierThresholds["platinum"])
            active.Add("platinum");

        if (totalUsers >= TierThresholds["diamond"])
        {
            active.Add("diamond");
            active.Add("elite");
        }

        return active;
    }

    private static string? GetNextTier(string tier, List<string> activeTiers)
    {
        var idx = activeTiers.IndexOf(tier);
        return idx >= 0 && idx < activeTiers.Count - 1 ? activeTiers[idx + 1] : null;
    }

    private static string? GetPrevTier(string tier, List<string> activeTiers)
    {
        var idx = activeTiers.IndexOf(tier);
        return idx > 0 ? activeTiers[idx - 1] : null;
    }
}
