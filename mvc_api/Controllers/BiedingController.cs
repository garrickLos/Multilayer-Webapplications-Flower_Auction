using System;
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

    // GET: api/Bieding?gebruikerNr=&veilingNr=&page=&pageSize=
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VeilingMeester_BiedingDto>>> GetAll(
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
            .ProjectToVeilingMeester()
            .ToListAsync(ct);

        this.SetPaginationHeaders(total, page, pageSize);

        return Ok(items);
    }

    // GET: api/Bieding/1001
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VeilingMeester_BiedingDto>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await _db.Biedingen.AsNoTracking()
            .Where(x => x.BiedNr == id)
            .ProjectToVeilingMeester()
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen bieding met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Bieding
    [HttpPost]
    public async Task<ActionResult<VeilingMeester_BiedingDto>> Create(
        [FromBody] BiedingCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (!await _db.Gebruikers.AsNoTracking().AnyAsync(g => g.GebruikerNr == dto.GebruikerNr, ct))
            return BadRequest(this.CreateProblemDetails("Ongeldige referentie", "Gebruiker bestaat niet.", 400));

        var veiling = await _db.Veilingen.FirstOrDefaultAsync(v => v.VeilingNr == dto.VeilingNr, ct);

        if (veiling is null)
            return BadRequest(this.CreateProblemDetails("Ongeldige referentie", "Veiling bestaat niet.", 400));

        // Alleen bieden op actieve veilingen
        if (!string.Equals(veiling.Status, VeilingStatus.Active, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(this.CreateProblemDetails(
                "Ongeldige status",
                "Er kan alleen geboden worden op een actieve veiling.",
                400));
        }

        var entity = new Bieding
        {
            BiedNr           = dto.BiedingNr,
            BedragPerFust    = dto.BedragPerFust,
            AantalStuks      = dto.AantalStuks,
            GebruikerNr      = dto.GebruikerNr,
            VeilingNr        = dto.VeilingNr,
            VeilingproductNr = dto.VeilingproductNr
        };

        _db.Biedingen.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return StatusCode(500, this.CreateProblemDetails(
                "Opslagfout",
                "Er is een fout opgetreden bij het opslaan van de bieding.",
                500));
        }

        var result = new VeilingMeester_BiedingDto
        {
            BiedingNr        = entity.BiedNr,
            BedragPerFust    = entity.BedragPerFust,
            AantalStuks      = entity.AantalStuks,
            GebruikerNr      = entity.GebruikerNr,
            VeilingNr        = entity.VeilingNr,
            VeilingProductNr = entity.VeilingproductNr
        };

        return CreatedAtAction(nameof(GetById), new { id = entity.BiedNr }, result);
    }

    // PUT: api/Bieding/1001
    [HttpPut("{id:int}")]
    public async Task<ActionResult<VeilingMeester_BiedingDto>> Update(
        int id,
        [FromBody] BiedingUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _db.Biedingen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen bieding met ID {id}.", 404));

        entity.BedragPerFust = dto.BedragPerFust;
        entity.AantalStuks   = dto.AantalStuks;

        await _db.SaveChangesAsync(ct);

        return Ok(new VeilingMeester_BiedingDto
        {
            BiedingNr     = entity.BiedNr,
            BedragPerFust = entity.BedragPerFust,
            AantalStuks   = entity.AantalStuks,
            GebruikerNr   = entity.GebruikerNr,
            VeilingNr     = entity.VeilingNr,
            VeilingProductNr = entity.VeilingproductNr
        });
    }

    // DELETE: api/Bieding/1001
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Biedingen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen bieding met ID {id}.", 404));

        _db.Biedingen.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public static class BiedingExtensions
{
    public static IQueryable<VeilingMeester_BiedingDto> ProjectToVeilingMeester(this IQueryable<Bieding> query) =>
        query.Select(b => new VeilingMeester_BiedingDto
        {
            BiedingNr        = b.BiedNr,
            VeilingNr        = b.VeilingNr,
            VeilingProductNr = b.VeilingproductNr,
            AantalStuks      = b.AantalStuks,
            GebruikerNr      = b.GebruikerNr,
            BedragPerFust    = b.BedragPerFust
        });
}
