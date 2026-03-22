using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Models;
using Stocko.Api.Services;

namespace Stocko.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PicksController : ControllerBase
{
    private readonly StockoDbContext _db;
    private readonly GameWeekService _gameWeekService;

    public PicksController(StockoDbContext db, GameWeekService gameWeekService)
    {
        _db = db;
        _gameWeekService = gameWeekService;
    }

    // POST /api/picks — submeter picks da semana
    [HttpPost]
    public async Task<IActionResult> SubmitPicks([FromBody] SubmitPicksRequest request)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized("Utilizador não encontrado.");

        var gameWeek = _gameWeekService.GetOrCreateCurrentWeek();

        // Verificar deadline
        if (_gameWeekService.IsDeadlinePassed(gameWeek))
            return BadRequest("O prazo para submeter picks já passou (Segunda 08h00).");

        // Verificar limite de picks por plano
        var maxPicks = user.Plan == "plus" || user.Plan == "pro" ? 5 : 3;
        if (request.Picks.Count > maxPicks)
            return BadRequest($"O teu plano permite no máximo {maxPicks} picks.");

        if (request.Picks.Count == 0)
            return BadRequest("Tens de escolher pelo menos 1 pick.");

        // Verificar capitão
        var captainCount = request.Picks.Count(p => p.IsCaptainDraft);
        if (captainCount > 1)
            return BadRequest("Só podes ter 1 capitão.");

        // Verificar se as ações existem
        var tickers = request.Picks.Select(p => p.Ticker).ToList();
        var stocks = await _db.Stocks
            .Where(s => tickers.Contains(s.Ticker) && s.Active)
            .ToListAsync();

        if (stocks.Count != tickers.Count)
            return BadRequest("Uma ou mais ações não são válidas.");

        // Remover picks anteriores desta semana
        var existingPicks = _db.Picks
            .Where(p => p.UserId == userId && p.GameWeekId == gameWeek.Id)
            .ToList();
        _db.Picks.RemoveRange(existingPicks);

        // Criar novos picks
        var picks = request.Picks.Select(p =>
        {
            var stock = stocks.First(s => s.Ticker == p.Ticker);
            return new Pick
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                GameWeekId = gameWeek.Id,
                StockId = stock.Id,
                IsCaptainDraft = p.IsCaptainDraft,
                CaptainActivatedDay = null,
                Points = 0,
                IsAuto = false,
                CreatedAt = DateTime.UtcNow
            };
        }).ToList();

        await _db.Picks.AddRangeAsync(picks);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            Message = $"{picks.Count} picks submetidos com sucesso.",
            GameWeekId = gameWeek.Id,
            Deadline = gameWeek.DraftDeadline,
            Picks = picks.Select(p => new
            {
                p.Id,
                Ticker = stocks.First(s => s.Id == p.StockId).Ticker,
                p.IsCaptainDraft
            })
        });
    }

    // GET /api/picks/week — ver picks da semana actual
    [HttpGet("week")]
    public async Task<IActionResult> GetCurrentWeekPicks()
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var gameWeek = _gameWeekService.GetOrCreateCurrentWeek();

        var picks = await _db.Picks
            .Where(p => p.UserId == userId && p.GameWeekId == gameWeek.Id)
            .Include(p => p.Stock)
            .Select(p => new
            {
                p.Id,
                p.Stock.Ticker,
                p.Stock.Name,
                p.Stock.Sector,
                p.IsCaptainDraft,
                p.CaptainActivatedDay,
                p.Points,
                p.IsAuto,
                LatestPrice = p.Stock.Prices
                    .OrderByDescending(x => x.Date)
                    .Select(x => new { x.Close, x.PctChange })
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(new
        {
            GameWeekId = gameWeek.Id,
            WeekStart = gameWeek.WeekStart,
            WeekEnd = gameWeek.WeekEnd,
            Deadline = gameWeek.DraftDeadline,
            Status = gameWeek.Status,
            DeadlinePassed = _gameWeekService.IsDeadlinePassed(gameWeek),
            Picks = picks
        });
    }

    // POST /api/picks/captain — activar capitão num dia
    [HttpPost("captain")]
    public async Task<IActionResult> ActivateCaptain([FromBody] ActivateCaptainRequest request)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var gameWeek = _gameWeekService.GetOrCreateCurrentWeek();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Só pode activar Segunda a Quinta
        if (today.DayOfWeek == DayOfWeek.Friday ||
            today.DayOfWeek == DayOfWeek.Saturday ||
            today.DayOfWeek == DayOfWeek.Sunday)
            return BadRequest("O capitão só pode ser activado de Segunda a Quinta. Na Sexta é automático.");

        // Verificar se já activou o capitão esta semana
        var alreadyActivated = _db.Picks.Any(p =>
            p.UserId == userId &&
            p.GameWeekId == gameWeek.Id &&
            p.CaptainActivatedDay != null);

        if (alreadyActivated)
            return BadRequest("Já usaste a tua bala esta semana. Só tens 1 capitão por semana.");

        // Encontrar o pick
        var stock = await _db.Stocks.FirstOrDefaultAsync(s => s.Ticker == request.Ticker);
        if (stock == null) return NotFound("Ação não encontrada.");

        var pick = await _db.Picks.FirstOrDefaultAsync(p =>
            p.UserId == userId &&
            p.GameWeekId == gameWeek.Id &&
            p.StockId == stock.Id);

        if (pick == null)
            return BadRequest("Esta ação não está nos teus picks desta semana.");

        pick.CaptainActivatedDay = today;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            Message = $"Capitão activado! {request.Ticker} conta x2 hoje ({today:dd/MM}).",
            Ticker = request.Ticker,
            Day = today
        });
    }
}

public record SubmitPicksRequest(List<PickItem> Picks);
public record PickItem(string Ticker, bool IsCaptainDraft);
public record ActivateCaptainRequest(string Ticker);