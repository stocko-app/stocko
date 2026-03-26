using Stocko.Api.Data;
using Stocko.Api.Models;

namespace Stocko.Api.Services;

public class AchievementService
{
    private readonly StockoDbContext _db;
    private readonly NotificationService _notificationService;

    public AchievementService(StockoDbContext db, NotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task CheckAndAwardAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return;

        var existing = _db.Achievements
            .Where(a => a.UserId == userId)
            .Select(a => a.Type)
            .ToHashSet();

        var weeksPlayed = _db.WeeklyScores.Count(ws => ws.UserId == userId);
        Console.WriteLine($"🔍 CheckAchievements: userId={userId} weeksPlayed={weeksPlayed} existing={existing.Count}");

        var newAchievements = new List<Achievement>();

        await CheckFirstWeek(userId, existing, newAchievements);
        await CheckStreaks(userId, user, existing, newAchievements);
        await CheckRankingAchievements(userId, existing, newAchievements);
        await CheckCaptainAchievements(userId, existing, newAchievements);
        await CheckLeagueAchievements(userId, existing, newAchievements);

        if (newAchievements.Any())
        {
            await _db.Achievements.AddRangeAsync(newAchievements);
            await _db.SaveChangesAsync();

            foreach (var a in newAchievements)
            {
                Console.WriteLine($"🏅 Achievement desbloqueado: {userId} → {a.Type}");
                await _notificationService.SendAchievementAsync(userId, a.Type);
            }
        }
    }

    private async Task CheckFirstWeek(Guid userId, HashSet<string> existing, List<Achievement> newAchievements)
    {
        if (existing.Contains("first_week")) return;

        var weeksPlayed = _db.WeeklyScores.Count(ws => ws.UserId == userId);
        if (weeksPlayed >= 1)
            newAchievements.Add(Award(userId, "first_week"));
    }

    private async Task CheckStreaks(Guid userId, Models.User user, HashSet<string> existing, List<Achievement> newAchievements)
    {
        var streak = user.StreakWeeks;

        if (!existing.Contains("streak_4") && streak >= 4)
            newAchievements.Add(Award(userId, "streak_4"));

        if (!existing.Contains("streak_8") && streak >= 8)
            newAchievements.Add(Award(userId, "streak_8"));

        if (!existing.Contains("streak_12") && streak >= 12)
            newAchievements.Add(Award(userId, "streak_12"));

        if (!existing.Contains("streak_52") && streak >= 52)
            newAchievements.Add(Award(userId, "streak_52"));
    }

    private async Task CheckRankingAchievements(Guid userId, HashSet<string> existing, List<Achievement> newAchievements)
    {
        var scores = _db.WeeklyScores
            .Where(ws => ws.UserId == userId)
            .ToList();

        if (!scores.Any()) return;

        if (!existing.Contains("top_10pct") && scores.Any(s => s.Percentile >= 90))
            newAchievements.Add(Award(userId, "top_10pct"));

        if (!existing.Contains("top_1pct") && scores.Any(s => s.Percentile >= 99))
            newAchievements.Add(Award(userId, "top_1pct"));

        if (!existing.Contains("weekly_champion") && scores.Any(s => s.RankGlobal == 1))
            newAchievements.Add(Award(userId, "weekly_champion"));

        if (!existing.Contains("top_of_tier") && scores.Any(s => s.RankTier == 1))
            newAchievements.Add(Award(userId, "top_of_tier"));

        var recentScores = scores
            .OrderByDescending(s => s.CreatedAt)
            .Take(4)
            .ToList();

        if (!existing.Contains("consistent_tier") &&
            recentScores.Count == 4 &&
            recentScores.All(s => s.Percentile >= 75))
            newAchievements.Add(Award(userId, "consistent_tier"));
    }

    private async Task CheckCaptainAchievements(Guid userId, HashSet<string> existing, List<Achievement> newAchievements)
    {
        if (existing.Contains("captain_correct") && existing.Contains("never_waste_captain"))
            return;

        var gameWeeks = _db.GameWeeks
            .OrderByDescending(gw => gw.WeekStart)
            .Take(8)
            .Select(gw => gw.Id)
            .ToList();

        var picksWithManualCaptain = _db.Picks
            .Where(p => p.UserId == userId &&
                       gameWeeks.Contains(p.GameWeekId) &&
                       p.CaptainActivatedDay != null &&
                       !p.IsAuto)
            .Select(p => p.GameWeekId)
            .Distinct()
            .Count();

        if (!existing.Contains("never_waste_captain") && picksWithManualCaptain >= 8)
            newAchievements.Add(Award(userId, "never_waste_captain"));
    }

    private async Task CheckLeagueAchievements(Guid userId, HashSet<string> existing, List<Achievement> newAchievements)
    {
        if (!existing.Contains("league_founder"))
        {
            var isOwner = _db.Leagues.Any(l => l.OwnerId == userId);
            if (isOwner)
                newAchievements.Add(Award(userId, "league_founder"));
        }

        if (!existing.Contains("tier_promoted"))
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null && user.LeagueTier != "bronze")
                newAchievements.Add(Award(userId, "tier_promoted"));
        }
    }

    private static Achievement Award(Guid userId, string type) => new Achievement
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Type = type,
        EarnedAt = DateTime.UtcNow
    };
}