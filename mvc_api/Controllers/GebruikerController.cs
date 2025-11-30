using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize (Roles ="VeilingMeester, Koper")]
public class GebruikerController : ControllerBase
{
    private readonly AppDbContext _db;
    public GebruikerController(AppDbContext db) => _db = db;

    // GET: api/Gebruiker?q=jan&page=1&pageSize=50
    [HttpGet]
    [Authorize(Roles ="Klant")]
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
                g.Email!.Contains(term));
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
    // LET OP: deze maakt een gebruiker ZONDER login (geen wachtwoord)
    // Echte registratie gebeurt via /auth/register
    [HttpPost]
    public async Task<ActionResult<Klant_GebruikerDto>> Create(
        [FromBody] GebruikerCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = new Gebruiker
        {
            BedrijfsNaam  = dto.BedrijfsNaam.Trim(),
            Email         = dto.Email.Trim(),
            UserName      = dto.Email.Trim(), // Identity gebruikt dit voor login
            Soort         = dto.Soort,
            Kvk           = dto.Kvk,
            StraatAdres   = dto.StraatAdres,
            Postcode      = dto.Postcode,
            LaatstIngelogd = null
        };

        _db.Gebruikers.Add(user);
        await _db.SaveChangesAsync(ct);

        var result = new Klant_GebruikerDto
        {
            GebruikerNr    = user.GebruikerNr,
            BedrijfsNaam   = user.BedrijfsNaam,
            Email          = user.Email!,
            Soort          = user.Soort,
            Kvk            = user.Kvk,
            StraatAdres    = user.StraatAdres,
            Postcode       = user.Postcode,
            LaatstIngelogd = user.LaatstIngelogd,
            Biedingen      = Enumerable.Empty<VeilingMeester_BiedingDto>()
        };

        return CreatedAtAction(nameof(GetById), new { id = user.GebruikerNr }, result);
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

        var user = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (user is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        user.BedrijfsNaam = dto.BedrijfsNaam.Trim();
        user.Email        = dto.Email.Trim();
        user.UserName     = dto.Email.Trim();
        user.Soort        = dto.Soort;
        user.Kvk          = dto.Kvk;
        user.StraatAdres  = dto.StraatAdres;
        user.Postcode     = dto.Postcode;

        await _db.SaveChangesAsync(ct);

        var result = await _db.Gebruikers.AsNoTracking()
            .Where(g => g.GebruikerNr == id)
            .Projectgebruiker_Klant()
            .FirstAsync(ct);

        return Ok(result);
    }

    // DELETE: api/Gebruiker/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken ct = default)
    {
        var user = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (user is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        _db.Gebruikers.Remove(user);
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

// EXTENSIONS
public static class GebruikerExtensions
{
    public static IQueryable<Klant_GebruikerDto> Projectgebruiker_Klant(
        this IQueryable<Gebruiker> query)
    {
        return query.Select(g => new Klant_GebruikerDto
        {
            GebruikerNr    = g.GebruikerNr,
            BedrijfsNaam   = g.BedrijfsNaam,
            Email          = g.Email!,
            Soort          = g.Soort,
            Kvk            = g.Kvk,
            StraatAdres    = g.StraatAdres,
            Postcode       = g.Postcode,
            LaatstIngelogd = g.LaatstIngelogd,

            Biedingen = g.Biedingen.Select(b => new VeilingMeester_BiedingDto
            {
                BiedingNr        = b.BiedNr,
                VeilingNr        = b.VeilingNr,
                VeilingProductNr = b.VeilingproductNr,
                AantalStuks      = b.AantalStuks,
                GebruikerNr      = b.GebruikerNr,
                BedragPerFust    = b.BedragPerFust
            }).ToList()
        });
    }
}
