using GlycemieApi.Models;
using GlycemieApi.Services;

namespace GlycemieApi.Tests;

public class GlycemiaInterpreterTests
{
    [Theory]
    // À jeun : bas < 4.0, normal < 6.1, élevé < 7.0, très élevé au-delà
    [InlineData(MeasurementMoment.Fasting, "3.9", GlycemiaLevel.Low)]
    [InlineData(MeasurementMoment.Fasting, "4.0", GlycemiaLevel.Normal)]
    [InlineData(MeasurementMoment.Fasting, "6.0", GlycemiaLevel.Normal)]
    [InlineData(MeasurementMoment.Fasting, "6.1", GlycemiaLevel.High)]
    [InlineData(MeasurementMoment.Fasting, "6.9", GlycemiaLevel.High)]
    [InlineData(MeasurementMoment.Fasting, "7.0", GlycemiaLevel.VeryHigh)]
    // 1 h après : normal < 10.0, élevé < 11.1
    [InlineData(MeasurementMoment.OneHourAfterMeal, "3.9", GlycemiaLevel.Low)]
    [InlineData(MeasurementMoment.OneHourAfterMeal, "9.9", GlycemiaLevel.Normal)]
    [InlineData(MeasurementMoment.OneHourAfterMeal, "10.0", GlycemiaLevel.High)]
    [InlineData(MeasurementMoment.OneHourAfterMeal, "11.0", GlycemiaLevel.High)]
    [InlineData(MeasurementMoment.OneHourAfterMeal, "11.1", GlycemiaLevel.VeryHigh)]
    // 2 h après : normal < 7.8, élevé < 11.1
    [InlineData(MeasurementMoment.TwoHoursAfterMeal, "3.9", GlycemiaLevel.Low)]
    [InlineData(MeasurementMoment.TwoHoursAfterMeal, "7.7", GlycemiaLevel.Normal)]
    [InlineData(MeasurementMoment.TwoHoursAfterMeal, "7.8", GlycemiaLevel.High)]
    [InlineData(MeasurementMoment.TwoHoursAfterMeal, "11.0", GlycemiaLevel.High)]
    [InlineData(MeasurementMoment.TwoHoursAfterMeal, "11.1", GlycemiaLevel.VeryHigh)]
    // 4 h et plus : même grille qu'à jeun
    [InlineData(MeasurementMoment.FourHoursOrMoreAfterMeal, "3.9", GlycemiaLevel.Low)]
    [InlineData(MeasurementMoment.FourHoursOrMoreAfterMeal, "6.0", GlycemiaLevel.Normal)]
    [InlineData(MeasurementMoment.FourHoursOrMoreAfterMeal, "6.1", GlycemiaLevel.High)]
    [InlineData(MeasurementMoment.FourHoursOrMoreAfterMeal, "7.0", GlycemiaLevel.VeryHigh)]
    // Extrémités de la plage d'un glucomètre
    [InlineData(MeasurementMoment.Fasting, "1.0", GlycemiaLevel.Low)]
    [InlineData(MeasurementMoment.TwoHoursAfterMeal, "33.3", GlycemiaLevel.VeryHigh)]
    public void GetLevel_applies_thresholds_at_boundaries(MeasurementMoment moment, string value, GlycemiaLevel expected)
    {
        var level = GlycemiaInterpreter.GetLevel(decimal.Parse(value, System.Globalization.CultureInfo.InvariantCulture), moment);

        Assert.Equal(expected, level);
    }

    [Theory]
    [MemberData(nameof(AllMomentsAndLevels))]
    public void Interpret_always_returns_title_message_advice_and_disclaimer(MeasurementMoment moment, decimal value)
    {
        var result = GlycemiaInterpreter.Interpret(value, moment);

        Assert.False(string.IsNullOrWhiteSpace(result.Title));
        Assert.False(string.IsNullOrWhiteSpace(result.Message));
        Assert.NotEmpty(result.Advice);
        Assert.Equal(GlycemiaInterpreter.Disclaimer, result.Disclaimer);
        Assert.Equal(GlycemiaInterpreter.GetThresholds(moment), result.Thresholds);
    }

    [Fact]
    public void Interpret_low_value_gives_15_15_rule_first()
    {
        var result = GlycemiaInterpreter.Interpret(3.6m, MeasurementMoment.Fasting);

        Assert.Equal(GlycemiaLevel.Low, result.Level);
        Assert.Contains("15 g", result.Advice[0]);
        Assert.Contains("3.6 mmol/L", result.Message);
    }

    public static TheoryData<MeasurementMoment, decimal> AllMomentsAndLevels()
    {
        var data = new TheoryData<MeasurementMoment, decimal>();
        foreach (var moment in Enum.GetValues<MeasurementMoment>())
            foreach (var value in new[] { 3.0m, 5.0m, 10.5m, 15.0m })
                data.Add(moment, value);
        return data;
    }
}
