using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
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

    // Status-constants, afgestemd op VeilingController
    private const string StatusActive = "active";
    private const string StatusSold   = "sold";

    public BiedingController(AppDbContext db)
    {
        _db = db;
    }

    // Korte DTO's
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

        var query = _db.Biedingen.AsNoTracking();

        if (gebruikerNr is not null)
            query = query.Where(b => b.GebruikerNr == gebruikerNr);

        if (veilingNr is not null)
            query = query.Where(b => b.VeilingNr == veilingNr);

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
        var b = await _db.Biedingen
            .AsNoTracking()
            .Where(x => x.BiedNr == id)
            .Select(x => new BDetail(
                x.BiedNr,
                x.BedragPerFust,
                x.AantalStuks,
                x.GebruikerNr,
                x.VeilingNr
            ))
            .FirstOrDefaultAsync(ct);

        return b is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen bieding met ID {id}.", 404))
            : Ok(b);
    }

    // POST: api/Bieding
    [HttpPost]
    public async Task<ActionResult<BDetail>> Create(
        [FromBody] BiedingCreateDto dto,
        CancellationToken ct = default)
    {
        // [ApiController] doet al ModelState-validatie

        // Check: gebruiker moet bestaan
        var gebruikerBestaat = await _db.Gebruikers
            .AsNoTracking()
            .AnyAsync(g => g.GebruikerNr == dto.GebruikerNr, ct);

        if (!gebruikerBestaat)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Gebruiker bestaat niet.", 400));

        // Haal de veiling als *tracked* entity op (dus geen AsNoTracking)
        var veiling = await _db.Veilingen
            .FirstOrDefaultAsync(v => v.VeilingNr == dto.VeilingNr, ct);

        if (veiling is null)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Veiling bestaat niet.", 400));

        // Alleen bieden op actieve veilingen
        if (!string.Equals(veiling.Status, StatusActive, StringComparison.OrdinalIgnoreCase))
            return BadRequest(CreateProblemDetails("Ongeldige status", "Er kan alleen geboden worden op een actieve veiling.", 400));

        var entity = new Bieding
        {
            BedragPerFust = dto.BedragPerFust,
            AantalStuks   = dto.AantalStuks,
            GebruikerNr   = dto.GebruikerNr,
            VeilingNr     = dto.VeilingNr
        };

        _db.Biedingen.Add(entity);

        // Transaction: bieding + status-verandering in één keer
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            // 1) Bieding opslaan
            await _db.SaveChangesAsync(ct);

            // 2) Veiling op 'sold' zetten zodra er een bieding is
            veiling.Status = StatusSold;

            await _db.SaveChangesAsync(ct);

            await tx.CommitAsync(ct);
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync(ct);
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
