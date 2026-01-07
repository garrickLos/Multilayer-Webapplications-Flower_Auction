using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Repo.BiedingRepo;

public interface IBiedingRepo
{
    Task<(List<klantBiedingGet_dto> Items, int Total)> GetKlantBiedingenAsync(int? gebruikerNr, int? veilingProductNr, bool orderDescending, int page, int pageSize, CancellationToken ct);
    Task<(List<VeilingMeester_BiedingDto> Items, int Total)> GetVeilingMeesterBiedingenAsync(int? gebruikerNr, int? veilingNr, bool orderDescending, int page, int pageSize , CancellationToken ct);
    Task<ActionResult<VeilingMeester_BiedingDto>> GetById(int id, CancellationToken ct = default);
    //Task<Bieding?> CreateAsync(BiedingCreateDto dto, CancellationToken ct);
    // Task<bool> DeleteAsync(int id, CancellationToken ct);
}

// Implementeer de interface die we eerder ontworpen hebben
public class BiedingRepository :  IBiedingRepo
{
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
        if (gebruikerNr.HasValue)
            query = query.Where(b => b.GebruikerNr == gebruikerNr.Value);

        // kijkt of er een specifiek veilingProductnr nodig is
        if (veilingProductNr.HasValue)
            query = query.Where(b => b.VeilingproductNr == veilingProductNr.Value);

        if (orderDescending)
        {
            query = query.OrderByDescending(b => b.BiedNr);
        }

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

        if (gebruikerNr is int gNr)
            query = query.Where(b => b.GebruikerNr == gNr);

        if (veilingNr is int vNr)
            query = query.Where(b => b.Veilingproduct!.VeilingNr == vNr);

        if (orderDescending)
        {
            query = query.OrderByDescending(b => b.BiedNr);
        }
        
        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectToBieding_VeilingMeester()
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<ActionResult<VeilingMeester_BiedingDto>> GetById(
        int id, 
        CancellationToken ct = default)
    {
        var items = await _db.Biedingen.AsNoTracking()
            .Where(x => x.BiedNr == id)
            .ProjectToBieding_VeilingMeester()
            .FirstOrDefaultAsync(ct);

        return items;
    }

/*
    public async Task<Bieding?> CreateAsync(BiedingCreateDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        // Gebruiker moet bestaan
        var gebruikerBestaat = await _db.Gebruikers
            .AsNoTracking()
            .AnyAsync(g => g.GebruikerNr == dto.GebruikerNr, ct);

        if (!gebruikerBestaat)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Gebruiker bestaat niet.", 400));

        var veilingproduct = await _db.Veilingproducten
            .Include(vp => vp.Veiling)
            .FirstOrDefaultAsync(vp => vp.VeilingProductNr == dto.VeilingproductNr, ct);
        
        if (veilingproduct is null)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Veilingproduct bestaat niet.", 400));
        
        // Alleen bieden op actieve veilingen
        if (!string.Equals(veilingproduct.Veiling?.Status, NormalizeStatus.Active, StringComparison.OrdinalIgnoreCase))
            return BadRequest(CreateProblemDetails(
                "Ongeldige status",
                "Er kan alleen geboden worden op een actieve veiling.",
                400));

        var entity = new Bieding
        {
            BedragPerFust    = dto.BedragPerFust,
            AantalStuks      = dto.AantalStuks,
            GebruikerNr      = dto.GebruikerNr,
            VeilingproductNr = dto.VeilingproductNr
        };

        _db.Biedingen.Add(entity);

        // EF wrapt SaveChanges zelf in een transaction
        try
        {
            // eventueel: veiling.Status = StatusSold; als je bij een eerste bod meteen 'sold' wilt
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return StatusCode(500, CreateProblemDetails(
                "Opslagfout",
                "Er is een fout opgetreden bij het opslaan van de bieding.",
                500));
        }

        // wat je uiteindelijk in swagger wilt zien dat terugkomt in het beeld van wat er veranderd is en de nieuwe waardes
        var result = new VeilingMeester_BiedingDto        
        { 
            BiedingNr        = entity.BiedNr,
            BedragPerFust    = entity.BedragPerFust,
            AantalStuks      = entity.AantalStuks,
            GebruikerNr      = entity.GebruikerNr,
            VeilingNr        = veilingproduct.Veiling?.VeilingNr,
            VeilingProductNr = entity.VeilingproductNr,
        };
    }
*/
}