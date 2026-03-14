namespace Stocko.Api.Models;

public class DailyScore
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PickId { get; set; }
    public Guid StockId { get; set; }
    public DateOnly Date { get; set; }
    public decimal BasePoints { get; set; }        // MAX(0, MIN(30, pctChange + 15))
    public decimal DayPositiveBonus { get; set; }  // +1 se dia positivo
    public decimal CaptainBonus { get; set; }      // pontos extra pelo capitão x2
    public decimal Total { get; set; }             // BasePoints + DayPositiveBonus + CaptainBonus
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    public User User { get; set; } = null!;
    public Pick Pick { get; set; } = null!;
    public Stock Stock { get; set; } = null!;
}