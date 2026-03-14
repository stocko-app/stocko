namespace Stocko.Api.Models;

public class Achievement
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty; // first_week | streak_4 | top_10pct | etc.
    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    public User User { get; set; } = null!;
}