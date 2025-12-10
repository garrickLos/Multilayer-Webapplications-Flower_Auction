using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace ApiGetFilters;

public class VeilingControllerFilter
{
    // 1. De eigenschap waar het resultaat in wordt opgeslagen
    public IQueryable<Veiling> ResultaatQuery { get; private set; }

    // 2. Constructor met extra parameter 'now'
    public VeilingControllerFilter(AppDbContext _db, 
                                    int? veilingProduct, 
                                    DateTime? from, 
                                    DateTime? to, 
                                    bool onlyActive, 
                                    DateTime now)
    {
        // Start de query
        var query = _db.Veilingen.AsNoTracking().AsQueryable();

        // Filters toepassen
        if (veilingProduct.HasValue)
            query = query.Where(v => v.Veilingproducten.Any(p => p.VeilingProductNr == veilingProduct.Value));

        if (from.HasValue)
            query = query.Where(v => v.Begintijd >= from.Value);

        if (to.HasValue)
            query = query.Where(v => v.Eindtijd <= to.Value);

        if (onlyActive)
        {
            // Hier wordt de parameter 'now' gebruikt
            query = query.Where(v => v.Status == VeilingStatus.Active && v.Eindtijd > now);
        }

        // 3. Sla de lokale variabele op in de publieke eigenschap
        ResultaatQuery = query;
    }
}