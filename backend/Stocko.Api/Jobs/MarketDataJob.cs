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
        Console.WriteLine($"🕐 MarketDataJob iniciado: {DateTime.UtcNow:HH:mm:ss}");
        await _marketData.FetchActiveStocksAsync();
        Console.WriteLine($"✅ MarketDataJob concluído: {DateTime.UtcNow:HH:mm:ss}");
    }
}