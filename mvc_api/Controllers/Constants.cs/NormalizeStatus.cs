namespace mvc_api.statusPrinter;

public class NormalizeStatus
{
    public string StatusPrinter(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return VeilingStatus.Inactive;

        return status.Trim().ToLowerInvariant() switch
        {
            VeilingStatus.Active => VeilingStatus.Active,
            VeilingStatus.Sold => VeilingStatus.Sold,
            _ => VeilingStatus.Inactive
        };
    }
}