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
        // act: normaliseer een lege of ontbrekende waarde
        var result = GebruikerSoorten.TryNormalize(input, out var normalized);

        // assert: moet worden afgewezen en lege string teruggeven
        Assert.False(result);
        Assert.Equal(string.Empty, normalized);
    }

    [Fact(DisplayName = "Condition coverage: onbekende rol wordt afgewezen")]
    public void TryNormalize_WithUnknownRole_ReturnsFalse()
    {
        // act: rol die niet bestaat normaliseren
        var result = GebruikerSoorten.TryNormalize("beheerder", out var normalized);

        // assert: ongeldige rol → false en lege output
        Assert.False(result);
        Assert.Equal(string.Empty, normalized);
    }

    [Fact(DisplayName = "Condition coverage: bekende rol wordt hoofdletterongevoelig geaccepteerd")]
    public void TryNormalize_WithValidRole_ReturnsNormalized()
    {
        // act: geldige rol in rare hoofdletters normaliseren
        var result = GebruikerSoorten.TryNormalize("bEdRiJf", out var normalized);

        // assert: moet slagen en nette gestandaardiseerde waarde teruggeven
        Assert.True(result);
        Assert.Equal("Bedrijf", normalized);
    }
}