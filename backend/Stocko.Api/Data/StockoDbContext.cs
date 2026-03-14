using Microsoft.EntityFrameworkCore;

namespace Stocko.Api.Data;

public class StockoDbContext : DbContext
{
    public StockoDbContext(DbContextOptions<StockoDbContext> options) 
        : base(options)
    {
    }
}