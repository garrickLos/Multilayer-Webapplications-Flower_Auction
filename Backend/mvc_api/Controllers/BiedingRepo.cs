using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Repo.BiedingRepo;

public interface IBiedingRepo
{
    Task<List<klantBiedingGet_dto>> GetKlantBiedingenAsync(int? gebruikerNr, int? veilingProductNr, CancellationToken ct);
}

// Implementeer de interface die we eerder ontworpen hebben
public class BiedingRepository : IBiedingRepo
{
    private readonly AppDbContext _db;

    public BiedingRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<klantBiedingGet_dto>> GetKlantBiedingenAsync(int? gebruikerNr, int? veilingProductNr, CancellationToken ct)
    {
        var query = _db.Biedingen.AsNoTracking().AsQueryable();

        if (gebruikerNr.HasValue)
            query = query.Where(b => b.GebruikerNr == gebruikerNr.Value);

        if (veilingProductNr.HasValue)
            query = query.Where(b => b.VeilingproductNr == veilingProductNr.Value);

        var items = await query
            .Select(b => new klantBiedingGet_dto(
                b.VeilingproductNr,
                b.BedragPerFust,
                b.AantalStuks,
                b.GebruikerNr
            ))
            .ToListAsync(ct);

        return items;
    }

    public async Task<Veilingproduct?> GetVeilingProduct(int veilingProductNr)
    {
        return await _db.Veilingproducten
            .AsNoTracking()
            .Include(vp => vp.Veiling)
            .FirstOrDefaultAsync(vp => vp.VeilingProductNr == veilingProductNr);
    }

    public Bieding AddBieding(Bieding entity)
    {
        _db.Biedingen.Add(entity);
        return entity;
    }

    public async Task SaveChanges(CancellationToken ct)
    {
        await _db.SaveChangesAsync(ct);
    }
}