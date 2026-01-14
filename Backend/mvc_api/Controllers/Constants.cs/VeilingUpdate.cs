using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers.Constants;

public class VeilingUpdate
{
    public async Task ForEachUpdateProduct(IQueryable<Veiling> veilingenTeUpdaten, DateTime now, AppDbContext _db, CancellationToken ct)
    {
        foreach (var v in veilingenTeUpdaten)
        {
            // Check opnieuw per item wat er moet gebeuren
            if (now >= v.Eindtijd)
            {
                // Tijd is voorbij -> Sluiten
                v.Status = VeilingStatus.Inactive;
            }
            else if (now >= v.Begintijd && now < v.Eindtijd)
            {
                v.Status = VeilingStatus.Active;
            }
        }
        // Sla alle wijzigingen in één keer op
        await _db.SaveChangesAsync(ct);
    }   
}