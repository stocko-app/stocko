using Stocko.Api.Services;

namespace Stocko.Api.Jobs;

public class DailyScoringJob
{
    private readonly ScoringService _scoringService;

    public DailyScoringJob(ScoringService scoringService)
    {
        _scoringService = scoringService;
    }

    public async Task ExecuteAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Só corre de Terça a Sexta (mercados fecham Seg-Sex mas picks começam Terça)
        if (today.DayOfWeek == DayOfWeek.Saturday || today.DayOfWeek == DayOfWeek.Sunday)
        {
            Console.WriteLine($"⏭️ DailyScoringJob ignorado — fim de semana");
            return;
        }

        Console.WriteLine($"🕐 DailyScoringJob iniciado: {today}");
        await _scoringService.CalculateDailyScoresAsync(today);
        Console.WriteLine($"✅ DailyScoringJob concluído: {today}");
    }
}