using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using mvc_api.Models;

namespace mvc_api.Data;

public interface IVeilingproductRepository
{
    IQueryable<Veilingproduct> Query();
    IQueryable<Veilingproduct> QueryWithCategorie();
    Task<Veilingproduct?> FindAsync(int veilingproductNr, CancellationToken ct);
    Task<bool> CategorieExistsAsync(int categorieNr, CancellationToken ct);
    void Add(Veilingproduct entity);
    Task SaveChangesAsync(CancellationToken ct);
}
