namespace Stocko.Api.Models;

public class WeeklyScore
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid GameWeekId { get; set; }
    public decimal TotalPoints { get; set; }
    public int RankGlobal { get; set; }
    public int RankTier { get; set; }
    public decimal Percentile { get; set; }        // top X% global
    public decimal IndexBonusTotal { get; set; }   // total de bónus carteira vs S&P500
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    public User User { get; set; } = null!;
    public GameWeek GameWeek { get; set; } = null!;
}