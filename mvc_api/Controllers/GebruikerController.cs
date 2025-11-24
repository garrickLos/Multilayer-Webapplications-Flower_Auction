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
            query = query.Where(g =>
                g.BedrijfsNaam.Contains(term) ||
                g.Email.Contains(term));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(g => g.BedrijfsNaam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Projectgebruiker_Klant()
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

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
            .Projectgebruiker_Klant()
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404))
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

        var result = new GebruikerCreateDto
        {
            Email = e.Email,
            Soort = e.Soort,
            Kvk = e.Kvk,
            StraatAdres = e.StraatAdres,
            Postcode = e.Postcode  
        };

        return CreatedAtAction(nameof(GetById), new { id = e.GebruikerNr }, result);
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

        var resultDto = new GebruikerUpdateDto();

        return Ok(resultDto);
    }

    // DELETE: api/Gebruiker/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id, 
        CancellationToken ct = default)
    {
        var e = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (e is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        _db.Gebruikers.Remove(e);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }


    // Helpers

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title    = title,
            Detail   = detail,
            Status   = statusCode,
            Instance = HttpContext?.Request?.Path
        };
}

public static class GebruikerExtensions
{
    // Projectie voor Veilingmeesters
    public static IQueryable<Klant_GebruikerDto> Projectgebruiker_Klant(
        this IQueryable<Gebruiker> query)
    {
        return query.Select(g => new Klant_GebruikerDto
        {   // Eigen properties van Klant_gebruikerDto
            GebruikerNr = g.GebruikerNr,
            BedrijfsNaam = g.BedrijfsNaam,
            Email = g.Email,
            Wachtwoord = g.Wachtwoord,
            Soort = g.Soort,
            Kvk = g.Kvk,
            StraatAdres = g.StraatAdres,
            Postcode = g.Postcode,

            Biedingen = g.Biedingen.Select(b => new VeilingMeester_BiedingDto
            {
                // Eigen properties van VeilingMeester_BiedingDto
                BiedingNr = b.BiedNr,
                VeilingNr = b.VeilingNr, // Of v.VeilingNr, afhankelijk van je database relatie
                VeilingProductNr = b.VeilingproductNr,

                // Properties geërfd van BaseBieding_Dto
                AantalStuks = b.AantalStuks,
                GebruikerNr = b.GebruikerNr,
                BedragPerFust = b.BedragPerFust
            }).ToList(),
        });
    }
}
