using mvc_api.Models.Dtos;
using Xunit;

namespace mvc_api.Tests.Domain;

/// <summary>
/// Verifies that the GebruikerSoorten helper normalizes values correctly without touching
/// database state. No external dependencies are required.
/// </summary>
public class GebruikerSoortenTests
{
    [Theory]
    [InlineData("Kweker", true, "Kweker")]
    [InlineData("kweker", true, "Kweker")]
    [InlineData("KOPER", true, "Koper")]
    [InlineData(" onbekend ", false, "")]
    [InlineData("", false, "")]
    public void TryNormalize_VariousInputs_ReturnsExpectedOutcome(string? input, bool expectedResult, string expectedRole)
    {
        // Act
        var result = GebruikerSoorten.TryNormalize(input, out var normalized);

        // Assert
        Assert.Equal(expectedResult, result);
        Assert.Equal(expectedRole, normalized);
    }
}
