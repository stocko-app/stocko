namespace Stocko.Api.Models;

public class LeagueMember
{
    public Guid LeagueId { get; set; }
    public Guid UserId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    public League League { get; set; } = null!;
    public User User { get; set; } = null!;
}