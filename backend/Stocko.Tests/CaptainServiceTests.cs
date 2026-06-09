using Stocko.Api.Services;
using Xunit;

namespace Stocko.Tests;

public class CaptainServiceTests
{
    // Terça 08:00 Lisboa (verão UTC+1) → 07:00 UTC
    [Fact]
    public void GetCaptainTargetDay_BeforeMarketOpen_ReturnsToday()
    {
        var utc = new DateTime(2026, 6, 9, 7, 0, 0, DateTimeKind.Utc);
        var target = CaptainService.GetCaptainTargetDay(utc);
        Assert.Equal(new DateOnly(2026, 6, 9), target);
        Assert.False(CaptainService.HasMarketOpenedToday(utc));
    }

    // Terça 10:00 Lisboa → 09:00 UTC
    [Fact]
    public void GetCaptainTargetDay_AfterMarketOpen_ReturnsTomorrow()
    {
        var utc = new DateTime(2026, 6, 9, 9, 0, 0, DateTimeKind.Utc);
        var target = CaptainService.GetCaptainTargetDay(utc);
        Assert.Equal(new DateOnly(2026, 6, 10), target);
        Assert.True(CaptainService.HasMarketOpenedToday(utc));
    }

    // Quinta após abertura → Sexta
    [Fact]
    public void GetCaptainTargetDay_ThursdayAfterOpen_TargetsFriday()
    {
        var utc = new DateTime(2026, 6, 11, 10, 0, 0, DateTimeKind.Utc);
        var target = CaptainService.GetCaptainTargetDay(utc);
        Assert.Equal(new DateOnly(2026, 6, 12), target);
    }

    [Fact]
    public void CanActivateManually_OnlyMondayToThursday()
    {
        var monday = new DateTime(2026, 6, 8, 12, 0, 0, DateTimeKind.Utc);
        var friday = new DateTime(2026, 6, 12, 12, 0, 0, DateTimeKind.Utc);

        Assert.True(CaptainService.CanActivateManually(monday));
        Assert.False(CaptainService.CanActivateManually(friday));
    }
}
