/// <summary>
/// Statische waardes die opgeroepen kunnen worden om een tijdzone makkelijk te krijgen.
/// Specifiek voor het vermijden van fouten met een tijdszone oproepen.
/// </summary>
public static class TijdZoneConfig
{
    public const string Amsterdam = "Europe/Amsterdam";
}

/// <summary>
/// structuur die de utc tijd veranderd naar de gewilde tijdzone.
/// </summary>
public struct DateTimeWithZone
{
    private readonly DateTime utcDateTime; // ingevoerde tijd die veranderd wordt (wss UTCNow)
    private readonly TimeZoneInfo timeZone; // tijdzone waarin de utcDateTime in veranderd

    /// <summary>
    /// Constructor die de dateTime en de id van de tijdzone opvraagt.
    /// tijdzoneId zit in de statische klas om problemen te vermijden met typefouten.
    /// </summary>
    /// <param name="dateTime">Tijd die veranderd moet worden aan de hand van een specifieke tijdzone</param>
    /// <param name="timeZoneId">Specifieke tijdzone die de tijd veranderd naar de gewilde tijd</param>
    public DateTimeWithZone(DateTime dateTime, string timeZoneId)
    {
        // Converteer de invoer altijd naar UTC voor consistente opslag
        this.utcDateTime = dateTime.ToUniversalTime();
        
        // Zoek de tijdzone op basis van de ID (bijv. "Europe/Amsterdam")
        this.timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
    }

    /// <summary>
    /// Geeft de converted tijd terug op de tijdzone die is geplaatst toen de struct is aangeroepen.
    /// </summary>
    public DateTime LocalTime
    {
        get 
        {
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, timeZone); 
        }
    }        
}