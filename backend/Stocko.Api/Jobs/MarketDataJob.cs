using Microsoft.EntityFrameworkCore;
using Hangfire;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

/// <summary>
/// Cada ticker corre num scope próprio para não manter DbContext/conexão
/// durante os delays de 8s entre chamadas às APIs (evita timeouts Npgsql).
/// </summary>
public class MarketDataJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    public MarketDataJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [DisableConcurrentExecution(60 * 10)]
    public async Task ExecuteAsync()
        => await ExecuteForMarketsAsync(null, "ALL");

    [DisableConcurrentExecution(60 * 10)]
    public async Task ExecuteJPAsync()
        => await ExecuteForMarketsAsync(["JP"], "JP");

    [DisableConcurrentExecution(60 * 10)]
    public async Task ExecuteEUAsync()
        => await ExecuteForMarketsAsync(["EU", "PT"], "EU/PT");

    [DisableConcurrentExecution(60 * 10)]
    public async Task ExecuteUSAsync()
        => await ExecuteForMarketsAsync(["US", "EMERGING"], "US/EMERGING");

    [DisableConcurrentExecution(60 * 10)]
    public async Task ExecuteCryptoAsync()
        => await ExecuteForMarketsAsync(["CRYPTO", "COMMODITY"], "CRYPTO/COMMODITY");

    private async Task ExecuteForMarketsAsync(string[]? markets, string label)
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(8));
        Console.WriteLine($"🕐 MarketDataJob [{label}] iniciado: {DateTime.UtcNow:HH:mm:ss}");
        try
        {
            List<string> tickers;
            await using (var listScope = _scopeFactory.CreateAsyncScope())
            {
                var db = listScope.ServiceProvider.GetRequiredService<StockoDbContext>();

                var query = db.Stocks.Where(s => s.Active);
                if (markets != null)
                    query = query.Where(s => markets.Contains(s.Market));

                tickers = await query
                    .Select(s => s.Ticker)
                    .ToListAsync(cts.Token);
            }

            foreach (var ticker in tickers)
            {
                cts.Token.ThrowIfCancellationRequested();
                await using (var workScope = _scopeFactory.CreateAsyncScope())
                {
                    var marketData = workScope.ServiceProvider.GetRequiredService<MarketDataService>();
                    await marketData.FetchAndCachePriceAsync(ticker, cts.Token);
                }

                await Task.Delay(8000, cts.Token);
            }

            Console.WriteLine($"✅ MarketDataJob [{label}] concluído: {DateTime.UtcNow:HH:mm:ss}");
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine($"⏱️ MarketDataJob [{label}] cancelado por timeout às {DateTime.UtcNow:HH:mm:ss}");
        }
    }
}
