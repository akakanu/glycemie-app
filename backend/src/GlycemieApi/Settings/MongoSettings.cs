using System.ComponentModel.DataAnnotations;

namespace GlycemieApi.Settings;

public class MongoSettings
{
    public const string SectionName = "Mongo";

    /// <summary>Chaîne de connexion Atlas. À définir dans les user-secrets, jamais dans appsettings.json.</summary>
    [Required(ErrorMessage = "Mongo:ConnectionString manquant. Voir le README (dotnet user-secrets).")]
    public string ConnectionString { get; set; } = "";

    [Required]
    public string DatabaseName { get; set; } = "";
}
