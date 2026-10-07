using System.ComponentModel.DataAnnotations;

namespace GlycemieApi.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    /// <summary>Clé de signature HMAC. À définir dans les user-secrets, 32 caractères minimum.</summary>
    [Required(ErrorMessage = "Jwt:Secret manquant. Voir le README (dotnet user-secrets).")]
    [MinLength(32, ErrorMessage = "Jwt:Secret doit contenir au moins 32 caractères.")]
    public string Secret { get; set; } = "";

    [Required]
    public string Issuer { get; set; } = "";

    [Required]
    public string Audience { get; set; } = "";

    [Range(5, 1440)]
    public int ExpirationMinutes { get; set; } = 60;
}
