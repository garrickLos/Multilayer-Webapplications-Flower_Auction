using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.statusPrinter;

namespace ApiGetFilters;

public interface IVeilingControllerFilter
{
    IQueryable<Veiling> Apply(
        int? veilingProduct,
        DateTime? from,
        DateTime? to,
        bool onlyActive,
        DateTime now);
}

public class VeilingControllerFilter : IVeilingControllerFilter
{
    private readonly AppDbContext _db;

    public VeilingControllerFilter(AppDbContext db) => _db = db;

    public IQueryable<Veiling> Apply(
        int? veilingProduct,
        DateTime? from,
        DateTime? to,
        bool onlyActive,
        DateTime now)
    {
        // Start de query
        var query = _db.Veiling.AsNoTracking().AsQueryable();

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

        return query;
    }
}