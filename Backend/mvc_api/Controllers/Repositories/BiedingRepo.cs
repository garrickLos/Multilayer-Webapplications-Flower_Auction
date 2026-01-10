using ApiGetFilters;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Data.Filters;
using mvc_api.Models;

// interface import
using mvc_api.Repo.Interfaces;

namespace mvc_api.Repo;

// Implementeer de interface die we eerder ontworpen hebben
public class BiedingRepository :  IBiedingRepo
{
    private readonly VeilingControllerFilter _controllerFilter;

    private readonly AppDbContext _db;

    public BiedingRepository(AppDbContext db)
    {
        _db = db;
    }

    // geef een typel terug van de items en het totale aantal items dat is gevonden
    public async Task<(List<klantBiedingGet_dto> Items, int Total)> GetKlantBiedingenAsync(
        int? gebruikerNr, 
        int? veilingProductNr,
        bool orderDescending,
        int page, 
        int pageSize, 
        CancellationToken ct)
    {
        var query = _db.Biedingen.AsNoTracking().AsQueryable();

        // checked of er specifiek gekeken wordt naar een gebruiker
        query = query.FilterItemNr(gebruikerNr, b => b.GebruikerNr == gebruikerNr);
        
        query = query.FilterItemNr(veilingProductNr, b => b.VeilingproductNr == veilingProductNr);            

        query = query.FilterOrderDescending(orderDescending, b=> b.BiedNr);

        // haalt de totale aantal op van items dat is gevonden
        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectieToBieding_Klant()
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<(List<VeilingMeester_BiedingDto> Items, int Total)> GetVeilingMeesterBiedingenAsync(
        int? gebruikerNr, 
        int? veilingNr,
        bool orderDescending,
        int page, 
        int pageSize , 
        CancellationToken ct)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Biedingen.AsNoTracking()
            .Include(b => b.Veilingproduct)
            .AsQueryable();

        // checked of de gebruikerNr wordt gebruikt en filtert erop
        query = query.FilterItemNr(gebruikerNr, b => b.GebruikerNr == gebruikerNr);

        // checked of de veilingNr wordt gebruikt en filtert erop
        query = query.FilterItemNr(veilingNr, b => b.Veilingproduct!.VeilingNr == veilingNr);

        // filtert op ascending of descending order gebaseerd op de boolean die is meegenomen
        query = query.FilterOrderDescending(orderDescending, b => b.BiedNr);
        
        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectToBieding_VeilingMeester()
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<VeilingMeester_BiedingDto> GetById(
        int id, 
        CancellationToken ct = default)
    {        
        var items = await _db.Biedingen.AsNoTracking()
            .Where(x => x.BiedNr == id)
            .ProjectToBieding_VeilingMeester()
            .FirstOrDefaultAsync(ct);

        return items;
    }

    public async Task<VeilingMeester_BiedingDto> CreateAsync(BiedingCreateDto dto, CancellationToken ct)
    {
        // Gebruiker moet bestaan
        var gebruikerBestaat = await _db.Gebruikers
            .AsNoTracking()
            .AnyAsync(g => g.GebruikerNr == dto.GebruikerNr, ct);

        if (!gebruikerBestaat)
            throw new KeyNotFoundException("Gebruiker bestaat niet.");

        var veilingproduct = await _db.Veilingproducten
            .Include(vp => vp.Veiling)
            .FirstOrDefaultAsync(vp => vp.VeilingProductNr == dto.VeilingproductNr, ct);
        
        if (veilingproduct is null)
            throw new KeyNotFoundException("Veilingproduct bestaat niet.");
        
        if (!string.Equals(veilingproduct.Veiling?.Status, "Active", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Er kan alleen geboden worden op een actieve veiling.");

        var entity = new Bieding
        {
            BedragPerFust    = dto.BedragPerFust,
            AantalStuks      = dto.AantalStuks,
            GebruikerNr      = dto.GebruikerNr,
            VeilingproductNr = dto.VeilingproductNr
        };

        _db.Biedingen.Add(entity);
        await _db.SaveChangesAsync(ct);

        return new VeilingMeester_BiedingDto        
        { 
            BiedingNr        = entity.BiedNr,
            BedragPerFust    = entity.BedragPerFust,
            AantalStuks      = entity.AantalStuks,
            GebruikerNr      = entity.GebruikerNr,
            VeilingNr        = veilingproduct.Veiling?.VeilingNr,
            VeilingProductNr = entity.VeilingproductNr,
        };
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var entity = await _db.Biedingen.FindAsync(new object[] { id }, ct);

        // gooit een notFound exception als de entity er niet is
        if (entity is null)
        {
            throw new KeyNotFoundException($"Bieding met ID {id} is niet gevonden.");
        }

        // Verwijder de entiteit
        _db.Biedingen.Remove(entity);
        await _db.SaveChangesAsync(ct);

        return true;
    }
}