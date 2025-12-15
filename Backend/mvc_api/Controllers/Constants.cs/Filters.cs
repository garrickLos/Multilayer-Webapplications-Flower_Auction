using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.statusPrinter;

namespace ApiGetFilters;

public class VeilingControllerFilter
{
    // De eigenschap waar het resultaat in wordt opgeslagen
    public IQueryable<Veiling> ResultaatQuery { get; private set; }

    // Constructor met extra parameter 'now'
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
            query = query.Where(v => v.Status == NormalizeStatus.Active && v.Eindtijd > now);
        }

        // Sla de lokale variabele op in de publieke eigenschap
        ResultaatQuery = query;
    }
}