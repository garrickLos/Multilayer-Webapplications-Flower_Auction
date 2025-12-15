namespace mvc_api.statusPrinter;

public class NormalizeStatus
{

    public const string Active = "active";
    public const string Inactive = "inactive";
    public const string Sold = "sold"; 

    public string StatusPrinter(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return Inactive;
        } 

        return status.Trim().ToLowerInvariant() switch
        {
            Active => Active,
            Sold => Sold,
            _ => Inactive
        };
    }
}