using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class MonthlyLeagueJob
{
    private readonly StockoDbContext _db;
    private readonly NotificationService _notificationService;

    // Ordem dos tiers do mais baixo para o mais alto
    private static readonly List<string> TierOrder = new()
    {
        "bronze", "silver", "gold", "platinum", "diamond", "elite"
    };

    // Threshold de utilizadores para desbloquear cada tier
    private static readonly Dictionary<string, int> TierThresholds = new()
    {
        { "silver",   200  },
        { "platinum", 500  },
        { "diamond",  1000 },
        { "elite",    1000 }
    };

    public MonthlyLeagueJob(StockoDbContext db, NotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task ExecuteAsync()
    {
        Console.WriteLine($"🕐 MonthlyLeagueJob iniciado: {DateTime.UtcNow:yyyy-MM-dd HH:mm}");

        var totalUsers = _db.Users.Count();
        var activeTiers = GetActiveTiers(totalUsers);

        Console.WriteLine($"📊 Total utilizadores: {totalUsers} | Tiers activos: {string.Join(", ", activeTiers)}");

        // Dias do mês anterior — contagem exacta dia a dia
        var now = DateTime.UtcNow;
        var firstDayLastMonth = DateOnly.FromDateTime(new DateTime(now.Year, now.Month, 1).AddMonths(-1));
        var lastDayLastMonth = DateOnly.FromDateTime(new DateTime(now.Year, now.Month, 1).AddDays(-1));

        Console.WriteLine($"📅 Período: {firstDayLastMonth} → {lastDayLastMonth}");

        int promoted = 0;
        int relegated = 0;

        foreach (var tier in activeTiers)
        {
            var usersInTier = _db.Users
                .Where(u => u.LeagueTier == tier)
                .ToList();

            if (usersInTier.Count < 2) continue;

            // Pontos acumulados dia a dia no mês anterior (ignora fronteiras de semana)
            var userIds = usersInTier.Select(u => u.Id).ToList();
            var dailyTotals = _db.DailyScores
                .Where(ds => userIds.Contains(ds.UserId) &&
                             ds.Date >= firstDayLastMonth &&
                             ds.Date <= lastDayLastMonth)
                .GroupBy(ds => ds.UserId)
                .Select(g => new { UserId = g.Key, Points = g.Sum(ds => ds.Total) })
                .ToList();

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

            // Promover top 20%
            if (nextTier != null)
            {
                for (int i = 0; i < promotionCount; i++)
                {
                    var user = monthlyPoints[i].User;
                    user.LeagueTier = nextTier;

                    // Actualizar melhor tier histórico
                    if (TierOrder.IndexOf(nextTier) > TierOrder.IndexOf(user.BestLeagueTier))
                        user.BestLeagueTier = nextTier;

                    promoted++;
                    await _notificationService.SendTierPromotionAsync(user.Id, nextTier);
                }
            }

            // Relegar bottom 20% (sem notificação — mecânicas não prevêem)
            if (prevTier != null)
            {
                for (int i = count - relegationCount; i < count; i++)
                {
                    monthlyPoints[i].User.LeagueTier = prevTier;
                    relegated++;
                }
            }
        }

        await _db.SaveChangesAsync();
        Console.WriteLine($"✅ MonthlyLeagueJob concluído — promovidos: {promoted} | relegados: {relegated}");
    }

    private List<string> GetActiveTiers(int totalUsers)
    {
        // Bronze e Gold sempre activos (MVP)
        var active = new List<string> { "bronze", "gold" };

        if (totalUsers >= TierThresholds["silver"])
            active.Insert(1, "silver"); // bronze → silver → gold

        if (totalUsers >= TierThresholds["platinum"])
            active.Add("platinum"); // ... → gold → platinum

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
