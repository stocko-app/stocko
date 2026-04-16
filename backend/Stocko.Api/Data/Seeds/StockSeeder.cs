using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using Stocko.Api.Models;

namespace Stocko.Api.Data.Seeds;

public static class StockSeeder
{
    public static async Task SeedAsync(StockoDbContext context)
    {
        if (await context.Stocks.AnyAsync())
            return; // já tem dados — não repetir

        var csvPath = Path.Combine(AppContext.BaseDirectory, "Data", "Seeds", "stocks.csv");
        
        if (!File.Exists(csvPath))
        {
            Console.WriteLine($"CSV não encontrado em: {csvPath}");
            return;
        }

        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
        };

        using var reader = new StreamReader(csvPath);
        using var csv = new CsvReader(reader, config);

        var records = csv.GetRecords<StockCsvRecord>().ToList();

        var stocks = records.Select(r => new Stock
        {
            Id = Guid.NewGuid(),
            Ticker = r.Ticker,
            Name = r.Name,
            Market = r.Market,
            Sector = r.Sector,
            IndexReference = r.IndexReference,
            Active = true
        }).ToList();

        await context.Stocks.AddRangeAsync(stocks);
        await context.SaveChangesAsync();

        Console.WriteLine($"✅ {stocks.Count} ações inseridas na base de dados.");
    }
}

public class StockCsvRecord
{
    public string Ticker { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Market { get; set; } = string.Empty;
    public string Sector { get; set; } = string.Empty;
    public string IndexReference { get; set; } = string.Empty;
}