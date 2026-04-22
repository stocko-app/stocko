using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stocko.Api.Auth;
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

        if (request.Password.Length < PasswordPolicy.MinLength)
            return BadRequest(PasswordPolicy.MinLengthMessage);

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
    public async Task<IActionResult> CheckUser([FromBody] CheckUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EmailOrUsername))
            return BadRequest("Campo obrigatório.");

        bool exists;
        if (request.EmailOrUsername.Contains('@'))
            exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == request.EmailOrUsername.ToLower());
        else
            exists = await _db.Users.AnyAsync(u => u.Username.ToLower() == request.EmailOrUsername.ToLower());

        return Ok(new { Exists = exists });
    }

    // GET /api/auth/check-username/{username} — verificar disponibilidade do username
    [HttpGet("check-username/{username}")]
    public async Task<IActionResult> CheckUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username) || username.Length < 3)
            return BadRequest("Username deve ter pelo menos 3 caracteres.");

        var exists = await _authService.UsernameExistsAsync(username);
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

        if (request.NewPassword.Length < PasswordPolicy.MinLength)
            return BadRequest(PasswordPolicy.MinLengthMessage);

        var result = await _authService.ResetPasswordAsync(request.AccessToken, request.NewPassword);

        if (!result.Success)
            return BadRequest(result.Error);

        return Ok(new { Message = "Password alterada com sucesso." });
    }

    // POST /api/auth/change-password — utilizador autenticado (Bearer)
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = HttpContext.Items["UserId"] as Guid?;
        if (userId == null)
            return Unauthorized("Token inválido.");

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest("Password actual e nova são obrigatórias.");

        if (request.CurrentPassword == request.NewPassword)
            return BadRequest("A nova password tem de ser diferente da actual.");

        if (request.NewPassword.Length < PasswordPolicy.MinLength)
            return BadRequest(PasswordPolicy.MinLengthMessage);

        var result = await _authService.ChangePasswordAsync(userId.Value, request.CurrentPassword, request.NewPassword);

        if (!result.Success)
            return BadRequest(result.Error);

        if (result.Error == "PASSWORD_CHANGED_RELOGIN" || string.IsNullOrEmpty(result.AccessToken))
        {
            return Ok(new
            {
                Message = "Password alterada. Volta a fazer login com a nova password.",
                AccessToken = (string?)null,
                RequiresRelogin = true
            });
        }

        return Ok(new
        {
            Message = "Password alterada com sucesso.",
            result.AccessToken,
            result.RefreshToken,
            RequiresRelogin = false
        });
    }
}

public record RegisterRequest(string Email, string Password, string Username);
public record LoginRequest(string EmailOrUsername, string Password);
public record CheckUserRequest(string EmailOrUsername);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string AccessToken, string NewPassword);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);