using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Models;
using Stocko.Api.Services;

namespace Stocko.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaguesController : ControllerBase
{
    private readonly StockoDbContext _db;
    private readonly GameWeekService _gameWeekService;

    public LeaguesController(StockoDbContext db, GameWeekService gameWeekService)
    {
        _db = db;
        _gameWeekService = gameWeekService;
    }

    // POST /api/leagues — criar liga privada
    [HttpPost]
    public async Task<IActionResult> CreateLeague([FromBody] CreateLeagueRequest request)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized("Utilizador não encontrado.");

        // Free: máx 1 liga · Plus/Pro: ilimitadas
        if (user.Plan == "free")
        {
            var existingLeagues = _db.LeagueMembers
                .Count(lm => lm.UserId == userId);
            if (existingLeagues >= 1)
                return BadRequest("O plano Free permite apenas 1 liga. Faz upgrade para Plus para ligas ilimitadas.");
        }

        // Gerar código de convite único (8 caracteres)
        var inviteCode = GenerateInviteCode();
        while (_db.Leagues.Any(l => l.InviteCode == inviteCode))
            inviteCode = GenerateInviteCode();

        var league = new League
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            InviteCode = inviteCode,
            OwnerId = userId.Value,
            MaxMembers = user.Plan == "free" ? 10 : int.MaxValue,
            CreatedAt = DateTime.UtcNow
        };

        _db.Leagues.Add(league);

        // Adicionar criador como membro
        _db.LeagueMembers.Add(new LeagueMember
        {
            LeagueId = league.Id,
            UserId = userId.Value,
            JoinedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return Ok(new
        {
            league.Id,
            league.Name,
            league.InviteCode,
            league.MaxMembers,
            Message = $"Liga '{league.Name}' criada! Partilha o código: {inviteCode}"
        });
    }

    // POST /api/leagues/join — entrar numa liga por código
    [HttpPost("join")]
    public async Task<IActionResult> JoinLeague([FromBody] JoinLeagueRequest request)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var league = await _db.Leagues
            .FirstOrDefaultAsync(l => l.InviteCode == request.InviteCode);

        if (league == null)
            return NotFound("Código de convite inválido.");

        // Verificar se já é membro
        var alreadyMember = _db.LeagueMembers
            .Any(lm => lm.LeagueId == league.Id && lm.UserId == userId);
        if (alreadyMember)
            return BadRequest("Já és membro desta liga.");

        // Verificar limite de membros
        var memberCount = _db.LeagueMembers.Count(lm => lm.LeagueId == league.Id);
        if (memberCount >= league.MaxMembers)
            return BadRequest("Esta liga já atingiu o limite de membros.");

        _db.LeagueMembers.Add(new LeagueMember
        {
            LeagueId = league.Id,
            UserId = userId.Value,
            JoinedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return Ok(new
        {
            Message = $"Entraste na liga '{league.Name}'!",
            league.Id,
            league.Name,
            MemberCount = memberCount + 1
        });
    }

    // GET /api/leagues — listar as tuas ligas
    [HttpGet]
    public async Task<IActionResult> GetMyLeagues()
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var leagues = await _db.LeagueMembers
            .Where(lm => lm.UserId == userId)
            .Include(lm => lm.League)
            .Select(lm => new
            {
                lm.League.Id,
                lm.League.Name,
                lm.League.InviteCode,
                IsOwner = lm.League.OwnerId == userId,
                MemberCount = _db.LeagueMembers.Count(m => m.LeagueId == lm.LeagueId),
                lm.League.MaxMembers,
                lm.JoinedAt
            })
            .ToListAsync();

        return Ok(leagues);
    }

    // GET /api/leagues/{id}/rankings — ranking de uma liga
    [HttpGet("{id}/rankings")]
    public async Task<IActionResult> GetLeagueRankings(Guid id)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        // Verificar se é membro
        var isMember = _db.LeagueMembers
            .Any(lm => lm.LeagueId == id && lm.UserId == userId);
        if (!isMember)
            return Forbid();

        var league = await _db.Leagues.FindAsync(id);
        if (league == null) return NotFound("Liga não encontrada.");

        var gameWeek = _gameWeekService.GetOrCreateCurrentWeek();

        // Buscar membros da liga
        var memberIds = await _db.LeagueMembers
            .Where(lm => lm.LeagueId == id)
            .Select(lm => lm.UserId)
            .ToListAsync();

        // Buscar scores dos membros para a semana actual
        var scores = await _db.WeeklyScores
            .Where(ws => ws.GameWeekId == gameWeek.Id && memberIds.Contains(ws.UserId))
            .Include(ws => ws.User)
            .OrderByDescending(ws => ws.TotalPoints)
            .ToListAsync();

        // Membros sem score ainda (não jogaram esta semana)
        var membersWithScore = scores.Select(s => s.UserId).ToList();
        var membersWithoutScore = await _db.Users
            .Where(u => memberIds.Contains(u.Id) && !membersWithScore.Contains(u.Id))
            .Select(u => new { u.Id, u.Username })
            .ToListAsync();

        var rankings = scores.Select((ws, i) => new
        {
            Rank = i + 1,
            ws.User.Username,
            TotalPoints = Math.Round(ws.TotalPoints, 2),
            IsMe = ws.UserId == userId,
            HasPlayed = true
        }).ToList();

        // Adicionar membros que não jogaram no fim
        foreach (var member in membersWithoutScore)
        {
            rankings.Add(new
            {
                Rank = rankings.Count + 1,
                member.Username,
                TotalPoints = 0m,
                IsMe = member.Id == userId,
                HasPlayed = false
            });
        }

        return Ok(new
        {
            league.Id,
            league.Name,
            league.InviteCode,
            TotalMembers = memberIds.Count,
            GameWeek = new { gameWeek.WeekStart, gameWeek.WeekEnd },
            Rankings = rankings
        });
    }

    // GET /api/leagues/{id}/history — histórico semanal da liga
    [HttpGet("{id}/history")]
    public async Task<IActionResult> GetLeagueHistory(Guid id)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null) return Unauthorized("Token inválido.");

        var isMember = _db.LeagueMembers
            .Any(lm => lm.LeagueId == id && lm.UserId == userId);
        if (!isMember) return Forbid();

        var league = await _db.Leagues.FindAsync(id);
        if (league == null) return NotFound("Liga não encontrada.");

        var memberIds = await _db.LeagueMembers
            .Where(lm => lm.LeagueId == id)
            .Select(lm => lm.UserId)
            .ToListAsync();

        var weeks = await _db.GameWeeks
            .OrderByDescending(gw => gw.WeekStart)
            .Take(20)
            .ToListAsync();

        var history = weeks.Select(gw =>
        {
            var scores = _db.WeeklyScores
                .Where(ws => ws.GameWeekId == gw.Id && memberIds.Contains(ws.UserId))
                .Include(ws => ws.User)
                .OrderByDescending(ws => ws.TotalPoints)
                .ToList();

            return new
            {
                gw.WeekStart,
                gw.WeekEnd,
                Rankings = scores.Select((ws, i) => new
                {
                    Rank = i + 1,
                    ws.User.Username,
                    TotalPoints = Math.Round(ws.TotalPoints, 2),
                    IsMe = ws.UserId == userId
                }).ToList()
            };
        })
        .Where(w => w.Rankings.Any())
        .ToList();

        return Ok(new
        {
            league.Id,
            league.Name,
            TotalMembers = memberIds.Count,
            History = history
        });
    }

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 8)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}

public record CreateLeagueRequest(string Name);
public record JoinLeagueRequest(string InviteCode);