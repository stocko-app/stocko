using Microsoft.Extensions.Caching.Memory;
using System.Xml.Linq;

namespace Stocko.Api.Services;

public class NewsService
{
    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;

    public NewsService(HttpClient http, IMemoryCache cache)
    {
        _http = http;
        _cache = cache;
    }

    public async Task<List<NewsItem>> GetNewsForTickersAsync(List<string> tickers)
    {
        var allNews = new List<NewsItem>();

        foreach (var ticker in tickers)
        {
            var news = await GetNewsForTickerAsync(ticker);
            allNews.AddRange(news);
        }

        return allNews
            .OrderByDescending(n => n.PublishedAt)
            .ToList();
    }

    public async Task<List<NewsItem>> GetNewsForTickerAsync(string ticker)
    {
        var cacheKey = $"news_{ticker}";

        if (_cache.TryGetValue(cacheKey, out List<NewsItem>? cached) && cached != null)
            return cached;

        var news = await FetchFromYahooAsync(ticker);

        _cache.Set(cacheKey, news, TimeSpan.FromHours(2));
        return news;
    }

    private async Task<List<NewsItem>> FetchFromYahooAsync(string ticker)
    {
        try
        {
            var url = $"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker}&region=US&lang=en-US";
            var xml = await _http.GetStringAsync(url);

            var doc = XDocument.Parse(xml);

            return doc.Descendants("item")
                .Take(5)
                .Select(item => new NewsItem
                {
                    Ticker = ticker,
                    Title = item.Element("title")?.Value ?? "",
                    Url = item.Element("link")?.Value ?? "",
                    Source = item.Element("source")?.Value ?? "Yahoo Finance",
                    PublishedAt = DateTime.TryParse(item.Element("pubDate")?.Value, out var dt)
                        ? dt.ToUniversalTime()
                        : DateTime.UtcNow
                })
                .ToList();
        }
        catch
        {
            return new List<NewsItem>();
        }
    }
}

public class NewsItem
{
    public string Ticker { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
}
