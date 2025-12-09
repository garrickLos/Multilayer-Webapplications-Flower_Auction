using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BiedingController : ControllerBase
{
    private readonly AppDbContext _db;

    public BiedingController(AppDbContext db) => _db = db;

    // afgestemd op VeilingController
    private const string StatusActive = "active";

    // GET: api/Bieding/Klant?gebruikerNr=&veilingProductNr=
    [HttpGet("Klant")]
    [Authorize (Roles ="Koper")]
    public async Task<ActionResult<IEnumerable<klantBiedingGet_dto>>> GetKlantBiedingen(
        [FromQuery] int? gebruikerNr,
        [FromQuery] int? veilingProductNr,
        CancellationToken ct = default)
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

        return Ok(items);
    }

    // GET: api/Bieding?gebruikerNr=&veilingNr=&page=&pageSize=
    [HttpGet]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<ActionResult<IEnumerable<VeilingMeester_BiedingDto>>> GetAll(
        [FromQuery] int? gebruikerNr,
        [FromQuery] int? veilingNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
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
        
        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(b => b.BiedNr)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectToBieding_VeilingMeester()
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

        return Ok(items);
    }

    // GET: api/Bieding/1001
    [HttpGet("{id:int}")]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<ActionResult<VeilingMeester_BiedingDto>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await _db.Biedingen.AsNoTracking()
            .Where(x => x.BiedNr == id)
            .ProjectToBieding_VeilingMeester()
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen bieding met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Bieding
    [HttpPost]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<ActionResult<VeilingMeester_BiedingDto>> Create(
        [FromBody] BiedingCreateDto dto,
        CancellationToken ct = default)
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
        if (!string.Equals(veilingproduct.Veiling?.Status, StatusActive, StringComparison.OrdinalIgnoreCase))
            return BadRequest(CreateProblemDetails(
                "Ongeldige status",
                "Er kan alleen geboden worden op een actieve veiling.",
                400));

        var entity = new Bieding
        {
            BiedNr           = dto.BiedingNr,
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

        return CreatedAtAction(nameof(GetById), new { id = entity.BiedNr }, result);
    }

    // PUT: api/Bieding/1001
    [HttpPut("{id:int}")]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<ActionResult<VeilingMeester_BiedingDto>> Update(
        int id,
        [FromBody] BiedingUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _db.Biedingen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen bieding met ID {id}.", 404));

        entity.BedragPerFust = dto.BedragPerFust;
        entity.AantalStuks   = dto.AantalStuks;

        await _db.SaveChangesAsync(ct);

        return Ok(new BiedingUpdateDto
        {
            BedragPerFust = entity.BedragPerFust,
            AantalStuks = entity.AantalStuks,
        });
    }

    // DELETE: api/Bieding/1001
    [HttpDelete("{id:int}")]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Biedingen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen bieding met ID {id}.", 404));

        _db.Biedingen.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title    = title,
            Detail   = detail,
            Status   = statusCode,
            Instance = HttpContext?.Request?.Path
        };
}

// dit zijn de Dto projecties die worden opgehaald voor de data die nodig is. 
// de projectToMeesterDto is voor het ophalen van meerdere gegevens voor de veilingsMeester
public static class BiedingExtensions
{
    // Projectie voor Veilingmeesters
    public static IQueryable<VeilingMeester_BiedingDto> ProjectToBieding_VeilingMeester(
        this IQueryable<Bieding> query)
    {
        return query.Select(b => new VeilingMeester_BiedingDto
        {   // Eigen properties van VeilingMeester_BiedingDto
            BiedingNr = b.BiedNr,
            VeilingNr = b.Veilingproduct!.VeilingNr,
            VeilingProductNr = b.VeilingproductNr,

            // Properties geërfd van BaseBieding_Dto
            AantalStuks = b.AantalStuks,
            GebruikerNr = b.GebruikerNr,
        });
    }
}