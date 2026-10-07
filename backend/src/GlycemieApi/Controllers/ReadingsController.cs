using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using GlycemieApi.Dtos;
using GlycemieApi.Models;
using GlycemieApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GlycemieApi.Controllers;

[ApiController]
[Authorize]
[Route("api/readings")]
public class ReadingsController(ReadingService readings) : ControllerBase
{
    private static readonly TimeSpan FutureTolerance = TimeSpan.FromMinutes(5);

    // L'identifiant vient toujours du jeton, jamais du corps de la requête.
    private string UserId => User.FindFirstValue(JwtRegisteredClaimNames.Sub)
        ?? throw new InvalidOperationException("Jeton sans identifiant utilisateur.");

    /// <summary>Enregistre une mesure et renvoie son interprétation.</summary>
    [HttpPost]
    [ProducesResponseType<ReadingResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(CreateReadingRequest request, CancellationToken ct)
    {
        var measuredAt = request.MeasuredAt?.UtcDateTime ?? DateTime.UtcNow;
        if (measuredAt > DateTime.UtcNow + FutureTolerance)
        {
            ModelState.AddModelError(nameof(request.MeasuredAt), "La date de mesure ne peut pas être dans le futur.");
            return ValidationProblem(ModelState);
        }

        // Value et Moment sont garantis non nuls par [Required].
        var reading = await readings.CreateAsync(
            UserId, request.Value!.Value, request.Moment!.Value, measuredAt, request.Note, ct);

        return CreatedAtAction(nameof(GetById), new { id = reading.Id }, ReadingResponse.From(reading));
    }

    /// <summary>Historique de l'utilisateur connecté, filtrable par moment.</summary>
    [HttpGet]
    [ProducesResponseType<IEnumerable<ReadingResponse>>(StatusCodes.Status200OK)]
    public async Task<IEnumerable<ReadingResponse>> List([FromQuery] MeasurementMoment? moment, CancellationToken ct)
    {
        var list = await readings.ListAsync(UserId, moment, ct);
        return list.Select(ReadingResponse.From);
    }

    [HttpGet("{id}")]
    [ProducesResponseType<ReadingResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        // 404 aussi quand la mesure appartient à un autre utilisateur : on ne révèle pas qu'elle existe.
        var reading = await readings.GetAsync(UserId, id, ct);
        return reading is null ? NotFound() : Ok(ReadingResponse.From(reading));
    }
}
