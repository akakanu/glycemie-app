using GlycemieApi.Dtos;
using GlycemieApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace GlycemieApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(UserService users, TokenService tokens) : ControllerBase
{
    /// <summary>Crée un compte et connecte directement l'utilisateur.</summary>
    [HttpPost("register")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var user = await users.RegisterAsync(request.FirstName, request.Email, request.Password, ct);
        if (user is null)
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Ce courriel est déjà utilisé.");

        return StatusCode(StatusCodes.Status201Created, tokens.CreateAuthResponse(user));
    }

    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var user = await users.AuthenticateAsync(request.Email, request.Password, ct);
        if (user is null)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Courriel ou mot de passe incorrect.");

        return Ok(tokens.CreateAuthResponse(user));
    }
}
