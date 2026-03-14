namespace Stocko.Api.Models;

public class Pick
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid GameWeekId { get; set; }
    public Guid StockId { get; set; }
    public DateOnly? CaptainActivatedDay { get; set; } // NULL = por activar · data = dia activado
    public bool IsCaptainDraft { get; set; } = false;  // capitão definido no momento do draft
    public decimal Points { get; set; } = 0;           // pontos acumulados na semana
    public bool IsAuto { get; set; } = false;          // foi auto-pick?
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    public User User { get; set; } = null!;
    public GameWeek GameWeek { get; set; } = null!;
    public Stock Stock { get; set; } = null!;
    public ICollection<DailyScore> DailyScores { get; set; } = new List<DailyScore>();
}