using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Models;
using Stocko.Api.Services;
using Xunit;

namespace Stocko.Tests;

public class ScoringServiceTests
{
    private StockoDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<StockoDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new StockoDbContext(options);
    }

    // ── TESTES DA FÓRMULA BASE ────────────────────────────────────────

    [Fact]
    public void BasePoints_MaxVariation_Returns30()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateBasePoints(15m);
        Assert.Equal(30m, result);
    }

    [Fact]
    public void BasePoints_AboveMax_StillReturns30()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateBasePoints(20m);
        Assert.Equal(30m, result);
    }

    [Fact]
    public void BasePoints_Zero_Returns15()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateBasePoints(0m);
        Assert.Equal(15m, result);
    }

    [Fact]
    public void BasePoints_MinusOne_Returns14()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateBasePoints(-1m);
        Assert.Equal(14m, result);
    }

    [Fact]
    public void BasePoints_MinusFifteen_ReturnsZero()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateBasePoints(-15m);
        Assert.Equal(0m, result);
    }

    [Fact]
    public void BasePoints_BelowMinus15_ReturnsZero()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateBasePoints(-20m);
        Assert.Equal(0m, result);
    }

    [Fact]
    public void BasePoints_PlusFive_Returns20()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateBasePoints(5m);
        Assert.Equal(20m, result);
    }

    [Fact]
    public void BasePoints_MinusFive_Returns10()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateBasePoints(-5m);
        Assert.Equal(10m, result);
    }

    // ── TESTES DO BÓNUS DIA POSITIVO ─────────────────────────────────

    [Fact]
    public void DayBonus_PositiveDay_ReturnsOne()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateDayPositiveBonus(0.1m);
        Assert.Equal(1m, result);
    }

    [Fact]
    public void DayBonus_ZeroDay_ReturnsZero()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateDayPositiveBonus(0m);
        Assert.Equal(0m, result);
    }

    [Fact]
    public void DayBonus_NegativeDay_ReturnsZero()
    {
        var db = CreateInMemoryDb();
        var achievementService = new AchievementService(db);
        var service = new ScoringService(db, achievementService);

        var result = service.CalculateDayPositiveBonus(-1m);
        Assert.Equal(0m, result);
    }

    // ── TESTES DE CENÁRIOS COMPLETOS ──────────────────────────────────

    [Theory]
	[InlineData(15.0,  30.0)]
	[InlineData(10.0,  25.0)]
	[InlineData(5.0,   20.0)]
	[InlineData(3.0,   18.0)]
	[InlineData(1.0,   16.0)]
	[InlineData(0.0,   15.0)]
	[InlineData(-1.0,  14.0)]
	[InlineData(-5.0,  10.0)]
	[InlineData(-10.0,  5.0)]
	[InlineData(-15.0,  0.0)]
	[InlineData(-20.0,  0.0)]
	public void BasePoints_AllScenarios(double pctChange, double expected)
	{
		var db = CreateInMemoryDb();
		var achievementService = new AchievementService(db);
		var service = new ScoringService(db, achievementService);

		var result = service.CalculateBasePoints((decimal)pctChange);
		Assert.Equal((decimal)expected, result);
	}
}