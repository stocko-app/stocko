using Microsoft.EntityFrameworkCore;
using Stocko.Api.Data;
using Stocko.Api.Data.Seeds;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<StockoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();

// Health check
app.MapGet("/health", () => "OK");

// Seed base de dados
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<StockoDbContext>();
    await db.Database.MigrateAsync();
    await StockSeeder.SeedAsync(db);
}

app.Run();