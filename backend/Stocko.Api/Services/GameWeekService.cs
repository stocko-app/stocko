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

    public GameWeek GetOrCreateCurrentWeek()
	{
		var today = DateOnly.FromDateTime(DateTime.UtcNow);

		DateOnly monday;

		// Sábado → próxima semana (domingo é draft day, semana começa segunda)
		if (today.DayOfWeek == DayOfWeek.Saturday)
		{
			monday = today.AddDays(2);
		}
		// Domingo → próxima semana (draft ainda aberto até meia-noite)
		else if (today.DayOfWeek == DayOfWeek.Sunday)
		{
			monday = today.AddDays(1);
		}
		else
		{
			// Segunda a Sexta → semana actual
			var daysBack = ((int)today.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
			monday = today.AddDays(-daysBack);
		}

		var friday = monday.AddDays(4);

		var existing = _db.GameWeeks.FirstOrDefault(w => w.WeekStart == monday);
		if (existing != null) return existing;

		// Deadline: Domingo 23h59 Lisboa (= Segunda 00h00 menos 1 min)
		// = Domingo 23h59 Lisboa → em UTC: 23h59 - lisbonOffset
		var sunday = monday.AddDays(-1);
		var lisbonOffset = GetLisbonOffset(sunday);
		var deadline = new DateTime(sunday.Year, sunday.Month, sunday.Day, 23, 59, 0, DateTimeKind.Utc)
			.AddHours(-lisbonOffset);

		// Resultados finais: Sexta 22h00 Lisboa (após fecho US)
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
		_db.SaveChanges();

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
    public GameWeek GetOrCreateNextWeek()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Calcular a próxima Segunda-feira (nunca hoje)
        int daysUntilMonday = ((int)DayOfWeek.Monday - (int)today.DayOfWeek + 7) % 7;
        if (daysUntilMonday == 0) daysUntilMonday = 7;
        var nextMonday = today.AddDays(daysUntilMonday);
        var nextFriday = nextMonday.AddDays(4);

        var existing = _db.GameWeeks.FirstOrDefault(w => w.WeekStart == nextMonday);
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
        _db.SaveChanges();

        Console.WriteLine($"✅ GameWeek seguinte criada: {nextMonday} → {nextFriday} (deadline: {deadline:dd/MM HH:mm} UTC)");
        return gameWeek;
    }

    // Devolve a semana que deve receber novos picks:
    // — se o deadline da semana actual não passou → semana actual
    // — se já passou → semana seguinte
    public (GameWeek week, bool isNextWeek) GetDraftTargetWeek()
    {
        var current = GetOrCreateCurrentWeek();
        if (!IsDeadlinePassed(current))
            return (current, false);

        return (GetOrCreateNextWeek(), true);
    }

    public bool IsDeadlinePassed(GameWeek week)
    {
        return DateTime.UtcNow >= week.DraftDeadline;
    }
}