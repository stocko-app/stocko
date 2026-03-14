namespace Stocko.Api.Models;

public class Stock
{
    public Guid Id { get; set; }
    public string Ticker { get; set; } = string.Empty;   // ex: AAPL, EDP.LS
    public string Name { get; set; } = string.Empty;     // ex: Apple Inc.
    public string Market { get; set; } = string.Empty;   // US | EU | PT
    public string Sector { get; set; } = string.Empty;   // Technology | Energy | etc.
    public string IndexReference { get; set; } = "SP500"; // SP500 | PSI20 | EUROSTOXX
    public bool Active { get; set; } = true;

    // Navegação
    public ICollection<StockPrice> Prices { get; set; } = new List<StockPrice>();
    public ICollection<Pick> Picks { get; set; } = new List<Pick>();
}