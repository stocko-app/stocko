using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class MarketDataJob
{
    private readonly MarketDataService _marketData;

    public MarketDataJob(MarketDataService marketData)
    {
        _marketData = marketData;
    }

    public async Task ExecuteAsync()
    {
        // Timeout global de 8 minutos — garante que o job nunca bloqueia um worker indefinidamente
        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(8));
        Console.WriteLine($"🕐 MarketDataJob iniciado: {DateTime.UtcNow:HH:mm:ss}");
        try
        {
            await _marketData.FetchActiveStocksAsync(cts.Token);
            Console.WriteLine($"✅ MarketDataJob concluído: {DateTime.UtcNow:HH:mm:ss}");
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine($"⏱️ MarketDataJob cancelado por timeout às {DateTime.UtcNow:HH:mm:ss}");
        }
    }
}