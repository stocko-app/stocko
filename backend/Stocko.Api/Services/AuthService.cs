using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stocko.Api.Data;
using Supabase.Gotrue;

namespace Stocko.Api.Services;

public class AuthService
{
    private readonly Supabase.Client _supabase;
    private readonly StockoDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _supabaseUrl;
    private readonly string _supabaseAnonKey;

    public AuthService(Supabase.Client supabase, StockoDbContext db, IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _supabase = supabase;
        _db = db;
        _httpClientFactory = httpClientFactory;
        _supabaseUrl = config["Supabase:Url"]!;
        _supabaseAnonKey = config["Supabase:AnonKey"]!;
    }

    public async Task<AuthResult> RegisterAsync(string email, string password, string username)
    {
        var usernameExists = await _db.Users.AnyAsync(u => u.Username == username);
        if (usernameExists)
            return new AuthResult { Success = false, Error = "Username já está em uso." };

        Supabase.Gotrue.Session? response;
        try
        {
            response = await _supabase.Auth.SignUp(email, password);
        }
        catch
        {
            return new AuthResult { Success = false, Error = "Erro ao criar conta. Tenta novamente." };
        }

        if (response?.User == null)
            return new AuthResult { Success = false, Error = "Erro ao criar conta." };

        var user = new Models.User
        {
            Id = Guid.Parse(response.User.Id!),
            Email = email,
            Username = username,
            Plan = "free",
            LeagueTier = "bronze",
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResult
        {
            Success = true,
            AccessToken = response.AccessToken,
            RefreshToken = response.RefreshToken,
            UserId = user.Id
        };
    }

    public async Task<AuthResult> LoginAsync(string emailOrUsername, string password)
    {
        try
        {
            // Se não contém '@', é um username — procurar o email na BD
            string? email;
            if (emailOrUsername.Contains('@'))
            {
                email = emailOrUsername;
            }
            else
            {
                email = await _db.Users
                    .Where(u => u.Username.ToLower() == emailOrUsername.ToLower())
                    .Select(u => u.Email)
                    .FirstOrDefaultAsync();

                if (email == null)
                    return new AuthResult { Success = false, Error = "Utilizador não encontrado." };
            }

            var response = await _supabase.Auth.SignIn(email, password);

            if (response?.User == null)
                return new AuthResult { Success = false, Error = "Credenciais inválidas." };

            return new AuthResult
            {
                Success = true,
                AccessToken = response.AccessToken,
                RefreshToken = response.RefreshToken,
                UserId = Guid.Parse(response.User.Id!)
            };
        }
        catch
        {
            return new AuthResult { Success = false, Error = "Credenciais incorrectas." };
        }
    }

    public async Task<bool> UsernameExistsAsync(string username)
    {
        return await _db.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower());
    }

    public async Task<bool> SendPasswordResetAsync(string email)
    {
        try
        {
            var http = _httpClientFactory.CreateClient();
            http.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);

            var redirectTo = Uri.EscapeDataString("https://stocko.pt/reset-password");
            var response = await http.PostAsJsonAsync(
                $"{_supabaseUrl}/auth/v1/recover?redirect_to={redirectTo}",
                new { email, gotrue_meta_security = new { } });

            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<AuthResult> ResetPasswordAsync(string accessToken, string newPassword)
    {
        try
        {
            var http = _httpClientFactory.CreateClient();
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            http.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);

            var response = await http.PutAsJsonAsync(
                $"{_supabaseUrl}/auth/v1/user",
                new { password = newPassword });

            return response.IsSuccessStatusCode
                ? new AuthResult { Success = true }
                : new AuthResult { Success = false, Error = "Token inválido ou expirado." };
        }
        catch
        {
            return new AuthResult { Success = false, Error = "Erro ao redefinir a password." };
        }
    }
}

public class AuthResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public Guid UserId { get; set; }
}