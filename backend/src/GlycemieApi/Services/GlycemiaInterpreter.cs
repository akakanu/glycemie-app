using GlycemieApi.Models;

namespace GlycemieApi.Services;

/// <summary>
/// Seuils d'un moment de mesure, en mmol/L. Chaque borne est exclusive :
/// une valeur égale à <see cref="NormalBelow"/> est déjà « élevée ».
/// </summary>
public record GlycemiaThresholds(decimal LowBelow, decimal NormalBelow, decimal HighBelow);

public record GlycemiaInterpretation(
    GlycemiaLevel Level,
    string Title,
    string Message,
    IReadOnlyList<string> Advice,
    GlycemiaThresholds Thresholds,
    string Disclaimer);

/// <summary>
/// Interprète une valeur de glycémie selon une grille générale unique.
/// Logique pure, sans dépendance, pour être testée facilement.
/// </summary>
/// <remarks>
/// À jeun et 2 h après le repas : critères de Diabète Canada.
/// 1 h et 4 h et plus : valeurs usuelles, il n'existe pas de norme officielle.
/// </remarks>
public static class GlycemiaInterpreter
{
    public const string Disclaimer =
        "Information générale à titre indicatif. Ne remplace pas un avis médical. " +
        "En cas de doute ou de malaise, consultez un professionnel de santé ou composez le 911.";

    private const decimal HypoglycemiaBelow = 4.0m;

    private static readonly IReadOnlyDictionary<MeasurementMoment, GlycemiaThresholds> Grid =
        new Dictionary<MeasurementMoment, GlycemiaThresholds>
        {
            [MeasurementMoment.Fasting] = new(HypoglycemiaBelow, 6.1m, 7.0m),
            [MeasurementMoment.OneHourAfterMeal] = new(HypoglycemiaBelow, 10.0m, 11.1m),
            [MeasurementMoment.TwoHoursAfterMeal] = new(HypoglycemiaBelow, 7.8m, 11.1m),
            [MeasurementMoment.FourHoursOrMoreAfterMeal] = new(HypoglycemiaBelow, 6.1m, 7.0m),
        };

    private static readonly IReadOnlyDictionary<GlycemiaLevel, string[]> AdviceByLevel =
        new Dictionary<GlycemiaLevel, string[]>
        {
            [GlycemiaLevel.Low] =
            [
                "Prenez tout de suite 15 g de sucre rapide : 175 ml de jus ou de boisson gazeuse non diète, ou 3 c. à thé de sucre dissous dans l'eau.",
                "Recontrôlez votre glycémie après 15 minutes. Si elle est toujours sous 4.0 mmol/L, reprenez 15 g de sucre.",
                "Une fois la glycémie remontée, prenez une collation si votre prochain repas est dans plus d'une heure.",
                "Si les hypoglycémies se répètent, parlez-en à un professionnel de santé.",
            ],
            [GlycemiaLevel.Normal] =
            [
                "Continuez vos bonnes habitudes : repas équilibrés et réguliers.",
                "Restez actif, idéalement 150 minutes d'activité physique par semaine.",
                "Continuez à mesurer régulièrement pour suivre votre évolution.",
            ],
            [GlycemiaLevel.High] =
            [
                "Privilégiez des repas équilibrés, riches en fibres, et limitez les sucres rapides.",
                "Une marche de 15 à 30 minutes après le repas aide à faire baisser la glycémie.",
                "Buvez de l'eau plutôt que des boissons sucrées.",
                "Si les valeurs élevées se répètent, parlez-en à votre médecin.",
            ],
            [GlycemiaLevel.VeryHigh] =
            [
                "Recontrôlez votre glycémie pour confirmer la valeur (mains lavées, nouvelle bandelette).",
                "Buvez de l'eau.",
                "Si la valeur se confirme ou se répète, consultez rapidement un professionnel de santé.",
                "En cas de soif intense, de nausées, de vomissements ou de grande fatigue, consultez sans attendre.",
            ],
        };

    public static GlycemiaThresholds GetThresholds(MeasurementMoment moment) => Grid[moment];

    public static GlycemiaLevel GetLevel(decimal value, MeasurementMoment moment)
    {
        var t = Grid[moment];
        if (value < t.LowBelow) return GlycemiaLevel.Low;
        if (value < t.NormalBelow) return GlycemiaLevel.Normal;
        if (value < t.HighBelow) return GlycemiaLevel.High;
        return GlycemiaLevel.VeryHigh;
    }

    public static GlycemiaInterpretation Interpret(decimal value, MeasurementMoment moment)
    {
        var thresholds = Grid[moment];
        var level = GetLevel(value, moment);
        var context = $"{MomentLabel(moment)}, une glycémie de {Format(value)} mmol/L";

        var (title, message) = level switch
        {
            GlycemiaLevel.Low => ("Glycémie basse",
                $"{context} est basse (sous {Format(thresholds.LowBelow)}). Il s'agit d'une hypoglycémie : agissez maintenant."),
            GlycemiaLevel.Normal => ("Glycémie normale",
                $"{context} se situe dans la plage habituelle (de {Format(thresholds.LowBelow)} à moins de {Format(thresholds.NormalBelow)})."),
            GlycemiaLevel.High => ("Glycémie élevée",
                $"{context} est au-dessus de la plage habituelle (à partir de {Format(thresholds.NormalBelow)})."),
            _ => ("Glycémie très élevée",
                $"{context} est nettement au-dessus de la plage habituelle (à partir de {Format(thresholds.HighBelow)})."),
        };

        return new GlycemiaInterpretation(level, title, message, AdviceByLevel[level], thresholds, Disclaimer);
    }

    private static string MomentLabel(MeasurementMoment moment) => moment switch
    {
        MeasurementMoment.Fasting => "À jeun",
        MeasurementMoment.OneHourAfterMeal => "1 h après le repas",
        MeasurementMoment.TwoHoursAfterMeal => "2 h après le repas",
        MeasurementMoment.FourHoursOrMoreAfterMeal => "4 h ou plus après le repas",
        _ => throw new ArgumentOutOfRangeException(nameof(moment), moment, null),
    };

    private static string Format(decimal value) =>
        value.ToString("0.0", System.Globalization.CultureInfo.InvariantCulture);
}
