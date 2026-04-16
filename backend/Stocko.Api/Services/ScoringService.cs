using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Models;

namespace Stocko.Api.Services;

public class ScoringService
{
    private readonly StockoDbContext _db;
	private readonly AchievementService _achievementService;

	public ScoringService(StockoDbContext db, AchievementService achievementService)
	{
		_db = db;
		_achievementService = achievementService;
	}

    // Fórmula base: MAX(0, MIN(30, variação% + 15))
    public decimal CalculateBasePoints(decimal pctChange)
    {
        return Math.Max(0, Math.Min(30, pctChange + 15));
    }

    // Bónus dia positivo: +1 se variação > 0
    public decimal CalculateDayPositiveBonus(decimal pctChange)
    {
        return pctChange > 0 ? 1 : 0;
    }

    public async Task CalculateDailyScoresAsync(DateOnly date, string[]? markets = null)
    {
        // Buscar GameWeek activa
        var gameWeek = await _db.GameWeeks
            .FirstOrDefaultAsync(w => w.WeekStart <= date && w.WeekEnd >= date);

        if (gameWeek == null)
        {
            Console.WriteLine($"❌ Nenhuma GameWeek encontrada para {date}");
            return;
        }

        // Filtrar picks pelo mercado (se especificado)
        var picksQuery = _db.Picks.Where(p => p.GameWeekId == gameWeek.Id);

        if (markets != null && markets.Length > 0)
        {
            var stockIdsForMarkets = await _db.Stocks
                .Where(s => markets.Contains(s.Market))
                .Select(s => s.Id)
                .ToListAsync();
            picksQuery = picksQuery.Where(p => stockIdsForMarkets.Contains(p.StockId));
        }

        var picks = await picksQuery.ToListAsync();

        if (!picks.Any())
        {
            Console.WriteLine($"❌ Nenhum pick encontrado para a semana {gameWeek.WeekStart}");
            return;
        }

        // Buscar preços do dia
        var stockIds = picks.Select(p => p.StockId).Distinct().ToList();
        var prices = await _db.StockPrices
            .Where(p => stockIds.Contains(p.StockId) && p.Date == date)
            .ToListAsync();

        if (!prices.Any())
        {
            Console.WriteLine($"❌ Nenhum preço encontrado para {date}");
            return;
        }

        // Buscar preço do índice S&P500 para bónus de carteira
        var sp500Stock = await _db.Stocks.FirstOrDefaultAsync(s => s.Ticker == "SPY" || s.IndexReference == "SP500");
        decimal sp500Change = 0;
        if (sp500Stock != null)
        {
            var sp500Price = await _db.StockPrices
                .FirstOrDefaultAsync(p => p.StockId == sp500Stock.Id && p.Date == date);
            sp500Change = sp500Price?.PctChange ?? 0;
        }

        // Agrupar picks por utilizador
        var userPicks = picks.GroupBy(p => p.UserId).ToList();
        int processed = 0;

        // Carregar DailyScores existentes em memória para evitar N queries síncronas
        var pickIds = picks.Select(p => p.Id).ToList();
        var existingScores = await _db.DailyScores
            .Where(ds => pickIds.Contains(ds.PickId) && ds.Date == date)
            .ToListAsync();

        foreach (var userGroup in userPicks)
        {
            var userId = userGroup.Key;

            foreach (var pick in userGroup)
            {
                var price = prices.FirstOrDefault(p => p.StockId == pick.StockId);
                if (price == null) continue;

                var basePoints = CalculateBasePoints(price.PctChange);
                var dayBonus = CalculateDayPositiveBonus(price.PctChange);
                var captainBonus = 0m;

                if (pick.CaptainActivatedDay == date)
                    captainBonus = basePoints + dayBonus;

                var total = basePoints + dayBonus + captainBonus;

                var existingScore = existingScores.FirstOrDefault(ds => ds.PickId == pick.Id);

                if (existingScore != null)
                {
                    existingScore.BasePoints = basePoints;
                    existingScore.DayPositiveBonus = dayBonus;
                    existingScore.CaptainBonus = captainBonus;
                    existingScore.Total = total;
                }
                else
                {
                    _db.DailyScores.Add(new DailyScore
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        PickId = pick.Id,
                        StockId = pick.StockId,
                        Date = date,
                        BasePoints = basePoints,
                        DayPositiveBonus = dayBonus,
                        CaptainBonus = captainBonus,
                        Total = total,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            processed++;
        }

        // Guardar DailyScores antes de calcular WeeklyScores
        await _db.SaveChangesAsync();

        // Carregar preços S&P500 da semana de uma só vez
        var sp500Prices = sp500Stock != null
            ? await _db.StockPrices
                .Where(sp => sp.StockId == sp500Stock.Id && sp.Date >= gameWeek.WeekStart && sp.Date <= date)
                .ToDictionaryAsync(sp => sp.Date, sp => sp.PctChange)
            : new Dictionary<DateOnly, decimal>();

        // Actualizar pontos totais na WeeklyScore
        var allDailyScores = await _db.DailyScores
            .Where(ds => ds.UserId != Guid.Empty && pickIds.Contains(ds.PickId))
            .ToListAsync();

        foreach (var userGroup in userPicks)
        {
            var userId = userGroup.Key;
            var userPickIds = userGroup.Select(p => p.Id).ToList();
            var totalPoints = allDailyScores
                .Where(ds => ds.UserId == userId && userPickIds.Contains(ds.PickId))
                .Sum(ds => ds.Total);

            var userPickStockIds = userGroup.Select(p => p.StockId).ToList();

            var weekPrices = await _db.StockPrices
                .Where(sp => userPickStockIds.Contains(sp.StockId) &&
                             sp.Date >= gameWeek.WeekStart && sp.Date <= date)
                .ToListAsync();

            var datesWithPrices = weekPrices.Select(sp => sp.Date).Distinct().ToList();

            int indexBonus = 0;
            foreach (var d in datesWithPrices)
            {
                var dayPrices = weekPrices.Where(sp => sp.Date == d).ToList();
                if (!dayPrices.Any()) continue;

                var dayPortfolioAvg = dayPrices.Average(sp => sp.PctChange);
                var sp500DayChange = sp500Prices.TryGetValue(d, out var v) ? v : 0m;

                if (dayPortfolioAvg > sp500DayChange)
                    indexBonus++;
            }

            var weeklyScore = await _db.WeeklyScores
                .FirstOrDefaultAsync(ws => ws.UserId == userId && ws.GameWeekId == gameWeek.Id);

            if (weeklyScore == null)
            {
                _db.WeeklyScores.Add(new WeeklyScore
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    GameWeekId = gameWeek.Id,
                    TotalPoints = totalPoints + indexBonus,
                    RankGlobal = 0,
                    RankTier = 0,
                    Percentile = 0,
                    IndexBonusTotal = indexBonus,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                weeklyScore.IndexBonusTotal = indexBonus;
                weeklyScore.TotalPoints = totalPoints + indexBonus;
            }
        }

        await _db.SaveChangesAsync();
        foreach (var userGroup in userPicks)
        {
            await _achievementService.CheckAndAwardAsync(userGroup.Key);
        }

        Console.WriteLine($"✅ Pontuação calculada para {processed} utilizadores em {date}");
    }

    // Recalcular ranks e percentis de todos os utilizadores para uma semana
    public async Task UpdateRanksAsync(Guid gameWeekId)
    {
        var scores = await _db.WeeklyScores
            .Where(ws => ws.GameWeekId == gameWeekId)
            .OrderByDescending(ws => ws.TotalPoints)
            .ToListAsync();

        var totalPlayers = scores.Count;
        if (totalPlayers == 0) return;

        // Ranks globais
        for (int i = 0; i < scores.Count; i++)
        {
            scores[i].RankGlobal = i + 1;
            scores[i].Percentile = Math.Round((decimal)(totalPlayers - i) / totalPlayers * 100, 1);
        }

        // Carregar tiers em memória para evitar query síncrona dentro do GroupBy
        var userIds = scores.Select(ws => ws.UserId).ToList();
        var userTiers = await _db.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.LeagueTier);

        var byTier = scores.GroupBy(ws => userTiers.TryGetValue(ws.UserId, out var t) ? t : null);

        foreach (var tierGroup in byTier)
        {
            var tierList = tierGroup.OrderByDescending(ws => ws.TotalPoints).ToList();
            for (int i = 0; i < tierList.Count; i++)
                tierList[i].RankTier = i + 1;
        }

        await _db.SaveChangesAsync();
        Console.WriteLine($"✅ Ranks actualizados para {totalPlayers} utilizadores");
    }

    // Actualizar streaks no fim de semana (chamar apenas na Sexta)
    public async Task UpdateStreaksAsync(Guid gameWeekId)
    {
        var allUsers = await _db.Users.ToListAsync();

        // Carregar todos os picks da semana de uma vez para evitar N queries
        var allPicks = await _db.Picks
            .Where(p => p.GameWeekId == gameWeekId)
            .ToListAsync();

        foreach (var user in allUsers)
        {
            var hasManualPicks = allPicks.Any(p => p.UserId == user.Id && !p.IsAuto);
            var hasAutoPicks = allPicks.Any(p => p.UserId == user.Id && p.IsAuto);

            if (hasManualPicks)
            {
                user.StreakWeeks += 1;
                if (user.StreakWeeks > user.StreakBest)
                    user.StreakBest = user.StreakWeeks;
            }
            else if (!hasAutoPicks)
            {
                user.StreakWeeks = 0;
            }
        }

        await _db.SaveChangesAsync();
        Console.WriteLine($"✅ Streaks actualizados para {allUsers.Count} utilizadores");
    }
}