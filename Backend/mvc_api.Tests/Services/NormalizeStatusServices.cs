using mvc_api.statusPrinter;
using Xunit;

namespace mvc_api.Tests.Services;

public class NormalizeStatusServices
{
    NormalizeStatus _statusPrint = new NormalizeStatus();

    [Theory 
        (DisplayName = "Input normal string")]
    [InlineData ("ASdnaskdnasdk",   "inactive")]
    [InlineData ("Sold",            "sold")]
    [InlineData ("SOLD",            "sold")]
    [InlineData ("Active",          "active")]
    [InlineData ("INACTIVE",        "inactive")]
    [InlineData ("ACTIVE",          "active")]
    public async Task TestStatusPrint_FullCapsInput(string testInput, string expectedOutput)
    {
        var response = _statusPrint.StatusPrinter(testInput);

        Assert.Equal(expectedOutput, response);
    }

    [Theory
        (DisplayName = "Input empty or null")]
    [InlineData (null,              "inactive")]
    [InlineData ("",                "inactive")]
    public async Task TestStatusPrint_nullInput(string testInput, string expectedOutput)
    {
        var response = _statusPrint.StatusPrinter(testInput);

        Assert.Equal(expectedOutput, response);
    }
}