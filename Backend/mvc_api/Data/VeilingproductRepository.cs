using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using mvc_api.Models;

namespace mvc_api.Data;

public class VeilingproductRepository : IVeilingproductRepository
{
    private readonly AppDbContext _db;

    public VeilingproductRepository(AppDbContext db) => _db = db;

    public IQueryable<Veilingproduct> Query() =>
        _db.Veilingproducten.AsNoTracking();

    public IQueryable<Veilingproduct> QueryWithCategorie() =>
        _db.Veilingproducten
            .AsNoTracking()
            .Include(v => v.Categorie);

    public async Task<Veilingproduct?> FindAsync(int veilingproductNr, CancellationToken ct) =>
        await _db.Veilingproducten.FindAsync(new object[] { veilingproductNr }, ct);

    public Task<bool> CategorieExistsAsync(int categorieNr, CancellationToken ct) =>
        _db.Categorieen.AsNoTracking().AnyAsync(c => c.CategorieNr == categorieNr, ct);

    public void Add(Veilingproduct entity) => _db.Veilingproducten.Add(entity);

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
