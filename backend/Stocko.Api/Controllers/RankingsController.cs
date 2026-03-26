using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RankingsController : ControllerBase
{
    private readonly StockoDbContext _db;
    private readonly GameWeekService _gameWeekService;

    public RankingsController(StockoDbContext db, GameWeekService gameWeekService)
    {
        _db = db;
        _gameWeekService = gameWeekService;
    }

    // GET /api/rankings/global — ranking global semanal
    [HttpGet("global")]
    public async Task<IActionResult> GetGlobalRanking(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var gameWeek = _gameWeekService.GetOrCreateCurrentWeek();

        // Buscar todos os scores da semana ordenados
        var allScores = await _db.WeeklyScores
            .Where(ws => ws.GameWeekId == gameWeek.Id)
            .Include(ws => ws.User)
            .OrderByDescending(ws => ws.TotalPoints)
            .ToListAsync();

        var totalPlayers = allScores.Count;

        // Calcular ranks e percentis
        for (int i = 0; i < allScores.Count; i++)
        {
            allScores[i].RankGlobal = i + 1;
            allScores[i].Percentile = totalPlayers > 0
                ? Math.Round((decimal)(totalPlayers - i) / totalPlayers * 100, 1)
                : 0;
        }
        await _db.SaveChangesAsync();

        // Paginar
        var paged = allScores
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ws => new
            {
                Rank = ws.RankGlobal,
                ws.User.Username,
                ws.User.LeagueTier,
                TotalPoints = Math.Round(ws.TotalPoints, 2),
                Percentile = ws.Percentile,
                IsMe = ws.UserId == userId
            })
            .ToList();

        // Posição do utilizador actual
        var myScore = allScores.FirstOrDefault(ws => ws.UserId == userId);

        return Ok(new
        {
            TotalPlayers = totalPlayers,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalPlayers / pageSize),
            MyRank = myScore?.RankGlobal ?? 0,
            MyPoints = myScore != null ? Math.Round(myScore.TotalPoints, 2) : 0,
            MyPercentile = myScore?.Percentile ?? 0,
            Rankings = paged
        });
    }

    // GET /api/rankings/tier — ranking do tier do utilizador
    [HttpGet("tier")]
    public async Task<IActionResult> GetTierRanking()
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized("Utilizador não encontrado.");

        var gameWeek = _gameWeekService.GetOrCreateCurrentWeek();

        // Buscar scores do mesmo tier
        var tierScores = await _db.WeeklyScores
            .Where(ws => ws.GameWeekId == gameWeek.Id && ws.User.LeagueTier == user.LeagueTier)
            .Include(ws => ws.User)
            .OrderByDescending(ws => ws.TotalPoints)
            .ToListAsync();

        var totalInTier = tierScores.Count;

        // Calcular ranks dentro do tier
        for (int i = 0; i < tierScores.Count; i++)
        {
            tierScores[i].RankTier = i + 1;
        }
        await _db.SaveChangesAsync();

        var rankings = tierScores.Select((ws, i) => new
        {
            Rank = i + 1,
            ws.User.Username,
            TotalPoints = Math.Round(ws.TotalPoints, 2),
            IsMe = ws.UserId == userId,
            IsPromotionZone = totalInTier > 0 && (i + 1) <= Math.Ceiling(totalInTier * 0.2),
            IsRelegationZone = totalInTier > 0 && (i + 1) > Math.Floor(totalInTier * 0.8)
        }).ToList();

        var myScore = tierScores.FirstOrDefault(ws => ws.UserId == userId);

        return Ok(new
        {
            Tier = user.LeagueTier,
            TotalInTier = totalInTier,
            MyRank = myScore?.RankTier ?? 0,
            MyPoints = myScore != null ? Math.Round(myScore.TotalPoints, 2) : 0,
            PromotionCutoff = (int)Math.Ceiling(totalInTier * 0.2),
            RelegationCutoff = (int)Math.Floor(totalInTier * 0.8),
            Rankings = rankings
        });
    }

    // GET /api/rankings/tier/{tier} — ranking de um tier específico (só o próprio tier)
    [HttpGet("tier/{tier}")]
    public async Task<IActionResult> GetTierRankingByName(string tier)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        // Só pode ver o seu próprio tier
        if (!string.Equals(user.LeagueTier, tier, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var gameWeek = _gameWeekService.GetOrCreateCurrentWeek();

        var tierScores = await _db.WeeklyScores
            .Where(ws => ws.GameWeekId == gameWeek.Id && ws.User.LeagueTier == user.LeagueTier)
            .Include(ws => ws.User)
            .OrderByDescending(ws => ws.TotalPoints)
            .ToListAsync();

        var totalInTier = tierScores.Count;

        for (int i = 0; i < tierScores.Count; i++)
            tierScores[i].RankTier = i + 1;

        await _db.SaveChangesAsync();

        var rankings = tierScores.Select((ws, i) => new
        {
            Rank = i + 1,
            ws.User.Username,
            TotalPoints = Math.Round(ws.TotalPoints, 2),
            IsMe = ws.UserId == userId,
            IsPromotionZone = totalInTier > 0 && (i + 1) <= Math.Ceiling(totalInTier * 0.2),
            IsRelegationZone = totalInTier > 0 && (i + 1) > Math.Floor(totalInTier * 0.8)
        }).ToList();

        var myScore = tierScores.FirstOrDefault(ws => ws.UserId == userId);

        return Ok(new
        {
            Tier = user.LeagueTier,
            TotalInTier = totalInTier,
            MyRank = myScore?.RankTier ?? 0,
            MyPoints = myScore != null ? Math.Round(myScore.TotalPoints, 2) : 0,
            PromotionCutoff = (int)Math.Ceiling(totalInTier * 0.2),
            RelegationCutoff = (int)Math.Floor(totalInTier * 0.8),
            Rankings = rankings
        });
    }

    [HttpGet("week/{gameWeekId}")]
	public async Task<IActionResult> GetWeekRanking(Guid gameWeekId)
	{
		var userId = HttpContext.Items["UserId"] as Guid?;
		if (userId == null) return Unauthorized("Token inválido.");

		var gameWeek = await _db.GameWeeks.FindAsync(gameWeekId);
		if (gameWeek == null) return NotFound("Semana não encontrada.");

		var scores = await _db.WeeklyScores
			.Where(ws => ws.GameWeekId == gameWeekId)
			.Include(ws => ws.User)
			.OrderByDescending(ws => ws.TotalPoints)
			.ToListAsync();

		var rankings = scores.Select((ws, i) => new
		{
			Rank = i + 1,
			ws.User.Username,
			TotalPoints = Math.Round(ws.TotalPoints, 2),
			IsMe = ws.UserId == userId
		}).ToList();

		return Ok(new
		{
			WeekStart = gameWeek.WeekStart,
			WeekEnd = gameWeek.WeekEnd,
			TotalPlayers = scores.Count,
			Rankings = rankings
		});
	}
}