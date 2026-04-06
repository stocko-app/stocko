using Stocko.Api.Data;
using Supabase.Gotrue;

namespace Stocko.Api.Services;

public class AuthService
{
    private readonly Supabase.Client _supabase;
    private readonly StockoDbContext _db;

    public AuthService(Supabase.Client supabase, StockoDbContext db)
    {
        _supabase = supabase;
        _db = db;
    }

    public async Task<AuthResult> RegisterAsync(string email, string password, string username)
    {
        var usernameExists = _db.Users.Any(u => u.Username == username);
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
        // Se não contém '@', é um username — procurar o email na BD
        var email = emailOrUsername.Contains('@')
            ? emailOrUsername
            : _db.Users
                .Where(u => u.Username.ToLower() == emailOrUsername.ToLower())
                .Select(u => u.Email)
                .FirstOrDefault();

        if (email == null)
            return new AuthResult { Success = false, Error = "Utilizador não encontrado." };

        try
        {
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

    public bool UsernameExists(string username)
    {
        return _db.Users.Any(u => u.Username.ToLower() == username.ToLower());
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