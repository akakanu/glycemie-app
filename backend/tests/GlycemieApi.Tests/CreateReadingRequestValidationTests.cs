using System.ComponentModel.DataAnnotations;
using System.Globalization;
using GlycemieApi.Dtos;
using GlycemieApi.Models;

namespace GlycemieApi.Tests;

public class CreateReadingRequestValidationTests
{
    [Theory]
    [InlineData("1.0", true)]
    [InlineData("5.4", true)]
    [InlineData("33.3", true)]
    [InlineData("0.9", false)]
    [InlineData("33.4", false)]
    public void Value_range_is_validated_under_french_culture(string value, bool expectedValid)
    {
        // Régression : sur un poste fr-CA, les bornes "1.0" et "33.3" faisaient planter la validation.
        var previous = CultureInfo.CurrentCulture;
        CultureInfo.CurrentCulture = new CultureInfo("fr-CA");
        try
        {
            var request = new CreateReadingRequest
            {
                Value = decimal.Parse(value, CultureInfo.InvariantCulture),
                Moment = MeasurementMoment.Fasting,
            };

            var isValid = Validator.TryValidateObject(request, new ValidationContext(request), [], validateAllProperties: true);

            Assert.Equal(expectedValid, isValid);
        }
        finally
        {
            CultureInfo.CurrentCulture = previous;
        }
    }

    [Fact]
    public void Moment_is_required()
    {
        var request = new CreateReadingRequest { Value = 5.0m };

        var results = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(request, new ValidationContext(request), results, validateAllProperties: true);

        Assert.False(isValid);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateReadingRequest.Moment)));
    }
}
