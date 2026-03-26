using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly StockoDbContext _db;
    private readonly GameWeekService _gameWeekService;

    public UsersController(StockoDbContext db, GameWeekService gameWeekService)
    {
        _db = db;
        _gameWeekService = gameWeekService;
    }

    // GET /api/users/me — perfil do utilizador
    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var user = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.Plan,
                u.LeagueTier,
                u.StreakWeeks,
                u.StreakBest,
                u.CreatedAt,
                AchievementCount = _db.Achievements.Count(a => a.UserId == u.Id),
                TotalWeeksPlayed = _db.WeeklyScores.Count(ws => ws.UserId == u.Id),
                BestScore = _db.WeeklyScores
                    .Where(ws => ws.UserId == u.Id)
                    .OrderByDescending(ws => ws.TotalPoints)
                    .Select(ws => ws.TotalPoints)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync();

        if (user == null) return NotFound("Utilizador não encontrado.");

        return Ok(user);
    }

    // GET /api/users/me/history — histórico de picks
    [HttpGet("me/history")]
    public async Task<IActionResult> GetHistory([FromQuery] int weeks = 4)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        // Free: máx 4 semanas · Plus/Pro: ilimitado
        if (user.Plan == "free" && weeks > 4) weeks = 4;

        var history = await _db.WeeklyScores
            .Where(ws => ws.UserId == userId)
            .Include(ws => ws.GameWeek)
            .OrderByDescending(ws => ws.GameWeek.WeekStart)
            .Take(weeks)
            .Select(ws => new
            {
                ws.GameWeek.WeekStart,
                ws.GameWeek.WeekEnd,
                TotalPoints = Math.Round(ws.TotalPoints, 2),
                ws.RankGlobal,
                ws.Percentile,
                ws.IndexBonusTotal,
                Picks = _db.Picks
                    .Where(p => p.UserId == userId && p.GameWeekId == ws.GameWeekId)
                    .Include(p => p.Stock)
                    .Select(p => new
                    {
                        p.Stock.Ticker,
                        p.Stock.Name,
                        p.IsCaptainDraft,
                        p.CaptainActivatedDay,
                        p.IsAuto,
                        DailyPoints = _db.DailyScores
                            .Where(ds => ds.PickId == p.Id)
                            .Sum(ds => ds.Total)
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(history);
    }

    // PUT /api/users/me/push-token — registar token de notificações
    [HttpPut("me/push-token")]
    public async Task<IActionResult> UpdatePushToken([FromBody] UpdatePushTokenRequest request)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        user.ExpoPushToken = request.PushToken;
        await _db.SaveChangesAsync();

        return Ok(new { Message = "Push token actualizado." });
    }

    // GET /api/users/me/tier-history — tier actual e melhor tier histórico
    [HttpGet("me/tier-history")]
    public async Task<IActionResult> GetTierHistory()
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        return Ok(new
        {
            CurrentTier = user.LeagueTier,
            BestTier = user.BestLeagueTier,
            IsAtBest = user.LeagueTier == user.BestLeagueTier
        });
    }

    // GET /api/users/me/achievements — conquistas do utilizador
    [HttpGet("me/achievements")]
    public async Task<IActionResult> GetAchievements()
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var achievements = await _db.Achievements
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.EarnedAt)
            .Select(a => new
            {
                a.Type,
                a.EarnedAt
            })
            .ToListAsync();

        return Ok(achievements);
    }
}

public record UpdatePushTokenRequest(string PushToken);