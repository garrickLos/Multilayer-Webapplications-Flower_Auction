using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController, Route("api/[controller]"), Produces("application/json")]
public class GebruikerController(AppDbContext db) : ControllerBase
{
    // Response DTO's
    public sealed record GList(int GebruikerNr, string Naam, string Email, string Soort);
    public sealed record GBid(int BiedNr, decimal BedragPerFust, int AantalStuks, int VeilingNr);
    public sealed record GDetail(
        int GebruikerNr, string Naam, string Email, string Soort,
        DateTime? LaatstIngelogd, string? Kvk, string? StraatAdres, string? Postcode,
        int? Assortiment, string? PersoneelsNr, IEnumerable<GBid> Biedingen);

    // GET: api/Gebruiker?q=jan&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GList>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = db.Gebruikers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(g => g.Naam.Contains(term) || g.Email.Contains(term));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(g => g.Naam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new GList(g.GebruikerNr, g.Naam, g.Email, g.Soort))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"] = page.ToString();
        Response.Headers["X-Page-Size"] = pageSize.ToString();

        return Ok(items);
    }

    // GET: api/Gebruiker/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<GDetail>> GetById(int id, CancellationToken ct = default)
    {
        var gebruiker = await db.Gebruikers
            .AsNoTracking()
            .Where(x => x.GebruikerNr == id)
            .Select(g => new GDetail(
                g.GebruikerNr, g.Naam, g.Email, g.Soort,
                g.LaatstIngelogd, g.Kvk, g.StraatAdres, g.Postcode,
                g.Assortiment, g.PersoneelsNr,
                g.Biedingen
                    .OrderByDescending(b => b.BiedNr)
                    .Select(b => new GBid(b.BiedNr, b.BedragPerFust, b.AantalStuks, b.VeilingNr))
            ))
            .FirstOrDefaultAsync(ct);

        return gebruiker is null
            ? NotFound(Problem("Niet gevonden", $"Geen gebruiker met ID {id}.", 404))
            : Ok(gebruiker);
    }

    // POST: api/Gebruiker
    [HttpPost]
    public async Task<ActionResult<GDetail>> Create([FromBody] GebruikerCreateDto dto, CancellationToken ct = default)
    {
        var e = new Gebruiker
        {
            Naam = dto.Naam,
            Email = dto.Email,
            Wachtwoord = dto.Wachtwoord,   // verplicht veld in model
            Soort = dto.Soort,
            Kvk = dto.Kvk,                 // laat null als null
            StraatAdres = dto.StraatAdres, // laat null als null
            Postcode = dto.Postcode,       // laat null als null
            Assortiment = dto.Assortiment, // laat null als null
            PersoneelsNr = dto.PersoneelsNr// laat null als null
        };

        db.Gebruikers.Add(e);
        await db.SaveChangesAsync(ct);

        // Return detail zodat clients meteen alle velden hebben
        var r = await db.Gebruikers.AsNoTracking()
            .Where(x => x.GebruikerNr == e.GebruikerNr)
            .Select(g => new GDetail(
                g.GebruikerNr, g.Naam, g.Email, g.Soort,
                g.LaatstIngelogd, g.Kvk, g.StraatAdres, g.Postcode,
                g.Assortiment, g.PersoneelsNr,
                Enumerable.Empty<GBid>() // nieuw → geen biedingen
            ))
            .FirstAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = e.GebruikerNr }, r);
    }

    // PUT: api/Gebruiker/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<GDetail>> Update(int id, [FromBody] GebruikerUpdateDto dto, CancellationToken ct = default)
    {
        var e = await db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (e is null) return NotFound(Problem("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        e.Naam = dto.Naam;
        e.Email = dto.Email;
        e.Soort = dto.Soort;
        e.Kvk = dto.Kvk;
        e.StraatAdres = dto.StraatAdres;
        e.Postcode = dto.Postcode;
        e.Assortiment = dto.Assortiment;
        e.PersoneelsNr = dto.PersoneelsNr;

        await db.SaveChangesAsync(ct);

        var r = await db.Gebruikers.AsNoTracking()
            .Where(x => x.GebruikerNr == id)
            .Select(g => new GDetail(
                g.GebruikerNr, g.Naam, g.Email, g.Soort,
                g.LaatstIngelogd, g.Kvk, g.StraatAdres, g.Postcode,
                g.Assortiment, g.PersoneelsNr,
                g.Biedingen.OrderByDescending(b => b.BiedNr)
                    .Select(b => new GBid(b.BiedNr, b.BedragPerFust, b.AantalStuks, b.VeilingNr))
            ))
            .FirstAsync(ct);

        return Ok(r);
    }

    // DELETE: api/Gebruiker/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var e = await db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (e is null) return NotFound(Problem("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        db.Gebruikers.Remove(e);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private ProblemDetails Problem(string title, string? detail = null, int statusCode = 400) =>
        new() { Title = title, Detail = detail, Status = statusCode, Instance = HttpContext?.Request?.Path };
}
