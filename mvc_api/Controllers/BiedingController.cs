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

    // afgestemd op VeilingController
    private const string StatusActive = "active";

    public BiedingController(AppDbContext db) => _db = db;

    public sealed record BList(
        int BiedNr,
        decimal BedragPerFust,
        int AantalStuks,
        int GebruikerNr,
        int VeilingNr
    );

    public sealed record BDetail(
        int BiedNr,
        decimal BedragPerFust,
        int AantalStuks,
        int GebruikerNr,
        int VeilingNr
    );

    // GET: api/Bieding?gebruikerNr=&veilingNr=&page=&pageSize=
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BList>>> GetAll(
        [FromQuery] int? gebruikerNr,
        [FromQuery] int? veilingNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Biedingen.AsNoTracking().AsQueryable();

        if (gebruikerNr is int gNr)
            query = query.Where(b => b.GebruikerNr == gNr);

        if (veilingNr is int vNr)
            query = query.Where(b => b.VeilingNr == vNr);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(b => b.BiedNr)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BList(
                b.BiedNr,
                b.BedragPerFust,
                b.AantalStuks,
                b.GebruikerNr,
                b.VeilingNr
            ))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

        return Ok(items);
    }

    // GET: api/Bieding/1001
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BDetail>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await _db.Biedingen.AsNoTracking()
            .Where(x => x.BiedNr == id)
            .Select(x => new BDetail(
                x.BiedNr,
                x.BedragPerFust,
                x.AantalStuks,
                x.GebruikerNr,
                x.VeilingNr
            ))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen bieding met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Bieding
    [HttpPost]
    public async Task<ActionResult<BDetail>> Create(
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

        // Veiling als tracked entity
        var veiling = await _db.Veilingen
            .FirstOrDefaultAsync(v => v.VeilingNr == dto.VeilingNr, ct);

        if (veiling is null)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Veiling bestaat niet.", 400));

        // Alleen bieden op actieve veilingen
        if (!string.Equals(veiling.Status, StatusActive, StringComparison.OrdinalIgnoreCase))
            return BadRequest(CreateProblemDetails(
                "Ongeldige status",
                "Er kan alleen geboden worden op een actieve veiling.",
                400));

        var entity = new Bieding
        {
            BedragPerFust = dto.BedragPerFust,
            AantalStuks   = dto.AantalStuks,
            GebruikerNr   = dto.GebruikerNr,
            VeilingNr     = dto.VeilingNr
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

        var result = new BDetail(
            entity.BiedNr,
            entity.BedragPerFust,
            entity.AantalStuks,
            entity.GebruikerNr,
            entity.VeilingNr
        );

        return CreatedAtAction(nameof(GetById), new { id = entity.BiedNr }, result);
    }

    // PUT: api/Bieding/1001
    [HttpPut("{id:int}")]
    public async Task<ActionResult<BDetail>> Update(
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

        return Ok(new BDetail(
            entity.BiedNr,
            entity.BedragPerFust,
            entity.AantalStuks,
            entity.GebruikerNr,
            entity.VeilingNr
        ));
    }

    // DELETE: api/Bieding/1001
    [HttpDelete("{id:int}")]
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
