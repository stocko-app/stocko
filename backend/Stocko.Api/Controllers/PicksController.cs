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

        var (gameWeek, isNextWeek) = await _gameWeekService.GetDraftTargetWeekAsync();

        const int maxPicks = 5;

        if (request.Picks.Count != maxPicks)
            return BadRequest($"Tens de escolher exactamente {maxPicks} picks.");

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
        var existingPicks = await _db.Picks
            .Where(p => p.UserId == userId && p.GameWeekId == gameWeek.Id)
            .ToListAsync();
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

        var message = isNextWeek
            ? $"{picks.Count} picks guardados para a próxima semana ({gameWeek.WeekStart:dd/MM})."
            : $"{picks.Count} picks submetidos com sucesso.";

        return Ok(new
        {
            Message = message,
            GameWeekId = gameWeek.Id,
            Deadline = gameWeek.DraftDeadline,
            IsNextWeek = isNextWeek,
            Picks = picks.Select(p => new
            {
                p.Id,
                Ticker = stocks.First(s => s.Id == p.StockId).Ticker,
                p.IsCaptainDraft
            })
        });
    }

    // GET /api/picks/week — ver picks da semana actual + draft da semana seguinte se aplicável
    [HttpGet("week")]
    public async Task<IActionResult> GetCurrentWeekPicks()
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var currentWeek = await _gameWeekService.GetOrCreateCurrentWeekAsync();
        var (draftWeek, isNextWeek) = await _gameWeekService.GetDraftTargetWeekAsync();

        // Picks da semana actual (para pontos)
        var currentPicks = await _db.Picks
            .Where(p => p.UserId == userId && p.GameWeekId == currentWeek.Id)
            .Include(p => p.Stock)
            .Select(p => new
            {
                p.Id,
                p.Stock.Ticker,
                p.Stock.Name,
                p.Stock.Sector,
                p.IsCaptainDraft,
                p.CaptainActivatedDay,
                WeekPoints = Math.Round(p.DailyScores.Sum(ds => ds.Total), 2),
                p.IsAuto,
                LatestPrice = p.Stock.Prices
                    .OrderByDescending(x => x.Date)
                    .Select(x => new { x.Close, x.PctChange })
                    .FirstOrDefault()
            })
            .ToListAsync();

        // Picks agendados para a semana seguinte (só se for caso disso)
        object? nextWeekDraft = null;
        if (isNextWeek)
        {
            var nextPicks = await _db.Picks
                .Where(p => p.UserId == userId && p.GameWeekId == draftWeek.Id)
                .Include(p => p.Stock)
                .Select(p => new
                {
                    p.Id,
                    p.Stock.Ticker,
                    p.Stock.Name,
                    p.Stock.Sector,
                    p.IsCaptainDraft,
                    p.IsAuto
                })
                .ToListAsync();

            nextWeekDraft = new
            {
                GameWeekId = draftWeek.Id,
                WeekStart = draftWeek.WeekStart,
                WeekEnd = draftWeek.WeekEnd,
                Deadline = draftWeek.DraftDeadline,
                Picks = nextPicks
            };
        }

        return Ok(new
        {
            GameWeekId = currentWeek.Id,
            WeekStart = currentWeek.WeekStart,
            WeekEnd = currentWeek.WeekEnd,
            Deadline = currentWeek.DraftDeadline,
            Status = currentWeek.Status,
            DeadlinePassed = _gameWeekService.IsDeadlinePassed(currentWeek),
            Picks = currentPicks,
            NextWeekDraft = nextWeekDraft
        });
    }

    // POST /api/picks/captain — activar capitão num dia
    [HttpPost("captain")]
    public async Task<IActionResult> ActivateCaptain([FromBody] ActivateCaptainRequest request)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var gameWeek = await _gameWeekService.GetOrCreateCurrentWeekAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Só pode activar Segunda a Quinta
        if (today.DayOfWeek == DayOfWeek.Friday ||
            today.DayOfWeek == DayOfWeek.Saturday ||
            today.DayOfWeek == DayOfWeek.Sunday)
            return BadRequest("O capitão só pode ser activado de Segunda a Quinta. Na Sexta é automático.");

        // Verificar se já activou o capitão esta semana
        var alreadyActivated = await _db.Picks.AnyAsync(p =>
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
    // GET /api/picks/daily-summary — resumo do dia actual com pontos de cada pick
    [HttpGet("daily-summary")]
    public async Task<IActionResult> GetDailySummary()
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var gameWeek = await _gameWeekService.GetOrCreateCurrentWeekAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var picks = await _db.Picks
            .Where(p => p.UserId == userId && p.GameWeekId == gameWeek.Id)
            .Include(p => p.Stock)
            .ThenInclude(s => s.Prices.Where(sp => sp.Date == today))
            .ToListAsync();

        // Carregar DailyScores em batch para evitar N queries síncronas
        var pickIds = picks.Select(p => p.Id).ToList();
        var todayScores = await _db.DailyScores
            .Where(ds => pickIds.Contains(ds.PickId) && ds.Date == today)
            .ToListAsync();
        var weekScores = await _db.DailyScores
            .Where(ds => pickIds.Contains(ds.PickId))
            .ToListAsync();

        var result = picks.Select(p =>
        {
            var todayScore = todayScores.FirstOrDefault(ds => ds.PickId == p.Id);
            var todayPrice = p.Stock.Prices.FirstOrDefault();

            return new
            {
                p.Stock.Ticker,
                p.Stock.Name,
                p.IsCaptainDraft,
                CaptainActivatedDay = p.CaptainActivatedDay,
                IsCaptainToday = p.CaptainActivatedDay == today,
                PctChange = todayPrice?.PctChange ?? 0,
                TodayPoints = todayScore?.Total ?? 0,
                TodayBase = todayScore?.BasePoints ?? 0,
                TodayBonus = todayScore?.DayPositiveBonus ?? 0,
                TodayCaptainBonus = todayScore?.CaptainBonus ?? 0,
                WeekPoints = weekScores.Where(ds => ds.PickId == p.Id).Sum(ds => ds.Total)
            };
        }).ToList();

        var indexBonus = todayScores.Any() ? 1 : 0;

        return Ok(new
        {
            Date = today,
            GameWeekId = gameWeek.Id,
            Picks = result,
            TotalTodayPoints = result.Sum(p => p.TodayPoints),
            TotalWeekPoints = result.Sum(p => p.WeekPoints)
        });
    }

    // GET /api/picks/weekly-chart — pontos por dia da semana actual (para mini-gráfico)
    [HttpGet("weekly-chart")]
    public async Task<IActionResult> GetWeeklyChart()
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var gameWeek = await _gameWeekService.GetOrCreateCurrentWeekAsync();

        var dailyScores = await _db.DailyScores
            .Where(ds => ds.UserId == userId &&
                         ds.Date >= gameWeek.WeekStart &&
                         ds.Date <= gameWeek.WeekEnd)
            .GroupBy(ds => ds.Date)
            .Select(g => new
            {
                Date = g.Key,
                Points = Math.Round(g.Sum(ds => ds.Total), 2)
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        // Incluir todos os dias úteis da semana (Seg-Sex), mesmo sem pontos ainda
        var allDays = Enumerable.Range(0, 5)
            .Select(i => gameWeek.WeekStart.AddDays(i))
            .Select(d => new
            {
                Date = d,
                Points = dailyScores.FirstOrDefault(ds => ds.Date == d)?.Points ?? 0m
            })
            .ToList();

        var cumulative = 0m;
        var chart = allDays.Select(d =>
        {
            cumulative += d.Points;
            return new
            {
                d.Date,
                DayPoints = d.Points,
                Cumulative = Math.Round(cumulative, 2)
            };
        }).ToList();

        return Ok(new
        {
            GameWeekId = gameWeek.Id,
            WeekStart = gameWeek.WeekStart,
            WeekEnd = gameWeek.WeekEnd,
            TotalPoints = Math.Round(cumulative, 2),
            Days = chart
        });
    }

	// GET /api/picks/score/{date} — calcular pontuação para uma data (teste)
	[HttpGet("score/{date}")]
	public async Task<IActionResult> CalculateScore(string date, [FromServices] ScoringService scoringService)
	{
		if (!DateOnly.TryParse(date, out var scoreDate))
			return BadRequest("Data inválida. Formato: yyyy-MM-dd");

		await scoringService.CalculateDailyScoresAsync(scoreDate);
		return Ok($"Pontuação calculada para {scoreDate}");
	}
	
}

public record SubmitPicksRequest(List<PickItem> Picks);
public record PickItem(string Ticker, bool IsCaptainDraft);
public record ActivateCaptainRequest(string Ticker);