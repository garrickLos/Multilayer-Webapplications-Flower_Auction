using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.statusPrinter;

namespace ApiGetFilters;

public interface IVeilingControllerFilter
{
    /// <summary>
    /// Past verschillende filters toe aan de hand van de meegegeven parameters
    /// </summary>
    /// <param name="veilingProduct">optionele veilingproduct die wordt meegegeven</param>
    /// <param name="from">optionele begindatum die wordt meegegeven</param>
    /// <param name="to">optionele einddatum die wordt meegegeven</param>
    /// <param name="onlyActive">indien true worden alleen veilingen teruggeven die actief zijn</param>
    /// <param name="now">huidige tijd die wordt meegegeven om te controleren of de begin/eindtijd al geweest zijn</param>
    /// <returns>geeft de gefilterde query terug</returns>
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

    /// <summary>
    /// initialiseert een nieuwe instantie van de filterklas
    /// </summary>
    /// <param name="db">de databasecontext die wordt gebruikt om een veiling te benaderen</param>
    public VeilingControllerFilter(AppDbContext db) => _db = db;

    //erft over van apply van de Iveilingcontrollerfilter
    public IQueryable<Veiling> Apply(
        int? veilingProduct,
        DateTime? from,
        DateTime? to,
        bool onlyActive,
        DateTime now)
    {
        // Basis query 
        var query = _db.Veiling.AsNoTracking().AsQueryable();

        // Filter op veilingproduct indien er een veilingproduct is
        if (veilingProduct.HasValue)
            query = query.Where(v => v.Veilingproducten.Any(p => p.VeilingProductNr == veilingProduct.Value));

        //Filter op veilingen waar de begintijd groter of gelijk is aan de meegegeven from tijd
        if (from.HasValue)
            query = query.Where(v => v.Begintijd >= from.Value);
        //Filter op veilingen waar de eindtijd kleiner of gelijk is aan de meegegeven to tijd
        if (to.HasValue)
            query = query.Where(v => v.Eindtijd <= to.Value);

        //filter op veilingen waarvan de status actief is en de eindtijd groter is dan nu als onlyActive true is 
        if (onlyActive)
        {
            query = query.Where(v => v.Status == NormalizeStatus.Active && v.Eindtijd > now);
        }

        return query;
    }
}