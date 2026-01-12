using Xunit;

namespace mvc_api.Tests.Data;

public class LocalTimeTest
{
    [Theory
        (DisplayName = "LocalTimeTest: Different location to Europe/Amsterdam")]
    // new york -> amsterdam = +6 uur
    [InlineData ("2024-01-01T10:00:00", "America/New_York", "2024-01-01T16:00:00")]
    // tokyo -> amsterdam = -8 uur verschil
    [InlineData ("2024-01-01T20:00:00", "Asia/Tokyo", "2024-01-01T12:00:00")]
    // London -> = +1 uur verschil
    [InlineData("2024-01-01T12:00:00", "Europe/London", "2024-01-01T13:00:00")]
    // dubai -> amsterdam = -3 uur verschil
    [InlineData("2024-01-01T07:00:00", "Asia/Dubai", "2024-01-01T04:00:00")]
    // Kathmandu -> amsterdam = -4:45 uur
    [InlineData("2024-01-01T05:00:00", "Asia/Kathmandu", "2024-01-01T00:15:00")]
    public void TestLocalToWestEurope(string insertDateString, string sourceTimeZoneId, string expectedTimeString)
    {
        // configt de string van de data om DateTime te kunnen gebruiken.
        DateTime insertDate = DateTime.Parse(insertDateString);
        DateTime expectedTime = DateTime.Parse(expectedTimeString);

        TimeZoneInfo sourceZone = TimeZoneInfo.FindSystemTimeZoneById(sourceTimeZoneId);

        DateTime utcMoment = TimeZoneInfo.ConvertTimeToUtc(insertDate, sourceZone);

        var amsterdamStruct = new DateTimeWithZone(utcMoment, TijdZoneConfig.Amsterdam);

        var actualTime = amsterdamStruct.LocalTime;

        Assert.Equal(expectedTime, actualTime);
    }

}