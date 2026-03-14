namespace Stocko.Api.Models;

public class League
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty; // código único de convite
    public Guid OwnerId { get; set; }
    public int MaxMembers { get; set; } = 10; // 10 free / ilimitado plus
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    public User Owner { get; set; } = null!;
    public ICollection<LeagueMember> Members { get; set; } = new List<LeagueMember>();
}