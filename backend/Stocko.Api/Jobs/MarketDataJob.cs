using Microsoft.EntityFrameworkCore;
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

    public async Task ExecuteAsync()
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(8));
        Console.WriteLine($"🕐 MarketDataJob iniciado: {DateTime.UtcNow:HH:mm:ss}");
        try
        {
            List<string> tickers;
            await using (var listScope = _scopeFactory.CreateAsyncScope())
            {
                var db = listScope.ServiceProvider.GetRequiredService<StockoDbContext>();
                tickers = await db.Stocks
                    .Where(s => s.Active)
                    .Select(s => s.Ticker)
                    .ToListAsync(cts.Token);
            }

            foreach (var ticker in tickers)
            {
                cts.Token.ThrowIfCancellationRequested();
                await using (var workScope = _scopeFactory.CreateAsyncScope())
                {
                    var marketData = workScope.ServiceProvider.GetRequiredService<MarketDataService>();
                    await marketData.FetchAndCachePriceAsync(ticker);
                }

                await Task.Delay(8000, cts.Token);
            }

            Console.WriteLine($"✅ MarketDataJob concluído: {DateTime.UtcNow:HH:mm:ss}");
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine($"⏱️ MarketDataJob cancelado por timeout às {DateTime.UtcNow:HH:mm:ss}");
        }
    }
}
