using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GebruikerController : ControllerBase
{
    private readonly AppDbContext _db;
    public GebruikerController(AppDbContext db) => _db = db;

    // Response DTO's
    public sealed record GList(int GebruikerNr, string Naam, string Email, string Soort);
    public sealed record GBid(int BiedNr, decimal BedragPerFust, int AantalStuks, int VeilingNr);
    public sealed record GDetail(
        int GebruikerNr,
        string Naam,
        string Email,
        string Soort,
        DateTime? LaatstIngelogd,
        string? Kvk,
        string? StraatAdres,
        string? Postcode,
        IEnumerable<GBid> Biedingen
    );

    // GET: api/Gebruiker?q=jan&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GList>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Gebruikers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(g =>
                g.BedrijfsNaam.Contains(term) ||
                g.Email.Contains(term));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(g => g.BedrijfsNaam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new GList(g.GebruikerNr, g.BedrijfsNaam, g.Email, g.Soort))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

        return Ok(items);
    }

    // GET: api/Gebruiker/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<GDetail>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await ProjectToDetail(
                _db.Gebruikers.AsNoTracking().Where(x => x.GebruikerNr == id))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Gebruiker
    [HttpPost]
    public async Task<ActionResult<GDetail>> Create(
        [FromBody] GebruikerCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var e = new Gebruiker
        {
            BedrijfsNaam = dto.BedrijfsNaam.Trim(),
            Email        = dto.Email.Trim(),
            Wachtwoord   = dto.Wachtwoord,
            Soort        = dto.Soort,
            Kvk          = dto.Kvk,
            StraatAdres  = dto.StraatAdres,
            Postcode     = dto.Postcode,
        };

        _db.Gebruikers.Add(e);
        await _db.SaveChangesAsync(ct);

        var r = await ProjectToDetail(
                _db.Gebruikers.AsNoTracking().Where(x => x.GebruikerNr == e.GebruikerNr))
            .FirstAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = e.GebruikerNr }, r);
    }

    // PUT: api/Gebruiker/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<GDetail>> Update(
        int id,
        [FromBody] GebruikerUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var e = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (e is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        e.BedrijfsNaam = dto.BedrijfsNaam.Trim();
        e.Email        = dto.Email.Trim();
        e.Soort        = dto.Soort;
        e.Kvk          = dto.Kvk;
        e.StraatAdres  = dto.StraatAdres;
        e.Postcode     = dto.Postcode;

        await _db.SaveChangesAsync(ct);

        var r = await ProjectToDetail(
                _db.Gebruikers.AsNoTracking().Where(x => x.GebruikerNr == id))
            .FirstAsync(ct);

        return Ok(r);
    }

    // DELETE: api/Gebruiker/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var e = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (e is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        _db.Gebruikers.Remove(e);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Helpers

    private static IQueryable<GDetail> ProjectToDetail(IQueryable<Gebruiker> query) =>
        query.Select(g => new GDetail(
            g.GebruikerNr,
            g.BedrijfsNaam,
            g.Email,
            g.Soort,
            g.LaatstIngelogd,
            g.Kvk,
            g.StraatAdres,
            g.Postcode,
            g.Biedingen
                .OrderByDescending(b => b.BiedNr)
                .Select(b => new GBid(b.BiedNr, b.BedragPerFust, b.AantalStuks, b.VeilingNr))
        ));

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title    = title,
            Detail   = detail,
            Status   = statusCode,
            Instance = HttpContext?.Request?.Path
        };
}
