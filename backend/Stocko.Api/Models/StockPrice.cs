namespace Stocko.Api.Models;

public class StockPrice
{
    public Guid Id { get; set; }
    public Guid StockId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Open { get; set; }
    public decimal Close { get; set; }
    public decimal PctChange { get; set; }  // (Close - Open) / Open * 100
    public bool BeatIndex { get; set; }     // bateu o índice de referência?
    public bool Dividend { get; set; }      // pagou dividendo neste dia?
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    public Stock Stock { get; set; } = null!;
}