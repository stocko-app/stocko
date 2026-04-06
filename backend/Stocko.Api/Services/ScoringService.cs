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
        var gameWeek = _db.GameWeeks
            .FirstOrDefault(w => w.WeekStart <= date && w.WeekEnd >= date);

        if (gameWeek == null)
        {
            Console.WriteLine($"❌ Nenhuma GameWeek encontrada para {date}");
            return;
        }

        // Filtrar picks pelo mercado (se especificado)
        var picksQuery = _db.Picks.Where(p => p.GameWeekId == gameWeek.Id);

        if (markets != null && markets.Length > 0)
        {
            var stockIdsForMarkets = _db.Stocks
                .Where(s => markets.Contains(s.Market))
                .Select(s => s.Id)
                .ToList();
            picksQuery = picksQuery.Where(p => stockIdsForMarkets.Contains(p.StockId));
        }

        var picks = picksQuery.ToList();

        if (!picks.Any())
        {
            Console.WriteLine($"❌ Nenhum pick encontrado para a semana {gameWeek.WeekStart}");
            return;
        }

        // Buscar preços do dia
        var stockIds = picks.Select(p => p.StockId).Distinct().ToList();
        var prices = _db.StockPrices
            .Where(p => stockIds.Contains(p.StockId) && p.Date == date)
            .ToList();

        if (!prices.Any())
        {
            Console.WriteLine($"❌ Nenhum preço encontrado para {date}");
            return;
        }

        // Buscar preço do índice S&P500 para bónus de carteira
        var sp500Stock = _db.Stocks.FirstOrDefault(s => s.Ticker == "SPY" || s.IndexReference == "SP500");
        decimal sp500Change = 0;
        if (sp500Stock != null)
        {
            var sp500Price = _db.StockPrices
                .FirstOrDefault(p => p.StockId == sp500Stock.Id && p.Date == date);
            sp500Change = sp500Price?.PctChange ?? 0;
        }

        // Agrupar picks por utilizador
        var userPicks = picks.GroupBy(p => p.UserId).ToList();
        int processed = 0;

        foreach (var userGroup in userPicks)
        {
            var userId = userGroup.Key;
            decimal portfolioTotal = 0;
            int pickCount = 0;

            foreach (var pick in userGroup)
            {
                var price = prices.FirstOrDefault(p => p.StockId == pick.StockId);
                if (price == null) continue;

                var basePoints = CalculateBasePoints(price.PctChange);
                var dayBonus = CalculateDayPositiveBonus(price.PctChange);
                var captainBonus = 0m;

                // Verificar se é o dia do capitão
                if (pick.CaptainActivatedDay == date)
                {
                    // Capitão: duplica base + bónus dia
                    captainBonus = basePoints + dayBonus;
                }

                var total = basePoints + dayBonus + captainBonus;

                // Verificar se já existe DailyScore para este pick e dia
                var existingScore = _db.DailyScores
                    .FirstOrDefault(ds => ds.PickId == pick.Id && ds.Date == date);

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

                portfolioTotal += price.PctChange;
                pickCount++;
            }

            processed++;
        }

        // Actualizar pontos totais na WeeklyScore
        foreach (var userGroup in userPicks)
        {
            var userId = userGroup.Key;
            var totalPoints = _db.DailyScores
                .Where(ds => ds.UserId == userId &&
                             picks.Select(p => p.Id).Contains(ds.PickId))
                .Sum(ds => ds.Total);

            // Recalcular IndexBonusTotal de raiz (idempotente)
            // Conta quantos dias desta semana a carteira do utilizador bateu o S&P500
            var userPickStockIds = userGroup.Select(p => p.StockId).ToList();

            var datesWithPrices = _db.StockPrices
                .Where(sp => userPickStockIds.Contains(sp.StockId) &&
                             sp.Date >= gameWeek.WeekStart &&
                             sp.Date <= date)
                .Select(sp => sp.Date)
                .Distinct()
                .ToList();

            int indexBonus = 0;
            foreach (var d in datesWithPrices)
            {
                var dayPrices = _db.StockPrices
                    .Where(sp => userPickStockIds.Contains(sp.StockId) && sp.Date == d)
                    .ToList();

                if (!dayPrices.Any()) continue;

                var dayPortfolioAvg = dayPrices.Average(sp => sp.PctChange);

                var sp500DayChange = sp500Stock != null
                    ? (_db.StockPrices.FirstOrDefault(sp => sp.StockId == sp500Stock.Id && sp.Date == d)?.PctChange ?? 0)
                    : 0m;

                if (dayPortfolioAvg > sp500DayChange)
                    indexBonus++;
            }

            var weeklyScore = _db.WeeklyScores
                .FirstOrDefault(ws => ws.UserId == userId && ws.GameWeekId == gameWeek.Id);

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

    // Actualizar streaks no fim de semana (chamar apenas na Sexta)
    public async Task UpdateStreaksAsync(Guid gameWeekId)
    {
        var allUsers = _db.Users.ToList();

        foreach (var user in allUsers)
        {
            var hasManualPicks = _db.Picks.Any(p =>
                p.UserId == user.Id &&
                p.GameWeekId == gameWeekId &&
                !p.IsAuto);

            var hasAutoPicks = _db.Picks.Any(p =>
                p.UserId == user.Id &&
                p.GameWeekId == gameWeekId &&
                p.IsAuto);

            if (hasManualPicks)
            {
                // Jogou manualmente — incrementar streak
                user.StreakWeeks += 1;
                if (user.StreakWeeks > user.StreakBest)
                    user.StreakBest = user.StreakWeeks;
            }
            else if (!hasAutoPicks)
            {
                // Sem picks — streak reseta
                user.StreakWeeks = 0;
            }
            // Com só auto-pick: streak mantém-se (não faz nada)
        }

        await _db.SaveChangesAsync();
        Console.WriteLine($"✅ Streaks actualizados para {allUsers.Count} utilizadores");
    }
}