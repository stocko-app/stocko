using Microsoft.Extensions.Caching.Memory;
using Stocko.Api.Data;
using System.Security.Claims;

namespace Stocko.Api.Services;

public class SupabaseAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;

    public SupabaseAuthMiddleware(RequestDelegate next, IMemoryCache cache)
    {
        _next = next;
        _cache = cache;
    }

    public async Task InvokeAsync(HttpContext context, Supabase.Client supabase)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (token != null)
        {
            try
            {
                // Cache por 5 minutos — evita chamar Supabase em cada request
                var cacheKey = $"auth_{token[..20]}";
                if (!_cache.TryGetValue(cacheKey, out string? userId))
                {
                    var user = await supabase.Auth.GetUser(token);
                    userId = user?.Id;
                    if (userId != null)
                    {
                        _cache.Set(cacheKey, userId, TimeSpan.FromMinutes(5));
                    }
                }

                if (userId != null)
                {
                    var claims = new List<Claim>
                    {
                        new Claim("sub", userId),
                    };
                    var identity = new ClaimsIdentity(claims, "Supabase");
                    context.User = new ClaimsPrincipal(identity);
                    context.Items["UserId"] = Guid.Parse(userId);
                }
            }
            catch
            {
                // Token inválido — continua sem autenticação
            }
        }

        await _next(context);
    }
}