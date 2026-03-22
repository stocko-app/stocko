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
		var dayOfWeek = (int)today.DayOfWeek; // 0=Dom, 1=Seg, ..., 6=Sab

		DateOnly monday;

		// Sexta após 18h30, Sábado ou Domingo → abre a semana SEGUINTE
		if (today.DayOfWeek == DayOfWeek.Saturday || today.DayOfWeek == DayOfWeek.Sunday)
		{
			// Próxima Segunda
			var daysUntilMonday = today.DayOfWeek == DayOfWeek.Saturday ? 2 : 1;
			monday = today.AddDays(daysUntilMonday);
		}
		else
		{
			// Segunda a Sexta → semana actual
			var daysBack = ((int)today.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
			monday = today.AddDays(-daysBack);
		}

		var friday = monday.AddDays(4);

		// Verificar se já existe
		var existing = _db.GameWeeks.FirstOrDefault(w => w.WeekStart == monday);
		if (existing != null) return existing;

		// Criar nova GameWeek
		var lisbonOffset = GetLisbonOffset(monday);
		var deadline = new DateTime(monday.Year, monday.Month, monday.Day, 8, 0, 0, DateTimeKind.Utc)
			.AddHours(-lisbonOffset);
		var resultsAt = new DateTime(friday.Year, friday.Month, friday.Day, 18, 30, 0, DateTimeKind.Utc)
			.AddHours(-lisbonOffset);

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

    public bool IsDeadlinePassed(GameWeek week)
    {
        return DateTime.UtcNow >= week.DraftDeadline;
    }
}