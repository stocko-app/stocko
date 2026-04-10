using Microsoft.AspNetCore.Mvc;
using Stocko.Api.Data;
using Stocko.Api.Services;

namespace Stocko.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly StockoDbContext _db;

    public AuthController(AuthService authService, StockoDbContext db)
    {
        _authService = authService;
        _db = db;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.Username))
            return BadRequest("Email, password e username são obrigatórios.");

        var result = await _authService.RegisterAsync(request.Email, request.Password, request.Username);

        if (!result.Success)
            return BadRequest(result.Error);

        return Ok(new
        {
            result.AccessToken,
            result.RefreshToken,
            result.UserId
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EmailOrUsername) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email/username e password são obrigatórios.");

        var result = await _authService.LoginAsync(request.EmailOrUsername, request.Password);

        if (!result.Success)
            return Unauthorized(result.Error);

        return Ok(new
        {
            result.AccessToken,
            result.RefreshToken,
            result.UserId
        });
    }
	
    // POST /api/auth/check-user — verificar se utilizador existe (login identifier-first)
    [HttpPost("check-user")]
    public IActionResult CheckUser([FromBody] CheckUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EmailOrUsername))
            return BadRequest("Campo obrigatório.");

        bool exists;
        if (request.EmailOrUsername.Contains('@'))
            exists = _db.Users.Any(u => u.Email.ToLower() == request.EmailOrUsername.ToLower());
        else
            exists = _db.Users.Any(u => u.Username.ToLower() == request.EmailOrUsername.ToLower());

        return Ok(new { Exists = exists });
    }

    // GET /api/auth/check-username/{username} — verificar disponibilidade do username
    [HttpGet("check-username/{username}")]
    public IActionResult CheckUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username) || username.Length < 3)
            return BadRequest("Username deve ter pelo menos 3 caracteres.");

        var exists = _authService.UsernameExists(username);
        return Ok(new { Available = !exists });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = HttpContext.Items["UserId"];
        if (userId == null)
            return Unauthorized("Token inválido ou ausente.");

        return Ok(new { userId });
    }

    // POST /api/auth/forgot-password — enviar email de recuperação
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Email obrigatório.");

        // Chamar mesmo que o email não exista (não revelar se conta existe)
        await _authService.SendPasswordResetAsync(request.Email);

        return Ok(new { Message = "Se este email estiver registado, receberás um link de recuperação." });
    }

    // POST /api/auth/reset-password — definir nova password com token de recuperação
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest("Token e nova password são obrigatórios.");

        if (request.NewPassword.Length < 6)
            return BadRequest("A password deve ter pelo menos 6 caracteres.");

        var result = await _authService.ResetPasswordAsync(request.AccessToken, request.NewPassword);

        if (!result.Success)
            return BadRequest(result.Error);

        return Ok(new { Message = "Password alterada com sucesso." });
    }
}

public record RegisterRequest(string Email, string Password, string Username);
public record LoginRequest(string EmailOrUsername, string Password);
public record CheckUserRequest(string EmailOrUsername);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string AccessToken, string NewPassword);