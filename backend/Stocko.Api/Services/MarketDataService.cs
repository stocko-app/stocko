using System.Text.Json;
using Stocko.Api.Data;
using Stocko.Api.Models;

namespace Stocko.Api.Services;

public class MarketDataService
{
    private readonly HttpClient _http;
    private readonly StockoDbContext _db;
    private readonly string _apiKey;

    public MarketDataService(HttpClient http, StockoDbContext db, IConfiguration config)
    {
        _http = http;
        _db = db;
        _apiKey = config["AlphaVantage:ApiKey"]!;
    }

    public async Task FetchAndCachePriceAsync(string ticker)
    {
        try
        {
            var url = $"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={_apiKey}";
            var response = await _http.GetStringAsync(url);
            var json = JsonDocument.Parse(response);

            if (!json.RootElement.TryGetProperty("Global Quote", out var quote))
                return;

            if (!quote.TryGetProperty("05. price", out var priceEl) ||
                !quote.TryGetProperty("08. previous close", out var prevEl) ||
                !quote.TryGetProperty("07. latest trading day", out var dateEl))
                return;

            if (!decimal.TryParse(priceEl.GetString(), System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var price))
                return;

            if (!decimal.TryParse(prevEl.GetString(), System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var prevClose))
                return;

            if (!DateOnly.TryParse(dateEl.GetString(), out var date))
                return;

            var pctChange = prevClose != 0
                ? Math.Round((price - prevClose) / prevClose * 100, 4)
                : 0;

            var stock = _db.Stocks.FirstOrDefault(s => s.Ticker == ticker);
            if (stock == null) return;

            // Verificar se já existe para este dia
            var exists = _db.StockPrices.Any(p => p.StockId == stock.Id && p.Date == date);
            if (exists) return;

            var stockPrice = new StockPrice
            {
                Id = Guid.NewGuid(),
                StockId = stock.Id,
                Date = date,
                Open = prevClose,
                Close = price,
                PctChange = pctChange,
                BeatIndex = false, // calculado depois
                Dividend = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.StockPrices.Add(stockPrice);
            await _db.SaveChangesAsync();

            Console.WriteLine($"✅ {ticker}: {price} ({pctChange:+0.00;-0.00}%)");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Erro ao buscar {ticker}: {ex.Message}");
        }
    }

    public async Task FetchAllActiveStocksAsync()
    {
        var stocks = _db.Stocks
            .Where(s => s.Active && s.Market == "US")
            .Select(s => s.Ticker)
            .Take(5) // começar com 5 para testar
            .ToList();

        foreach (var ticker in stocks)
        {
            await FetchAndCachePriceAsync(ticker);
            await Task.Delay(1200); // respeitar limite de 5 calls/min
        }
    }
}