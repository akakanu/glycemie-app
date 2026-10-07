namespace GlycemieApi.Models;

/// <summary>Moment de la mesure par rapport au dernier repas.</summary>
public enum MeasurementMoment
{
    Fasting,
    OneHourAfterMeal,
    TwoHoursAfterMeal,
    FourHoursOrMoreAfterMeal
}
