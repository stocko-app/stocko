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

    public async Task CalculateDailyScoresAsync(DateOnly date)
    {
        // Buscar GameWeek activa
        var gameWeek = _db.GameWeeks
            .FirstOrDefault(w => w.WeekStart <= date && w.WeekEnd >= date);

        if (gameWeek == null)
        {
            Console.WriteLine($"❌ Nenhuma GameWeek encontrada para {date}");
            return;
        }

        // Buscar todos os picks da semana
        var picks = _db.Picks
            .Where(p => p.GameWeekId == gameWeek.Id)
            .ToList();

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

            // Bónus carteira vs S&P500
            if (pickCount > 0)
            {
                var portfolioAvg = portfolioTotal / pickCount;
                if (portfolioAvg > sp500Change)
                {
                    // Adicionar +1 ao WeeklyScore do utilizador
                    var weeklyScore = _db.WeeklyScores
                        .FirstOrDefault(ws => ws.UserId == userId && ws.GameWeekId == gameWeek.Id);

                    if (weeklyScore == null)
                    {
                        weeklyScore = new WeeklyScore
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            GameWeekId = gameWeek.Id,
                            TotalPoints = 0,
                            RankGlobal = 0,
                            RankTier = 0,
                            Percentile = 0,
                            IndexBonusTotal = 1,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.WeeklyScores.Add(weeklyScore);
                    }
                    else
                    {
                        weeklyScore.IndexBonusTotal += 1;
                    }
                }
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

            var indexBonus = _db.WeeklyScores
                .FirstOrDefault(ws => ws.UserId == userId && ws.GameWeekId == gameWeek.Id)
                ?.IndexBonusTotal ?? 0;

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
                weeklyScore.TotalPoints = totalPoints + indexBonus;
            }
        }

        await _db.SaveChangesAsync();
        foreach (var userGroup in userPicks)
        {
            await _achievementService.CheckAndAwardAsync(userGroup.Key);
        }

        Console.WriteLine($"✅ Pontuação calculada para {processed} utilizadores em {date}");
        Console.WriteLine($"✅ Pontuação calculada para {processed} utilizadores em {date}");
    }
}