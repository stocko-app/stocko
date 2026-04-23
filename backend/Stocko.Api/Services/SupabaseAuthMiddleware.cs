using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace Stocko.Api.Services;

public class SupabaseAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SupabaseAuthMiddleware> _logger;

    private static readonly TimeSpan GetUserTimeout = TimeSpan.FromSeconds(15);

    public SupabaseAuthMiddleware(
        RequestDelegate next,
        IMemoryCache cache,
        ILogger<SupabaseAuthMiddleware> logger)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
    }

    private static string CacheKeyForToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return "auth_" + Convert.ToHexString(hash);
    }

    public async Task InvokeAsync(HttpContext context, Supabase.Client supabase)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (token != null)
        {
            try
            {
                // Cache por 5 minutos — chave = hash do JWT (evita colisões em token[..20])
                var cacheKey = CacheKeyForToken(token);
                if (!_cache.TryGetValue(cacheKey, out string? userId))
                {
                    var getUserTask = supabase.Auth.GetUser(token);
                    var user = await getUserTask.WaitAsync(GetUserTimeout, context.RequestAborted);
                    userId = user?.Id;
                    if (userId != null)
                        _cache.Set(cacheKey, userId, TimeSpan.FromMinutes(5));
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
            catch (TimeoutException)
            {
                _logger.LogWarning("Supabase Auth.GetUser excedeu {Timeout}s — pedido continua sem UserId",
                    GetUserTimeout.TotalSeconds);
            }
            catch (OperationCanceledException)
            {
                // Cliente cancelou o pedido — não logar como erro
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Supabase Auth.GetUser falhou (token inválido ou rede)");
            }
        }

        await _next(context);
    }
}
