using System.ComponentModel.DataAnnotations;
using GlycemieApi.Models;
using GlycemieApi.Services;

namespace GlycemieApi.Dtos;

public class CreateReadingRequest
{
    /// <summary>Valeur en mmol/L, dans la plage d'un glucomètre.</summary>
    [Required(ErrorMessage = "La valeur est obligatoire.")]
    // Bornes lues en culture invariante : sur un poste en français, "1.0" ferait planter la validation.
    [Range(typeof(decimal), "1.0", "33.3",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true,
        ErrorMessage = "La valeur doit être comprise entre 1.0 et 33.3 mmol/L.")]
    public decimal? Value { get; set; }

    [Required(ErrorMessage = "Le moment de la mesure est obligatoire.")]
    [EnumDataType(typeof(MeasurementMoment), ErrorMessage = "Le moment de la mesure n'est pas valide.")]
    public MeasurementMoment? Moment { get; set; }

    /// <summary>Date et heure de la mesure. Par défaut : maintenant.</summary>
    public DateTimeOffset? MeasuredAt { get; set; }

    [StringLength(200, ErrorMessage = "La note ne doit pas dépasser 200 caractères.")]
    public string? Note { get; set; }
}

public record ReadingResponse(
    string Id,
    decimal Value,
    MeasurementMoment Moment,
    DateTime MeasuredAt,
    string? Note,
    GlycemiaInterpretation Interpretation)
{
    public static ReadingResponse From(Reading r) => new(
        r.Id,
        r.Value,
        r.Moment,
        r.MeasuredAt,
        r.Note,
        GlycemiaInterpreter.Interpret(r.Value, r.Moment));
}
