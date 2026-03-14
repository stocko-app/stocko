using Microsoft.EntityFrameworkCore;
using Stocko.Api.Models;

namespace Stocko.Api.Data;

public class StockoDbContext : DbContext
{
    public StockoDbContext(DbContextOptions<StockoDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<StockPrice> StockPrices => Set<StockPrice>();
    public DbSet<GameWeek> GameWeeks => Set<GameWeek>();
    public DbSet<Pick> Picks => Set<Pick>();
    public DbSet<DailyScore> DailyScores => Set<DailyScore>();
    public DbSet<WeeklyScore> WeeklyScores => Set<WeeklyScore>();
    public DbSet<League> Leagues => Set<League>();
    public DbSet<LeagueMember> LeagueMembers => Set<LeagueMember>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Achievement> Achievements => Set<Achievement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Username).IsUnique();
        });

        // Stock
        modelBuilder.Entity<Stock>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Ticker).IsUnique();
        });

        // StockPrice
        modelBuilder.Entity<StockPrice>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.StockId, x.Date }).IsUnique();
            e.HasOne(x => x.Stock)
             .WithMany(x => x.Prices)
             .HasForeignKey(x => x.StockId);
        });

        // GameWeek
        modelBuilder.Entity<GameWeek>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.WeekStart).IsUnique();
        });

        // Pick
        modelBuilder.Entity<Pick>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.GameWeekId, x.StockId }).IsUnique();
            e.HasOne(x => x.User)
             .WithMany(x => x.Picks)
             .HasForeignKey(x => x.UserId);
            e.HasOne(x => x.GameWeek)
             .WithMany(x => x.Picks)
             .HasForeignKey(x => x.GameWeekId);
            e.HasOne(x => x.Stock)
             .WithMany(x => x.Picks)
             .HasForeignKey(x => x.StockId);
        });

        // DailyScore
        modelBuilder.Entity<DailyScore>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Pick)
             .WithMany(x => x.DailyScores)
             .HasForeignKey(x => x.PickId);
            e.HasOne(x => x.Stock)
             .WithMany()
             .HasForeignKey(x => x.StockId);
        });

        // WeeklyScore
        modelBuilder.Entity<WeeklyScore>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.GameWeekId }).IsUnique();
            e.HasOne(x => x.User)
             .WithMany(x => x.WeeklyScores)
             .HasForeignKey(x => x.UserId);
            e.HasOne(x => x.GameWeek)
             .WithMany(x => x.WeeklyScores)
             .HasForeignKey(x => x.GameWeekId);
        });

        // League
        modelBuilder.Entity<League>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.InviteCode).IsUnique();
            e.HasOne(x => x.Owner)
             .WithMany()
             .HasForeignKey(x => x.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // LeagueMember — chave composta
        modelBuilder.Entity<LeagueMember>(e =>
        {
            e.HasKey(x => new { x.LeagueId, x.UserId });
            e.HasOne(x => x.League)
             .WithMany(x => x.Members)
             .HasForeignKey(x => x.LeagueId);
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId);
        });

        // Subscription
        modelBuilder.Entity<Subscription>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.User)
             .WithMany(x => x.Subscriptions)
             .HasForeignKey(x => x.UserId);
        });

        // Achievement — unique por utilizador e tipo
        modelBuilder.Entity<Achievement>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.Type }).IsUnique();
            e.HasOne(x => x.User)
             .WithMany(x => x.Achievements)
             .HasForeignKey(x => x.UserId);
        });
    }
}