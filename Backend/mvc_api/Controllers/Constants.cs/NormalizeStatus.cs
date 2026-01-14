namespace mvc_api.statusPrinter;

public class NormalizeStatus
{
    //vaste waardes
    public const string Active = "active";
    public const string Inactive = "inactive";
    public const string SoldOut = "uitverkocht";
    
    /// <summary>
    /// krijgt een status mee, als de status niet overeenkomt bet de bekende waardes wordt het omgezet naar "inactive"
    /// </summary>
    /// <param name="status">krijgt de status van een veiling mee, mag null</param>
    /// <returns>geeft een statuswaarde "active", "inactive", "uitverkocht" terug</returns>
    public string StatusPrinter(string? status)
    {
        //als status null, leef of alleen spaties bevat geeft het "inactive" terug
        if (string.IsNullOrWhiteSpace(status))
        {
            return Inactive;
        }

        //verwijderd spaties en zet het om naar kleine letters
        return status.Trim().ToLowerInvariant() switch
        {
            Active => Active,
            "sold" => SoldOut,
            SoldOut => SoldOut,
            _ => Inactive
        };
    }
}