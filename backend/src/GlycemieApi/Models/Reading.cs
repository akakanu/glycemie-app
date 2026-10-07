using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace GlycemieApi.Models;

/// <summary>
/// Une mesure de glycémie. Le niveau n'est pas stocké : il est recalculé à la lecture
/// pour que l'historique suive toujours la grille de seuils en vigueur.
/// </summary>
public class Reading
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = null!;

    /// <summary>Valeur en mmol/L.</summary>
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Value { get; set; }

    public MeasurementMoment Moment { get; set; }

    public DateTime MeasuredAt { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }
}
