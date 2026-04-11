using System.Text.Json;
using Stocko.Api.Data;
using Stocko.Api.Models;

namespace Stocko.Api.Services;

public class MarketDataService
{
    private readonly HttpClient _http;
    private readonly StockoDbContext _db;
    private readonly string _twelveDataKey;
    private readonly string _finnhubKey;
    private readonly string _alphaVantageKey;

    public MarketDataService(HttpClient http, StockoDbContext db, IConfiguration config)
    {
        _http = http;
        _db = db;
        _twelveDataKey = config["MarketData:TwelveDataApiKey"]!;
        _finnhubKey = config["MarketData:FinnhubApiKey"]!;
        _alphaVantageKey = config["AlphaVantage:ApiKey"]!;
    }

    public async Task<StockPriceResult?> FetchFromTwelveDataAsync(string ticker)
    {
        try
        {
            Console.WriteLine($"🔄 TwelveData: {ticker}");
            var url = $"https://api.twelvedata.com/quote?symbol={ticker}&apikey={_twelveDataKey}";
            var response = await _http.GetStringAsync(url);
            var json = JsonDocument.Parse(response);

            if (json.RootElement.TryGetProperty("status", out var status) &&
                status.GetString() == "error")
            {
                Console.WriteLine($"❌ TwelveData erro: {json.RootElement.GetProperty("message").GetString()}");
                return null;
            }

            var close = json.RootElement.GetProperty("close").GetString();
            var open = json.RootElement.GetProperty("open").GetString();
            var dateStr = json.RootElement.GetProperty("datetime").GetString();

            if (!decimal.TryParse(close, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var closePrice)) return null;
            if (!decimal.TryParse(open, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var openPrice)) return null;
            if (!DateOnly.TryParse(dateStr?.Split(" ")[0], out var date)) return null;

            var pctChange = openPrice != 0
                ? Math.Round((closePrice - openPrice) / openPrice * 100, 4)
                : 0;

            return new StockPriceResult
            {
                Date = date,
                Open = openPrice,
                Close = closePrice,
                PctChange = pctChange,
                Source = "TwelveData"
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ TwelveData excepção: {ex.Message}");
            return null;
        }
    }

    public async Task<StockPriceResult?> FetchFromFinnhubAsync(string ticker)
    {
        try
        {
            Console.WriteLine($"🔄 Finnhub: {ticker}");
            var url = $"https://finnhub.io/api/v1/quote?symbol={ticker}&token={_finnhubKey}";
            var response = await _http.GetStringAsync(url);
            var json = JsonDocument.Parse(response);

            var current = json.RootElement.GetProperty("c").GetDecimal();
            var open = json.RootElement.GetProperty("o").GetDecimal();

            if (current == 0) return null;

            var pctChange = open != 0
                ? Math.Round((current - open) / open * 100, 4)
                : 0;

            return new StockPriceResult
            {
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
                Open = open,
                Close = current,
                PctChange = pctChange,
                Source = "Finnhub"
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Finnhub excepção: {ex.Message}");
            return null;
        }
    }

    public async Task<StockPriceResult?> FetchFromAlphaVantageAsync(string ticker)
    {
        try
        {
            Console.WriteLine($"🔄 AlphaVantage: {ticker}");
            var url = $"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={_alphaVantageKey}";
            var response = await _http.GetStringAsync(url);
            var json = JsonDocument.Parse(response);

            if (!json.RootElement.TryGetProperty("Global Quote", out var quote)) return null;

            var price = quote.GetProperty("05. price").GetString();
            var prev = quote.GetProperty("08. previous close").GetString();
            var dateStr = quote.GetProperty("07. latest trading day").GetString();

            if (!decimal.TryParse(price, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var closePrice)) return null;
            if (!decimal.TryParse(prev, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var prevClose)) return null;
            if (!DateOnly.TryParse(dateStr, out var date)) return null;

            var pctChange = prevClose != 0
                ? Math.Round((closePrice - prevClose) / prevClose * 100, 4)
                : 0;

            return new StockPriceResult
            {
                Date = date,
                Open = prevClose,
                Close = closePrice,
                PctChange = pctChange,
                Source = "AlphaVantage"
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ AlphaVantage excepção: {ex.Message}");
            return null;
        }
    }

    public async Task FetchAndCachePriceAsync(string ticker)
    {
        var stock = _db.Stocks.FirstOrDefault(s => s.Ticker == ticker);
        if (stock == null) return;

        var result = await FetchFromTwelveDataAsync(ticker)
                  ?? await FetchFromFinnhubAsync(ticker)
                  ?? await FetchFromAlphaVantageAsync(ticker);

        if (result == null)
        {
            Console.WriteLine($"❌ {ticker}: todas as APIs falharam");
            return;
        }

        var exists = _db.StockPrices.Any(p => p.StockId == stock.Id && p.Date == result.Date);
        if (exists)
        {
            var existing = _db.StockPrices.First(p => p.StockId == stock.Id && p.Date == result.Date);
            existing.Close = result.Close;
            existing.PctChange = result.PctChange;
        }
        else
        {
            _db.StockPrices.Add(new StockPrice
            {
                Id = Guid.NewGuid(),
                StockId = stock.Id,
                Date = result.Date,
                Open = result.Open,
                Close = result.Close,
                PctChange = result.PctChange,
                BeatIndex = false,
                Dividend = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        Console.WriteLine($"✅ {ticker} ({result.Source}): {result.Close} ({result.PctChange:+0.00;-0.00}%)");
    }

    public async Task FetchActiveStocksAsync(CancellationToken ct = default)
    {
        var tickers = _db.Stocks
            .Where(s => s.Active)
            .Select(s => s.Ticker)
            .ToList();

        foreach (var ticker in tickers)
        {
            ct.ThrowIfCancellationRequested();
            await FetchAndCachePriceAsync(ticker);
            await Task.Delay(8000, ct); // respeitar limite TwelveData: 8 calls/min
        }
    }
}

public class StockPriceResult
{
    public DateOnly Date { get; set; }
    public decimal Open { get; set; }
    public decimal Close { get; set; }
    public decimal PctChange { get; set; }
    public string Source { get; set; } = string.Empty;
}