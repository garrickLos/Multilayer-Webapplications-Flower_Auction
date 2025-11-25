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

    // GET: api/Gebruiker?q=jan&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Klant_GebruikerDto>>> GetAll(
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
            query = query.Where(g => g.BedrijfsNaam.Contains(term) || g.Email.Contains(term));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(g => g.BedrijfsNaam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectGebruikerKlant()
            .ToListAsync(ct);

        this.SetPaginationHeaders(total, page, pageSize);

        return Ok(items);
    }

    // GET: api/Gebruiker/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Klant_GebruikerDto>> GetById(
        int id,
        CancellationToken ct = default)
    {
        var dto = await _db.Gebruikers.AsNoTracking()
            .Where(x => x.GebruikerNr == id)
            .ProjectGebruikerKlant()
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Gebruiker
    [HttpPost]
    public async Task<ActionResult<GebruikerCreateDto>> Create(
        [FromBody] GebruikerCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = new Gebruiker
        {
            BedrijfsNaam = dto.BedrijfsNaam.Trim(),
            Email        = dto.Email.Trim(),
            Wachtwoord   = dto.Wachtwoord,
            LaatstIngelogd = dto.LaatstIngelogd,
            Soort        = dto.Soort,
            Kvk          = dto.Kvk,
            StraatAdres  = dto.StraatAdres,
            Postcode     = dto.Postcode,
        };

        _db.Gebruikers.Add(entity);
        await _db.SaveChangesAsync(ct);

        var result = await _db.Gebruikers.AsNoTracking()
            .Where(x => x.GebruikerNr == entity.GebruikerNr)
            .ProjectGebruikerKlant()
            .FirstAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = entity.GebruikerNr }, result);
    }

    // PUT: api/Gebruiker/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Klant_GebruikerDto>> Update(
        int id,
        [FromBody] GebruikerUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        entity.BedrijfsNaam = dto.BedrijfsNaam.Trim();
        entity.Email        = dto.Email.Trim();
        entity.Wachtwoord   = dto.Wachtwoord;
        entity.Soort        = dto.Soort;
        entity.Kvk          = dto.Kvk;
        entity.StraatAdres  = dto.StraatAdres;
        entity.Postcode     = dto.Postcode;
        entity.LaatstIngelogd = dto.LaatstIngelogd;

        await _db.SaveChangesAsync(ct);

        var resultDto = await _db.Gebruikers.AsNoTracking()
            .Where(x => x.GebruikerNr == id)
            .ProjectGebruikerKlant()
            .FirstAsync(ct);

        return Ok(resultDto);
    }

    // DELETE: api/Gebruiker/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken ct = default)
    {
        var entity = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        _db.Gebruikers.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public static class GebruikerExtensions
{
    public static IQueryable<Klant_GebruikerDto> ProjectGebruikerKlant(this IQueryable<Gebruiker> query) =>
        query.Select(g => new Klant_GebruikerDto
        {
            GebruikerNr  = g.GebruikerNr,
            BedrijfsNaam = g.BedrijfsNaam,
            Email        = g.Email,
            Wachtwoord   = g.Wachtwoord,
            LaatstIngelogd = g.LaatstIngelogd,
            Soort        = g.Soort,
            Kvk          = g.Kvk,
            StraatAdres  = g.StraatAdres,
            Postcode     = g.Postcode,
            Biedingen    = g.Biedingen.Select(b => new VeilingMeester_BiedingDto
            {
                BiedingNr        = b.BiedNr,
                VeilingNr        = b.VeilingNr,
                VeilingProductNr = b.VeilingproductNr,
                AantalStuks      = b.AantalStuks,
                GebruikerNr      = b.GebruikerNr,
                BedragPerFust    = b.BedragPerFust
            }).ToList(),
        });
}
