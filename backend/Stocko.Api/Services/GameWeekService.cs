using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Models;

namespace Stocko.Api.Services;

public class GameWeekService
{
    private readonly StockoDbContext _db;

    public GameWeekService(StockoDbContext db)
    {
        _db = db;
    }

    public async Task<GameWeek> GetOrCreateCurrentWeekAsync()
	{
		var today = DateOnly.FromDateTime(DateTime.UtcNow);

		DateOnly monday;

		if (today.DayOfWeek == DayOfWeek.Saturday)
			monday = today.AddDays(2);
		else if (today.DayOfWeek == DayOfWeek.Sunday)
			monday = today.AddDays(1);
		else
		{
			var daysBack = ((int)today.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
			monday = today.AddDays(-daysBack);
		}

		var friday = monday.AddDays(4);

		var existing = await _db.GameWeeks.FirstOrDefaultAsync(w => w.WeekStart == monday);
		if (existing != null) return existing;

		var sunday = monday.AddDays(-1);
		var lisbonOffset = GetLisbonOffset(sunday);
		var deadline = new DateTime(sunday.Year, sunday.Month, sunday.Day, 23, 59, 0, DateTimeKind.Utc)
			.AddHours(-lisbonOffset);

		var lisbonOffsetFriday = GetLisbonOffset(friday);
		var resultsAt = new DateTime(friday.Year, friday.Month, friday.Day, 22, 0, 0, DateTimeKind.Utc)
			.AddHours(-lisbonOffsetFriday);

		var gameWeek = new GameWeek
		{
			Id = Guid.NewGuid(),
			WeekStart = monday,
			WeekEnd = friday,
			DraftDeadline = deadline,
			ResultsAt = resultsAt,
			Status = "draft_open"
		};

		_db.GameWeeks.Add(gameWeek);
		await _db.SaveChangesAsync();

		Console.WriteLine($"✅ GameWeek criada: {monday} → {friday} (deadline: {deadline:dd/MM HH:mm} UTC)");
		return gameWeek;
	}

    private static double GetLisbonOffset(DateOnly date)
    {
        // Portugal: UTC+0 no inverno, UTC+1 no verão
        // Hora de verão: último Domingo de Março → último Domingo de Outubro
        var year = date.Year;
        var lastSundayMarch = GetLastSundayOf(year, 3);
        var lastSundayOctober = GetLastSundayOf(year, 10);

        return date >= lastSundayMarch && date < lastSundayOctober ? 1 : 0;
    }

    private static DateOnly GetLastSundayOf(int year, int month)
    {
        var lastDay = new DateOnly(year, month, DateTime.DaysInMonth(year, month));
        var daysBack = (int)lastDay.DayOfWeek;
        return lastDay.AddDays(-daysBack);
    }

    // Cria sempre a semana a seguir à actual (independente do dia)
    public async Task<GameWeek> GetOrCreateNextWeekAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        int daysUntilMonday = ((int)DayOfWeek.Monday - (int)today.DayOfWeek + 7) % 7;
        if (daysUntilMonday == 0) daysUntilMonday = 7;
        var nextMonday = today.AddDays(daysUntilMonday);
        var nextFriday = nextMonday.AddDays(4);

        var existing = await _db.GameWeeks.FirstOrDefaultAsync(w => w.WeekStart == nextMonday);
        if (existing != null) return existing;

        var nextSunday = nextMonday.AddDays(-1);
        var lisbonOffset = GetLisbonOffset(nextSunday);
        var deadline = new DateTime(nextSunday.Year, nextSunday.Month, nextSunday.Day, 23, 59, 0, DateTimeKind.Utc)
            .AddHours(-lisbonOffset);
        var lisbonOffsetFriday = GetLisbonOffset(nextFriday);
        var resultsAt = new DateTime(nextFriday.Year, nextFriday.Month, nextFriday.Day, 22, 0, 0, DateTimeKind.Utc)
            .AddHours(-lisbonOffsetFriday);

        var gameWeek = new GameWeek
        {
            Id = Guid.NewGuid(),
            WeekStart = nextMonday,
            WeekEnd = nextFriday,
            DraftDeadline = deadline,
            ResultsAt = resultsAt,
            Status = "draft_open"
        };

        _db.GameWeeks.Add(gameWeek);
        await _db.SaveChangesAsync();

        Console.WriteLine($"✅ GameWeek seguinte criada: {nextMonday} → {nextFriday} (deadline: {deadline:dd/MM HH:mm} UTC)");
        return gameWeek;
    }

    // Devolve a semana que deve receber novos picks:
    // — se o deadline da semana actual não passou → semana actual
    // — se já passou → semana seguinte
    public async Task<(GameWeek week, bool isNextWeek)> GetDraftTargetWeekAsync()
    {
        var current = await GetOrCreateCurrentWeekAsync();
        if (!IsDeadlinePassed(current))
            return (current, false);

        return (await GetOrCreateNextWeekAsync(), true);
    }

    public bool IsDeadlinePassed(GameWeek week)
    {
        return DateTime.UtcNow >= week.DraftDeadline;
    }
}