using mvc_api.Models.Dtos;
using Xunit;

namespace mvc_api.Tests.Services;

public class GebruikerSoortenTests
{
    [Theory(DisplayName = "Condition coverage: TryNormalize geeft false bij null/whitespace")]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TryNormalize_WithMissingValue_ReturnsFalse(string? input)
    {
        var result = GebruikerSoorten.TryNormalize(input, out var normalized);

        Assert.False(result);
        Assert.Equal(string.Empty, normalized);
    }

    [Fact(DisplayName = "Condition coverage: onbekende rol wordt afgewezen")]
    public void TryNormalize_WithUnknownRole_ReturnsFalse()
    {
        var result = GebruikerSoorten.TryNormalize("beheerder", out var normalized);

        Assert.False(result);
        Assert.Equal(string.Empty, normalized);
    }

    [Fact(DisplayName = "Condition coverage: bekende rol wordt hoofdletterongevoelig geaccepteerd")]
    public void TryNormalize_WithValidRole_ReturnsNormalized()
    {
        var result = GebruikerSoorten.TryNormalize("bEdRiJf", out var normalized);

        Assert.True(result);
        Assert.Equal("Bedrijf", normalized);
    }
}