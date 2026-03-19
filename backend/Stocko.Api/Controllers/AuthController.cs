using Microsoft.AspNetCore.Mvc;
using Stocko.Api.Services;

namespace Stocko.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
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
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email e password são obrigatórios.");

        var result = await _authService.LoginAsync(request.Email, request.Password);

        if (!result.Success)
            return Unauthorized(result.Error);

        return Ok(new
        {
            result.AccessToken,
            result.RefreshToken,
            result.UserId
        });
    }
	
	[HttpGet("me")]
	public IActionResult Me()
	{
		var userId = HttpContext.Items["UserId"];
		if (userId == null)
			return Unauthorized("Token inválido ou ausente.");

		return Ok(new { userId });
	}
}

public record RegisterRequest(string Email, string Password, string Username);
public record LoginRequest(string Email, string Password);