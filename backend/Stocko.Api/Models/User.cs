namespace Stocko.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Plan { get; set; } = "free"; // free | plus | pro
    public string LeagueTier { get; set; } = "bronze";     // bronze | silver | gold | platinum | diamond | elite
    public string BestLeagueTier { get; set; } = "bronze"; // melhor tier alguma vez atingido
    public int StreakWeeks { get; set; } = 0;
    public int StreakBest { get; set; } = 0;
    public string? ExpoPushToken { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    public ICollection<Pick> Picks { get; set; } = new List<Pick>();
    public ICollection<WeeklyScore> WeeklyScores { get; set; } = new List<WeeklyScore>();
    public ICollection<Achievement> Achievements { get; set; } = new List<Achievement>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}