using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StocksController : ControllerBase
{
    private readonly StockoDbContext _db;

    public StocksController(StockoDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetStocks(
        [FromQuery] string? market,
        [FromQuery] string? sector,
        [FromQuery] string? search)
    {
        var query = _db.Stocks
            .Where(s => s.Active)
            .AsQueryable();

        if (!string.IsNullOrEmpty(market))
            query = query.Where(s => s.Market == market);

        if (!string.IsNullOrEmpty(sector))
            query = query.Where(s => s.Sector == sector);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s =>
                s.Ticker.Contains(search) ||
                s.Name.Contains(search));

        var stocks = await query
            .OrderBy(s => s.Market)
            .ThenBy(s => s.Ticker)
            .Select(s => new
            {
                s.Id,
                s.Ticker,
                s.Name,
                s.Market,
                s.Sector,
                s.IndexReference,
                LatestPrice = s.Prices
                    .OrderByDescending(p => p.Date)
                    .Select(p => new
                    {
                        p.Date,
                        p.Close,
                        p.PctChange,
                        p.BeatIndex,
                        p.Dividend
                    })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(stocks);
    }

    [HttpGet("{ticker}")]
    public async Task<IActionResult> GetStock(string ticker)
    {
        var stock = await _db.Stocks
            .Where(s => s.Ticker == ticker && s.Active)
            .Select(s => new
            {
                s.Id,
                s.Ticker,
                s.Name,
                s.Market,
                s.Sector,
                s.IndexReference,
                Prices = s.Prices
                    .OrderByDescending(p => p.Date)
                    .Take(30)
                    .Select(p => new
                    {
                        p.Date,
                        p.Open,
                        p.Close,
                        p.PctChange,
                        p.BeatIndex,
                        p.Dividend
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (stock == null)
            return NotFound($"Ação '{ticker}' não encontrada.");

        return Ok(stock);
    }
	
    [HttpGet("fetch/{ticker}")]
    public async Task<IActionResult> FetchPrice(string ticker, [FromServices] MarketDataService marketData)
    {
        await marketData.FetchAndCachePriceAsync(ticker);
        return Ok($"Preço de {ticker} actualizado.");
    }

    // GET /api/stocks/news — notícias das acções do utilizador (picks da semana actual)
    [HttpGet("news")]
    public async Task<IActionResult> GetNews(
        [FromServices] NewsService newsService,
        [FromServices] GameWeekService gameWeekService)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var gameWeek = gameWeekService.GetOrCreateCurrentWeek();

        var tickers = await _db.Picks
            .Where(p => p.UserId == userId && p.GameWeekId == gameWeek.Id)
            .Include(p => p.Stock)
            .Select(p => p.Stock.Ticker)
            .ToListAsync();

        if (!tickers.Any())
            return Ok(new { News = new List<object>() });

        var news = await newsService.GetNewsForTickersAsync(tickers);

        return Ok(new { News = news });
    }
}