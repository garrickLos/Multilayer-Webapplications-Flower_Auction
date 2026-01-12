public static class TijdZoneConfig
{
    public const string Amsterdam = "Europe/Amsterdam";
}

public struct DateTimeWithZone
{
    private readonly DateTime utcDateTime;
    private readonly TimeZoneInfo timeZone;

    public DateTimeWithZone(DateTime dateTime, string timeZoneId)
    {
        // Converteer de invoer altijd naar UTC voor consistente opslag
        this.utcDateTime = dateTime.ToUniversalTime();
        
        // Zoek de tijdzone op basis van de ID (bijv. "Europe/Amsterdam")
        this.timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
    }

    public DateTime LocalTime
    {
        get 
        {
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, timeZone); 
        }
    }        
}