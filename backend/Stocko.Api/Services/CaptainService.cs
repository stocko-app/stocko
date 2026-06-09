namespace Stocko.Api.Services;

public static class CaptainService
{
    // Abertura cash EU/PT (Lisboa) — após isto o capitão aplica-se ao próximo dia útil
    private static readonly TimeOnly MarketOpenLisbon = new(9, 0);

    public static DateTime UtcToLisbon(DateTime utcNow)
    {
        utcNow = utcNow.Kind == DateTimeKind.Utc ? utcNow : utcNow.ToUniversalTime();
        var date = DateOnly.FromDateTime(utcNow);
        return utcNow.AddHours(GetLisbonOffset(date));
    }

    public static DateOnly GetTodayLisbon(DateTime utcNow)
        => DateOnly.FromDateTime(UtcToLisbon(utcNow));

    public static bool IsTradingDay(DateOnly day)
        => day.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday;

    public static bool HasMarketOpenedToday(DateTime utcNow)
    {
        var lisbon = UtcToLisbon(utcNow);
        var today = DateOnly.FromDateTime(lisbon);
        if (!IsTradingDay(today)) return false;
        return TimeOnly.FromDateTime(lisbon) >= MarketOpenLisbon;
    }

    public static DateOnly GetNextTradingDay(DateOnly day)
    {
        var next = day.AddDays(1);
        while (!IsTradingDay(next))
            next = next.AddDays(1);
        return next;
    }

    /// <summary>
    /// Dia em que o capitão conta x2: hoje se ainda antes da abertura; senão o próximo dia útil.
    /// </summary>
    public static DateOnly GetCaptainTargetDay(DateTime utcNow)
    {
        var today = GetTodayLisbon(utcNow);
        if (!IsTradingDay(today))
            return GetNextTradingDay(today);

        return HasMarketOpenedToday(utcNow)
            ? GetNextTradingDay(today)
            : today;
    }

    public static bool CanActivateManually(DateTime utcNow)
    {
        var today = GetTodayLisbon(utcNow);
        return today.DayOfWeek is >= DayOfWeek.Monday and <= DayOfWeek.Thursday;
    }

    public static string GetTargetDayLabel(DateOnly targetDay, DateOnly todayLisbon)
    {
        if (targetDay == todayLisbon) return "hoje";
        if (targetDay == GetNextTradingDay(todayLisbon)) return "amanhã";
        return targetDay.ToString("dddd", new System.Globalization.CultureInfo("pt-PT"));
    }

    private static double GetLisbonOffset(DateOnly date)
    {
        var year = date.Year;
        var lastSundayMarch = GetLastSundayOf(year, 3);
        var lastSundayOctober = GetLastSundayOf(year, 10);
        return date >= lastSundayMarch && date < lastSundayOctober ? 1 : 0;
    }

    private static DateOnly GetLastSundayOf(int year, int month)
    {
        var lastDay = new DateOnly(year, month, DateTime.DaysInMonth(year, month));
        return lastDay.AddDays(-(int)lastDay.DayOfWeek);
    }
}
