namespace Stocko.Api.Models;

public class Subscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public string Type { get; set; } = string.Empty; // plus | pro | pass_weekly | pass_monthly | battle_royale
    public string Status { get; set; } = "active";   // active | cancelled | expired
    public DateTime? ValidUntil { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    public User User { get; set; } = null!;
}