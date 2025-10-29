using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController, Route("api/[controller]"), Produces("application/json")]
public class BiedingController(AppDbContext db) : ControllerBase
{
    // Korte DTO's
    public sealed record BList(int BiedNr, decimal BedragPerFust, int AantalStuks, int GebruikerNr, int VeilingNr);
    public sealed record BDetail(int BiedNr, decimal BedragPerFust, int AantalStuks, int GebruikerNr, int VeilingNr);

    // GET: api/Bieding?gebruikerNr=&veilingNr=&page=&pageSize=
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BList>>> GetAll(
        [FromQuery] int? gebruikerNr, [FromQuery] int? veilingNr,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var q = db.Biedingen.AsNoTracking().AsQueryable();
        if (gebruikerNr is not null) q = q.Where(b => b.GebruikerNr == gebruikerNr);
        if (veilingNr   is not null) q = q.Where(b => b.VeilingNr   == veilingNr);

        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(b => b.BiedNr)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(b => new BList(b.BiedNr, b.BedragPerFust, b.AantalStuks, b.GebruikerNr, b.VeilingNr))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"] = page.ToString();
        Response.Headers["X-Page-Size"] = pageSize.ToString();
        return Ok(items);
    }

    // GET: api/Bieding/1001
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BDetail>> GetById(int id, CancellationToken ct = default)
    {
        var b = await db.Biedingen.AsNoTracking()
            .Where(x => x.BiedNr == id)
            .Select(x => new BDetail(x.BiedNr, x.BedragPerFust, x.AantalStuks, x.GebruikerNr, x.VeilingNr))
            .FirstOrDefaultAsync(ct);

        return b is null ? NotFound(Problem("Niet gevonden", $"Geen bieding met ID {id}.", 404)) : Ok(b);
    }

    // POST: api/Bieding
    [HttpPost]
    public async Task<ActionResult<BDetail>> Create([FromBody] BiedingCreateDto dto, CancellationToken ct = default)
    {
        if (!await db.Gebruikers.AnyAsync(g => g.GebruikerNr == dto.GebruikerNr, ct))
            return BadRequest("Gebruiker bestaat niet.");
        if (!await db.Veilingproducten.AnyAsync(v => v.VeilingNr == dto.VeilingNr, ct))
            return BadRequest("Veilingproduct bestaat niet.");

        var e = new Bieding { BedragPerFust = dto.BedragPerFust, AantalStuks = dto.AantalStuks, GebruikerNr = dto.GebruikerNr, VeilingNr = dto.VeilingNr };
        db.Biedingen.Add(e);
        await db.SaveChangesAsync(ct);

        var r = new BDetail(e.BiedNr, e.BedragPerFust, e.AantalStuks, e.GebruikerNr, e.VeilingNr);
        return CreatedAtAction(nameof(GetById), new { id = e.BiedNr }, r);
    }

    // PUT: api/Bieding/1001
    [HttpPut("{id:int}")]
    public async Task<ActionResult<BDetail>> Update(int id, [FromBody] BiedingUpdateDto dto, CancellationToken ct = default)
    {
        var e = await db.Biedingen.FindAsync([id], ct);
        if (e is null) return NotFound(Problem("Niet gevonden", $"Geen bieding met ID {id}.", 404));

        e.BedragPerFust = dto.BedragPerFust;
        e.AantalStuks   = dto.AantalStuks;
        await db.SaveChangesAsync(ct);

        return Ok(new BDetail(e.BiedNr, e.BedragPerFust, e.AantalStuks, e.GebruikerNr, e.VeilingNr));
    }

    // DELETE: api/Bieding/1001
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var e = await db.Biedingen.FindAsync([id], ct);
        if (e is null) return NotFound(Problem("Niet gevonden", $"Geen bieding met ID {id}.", 404));

        db.Biedingen.Remove(e);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    ProblemDetails Problem(string title, string? detail = null, int statusCode = 400) =>
        new() { Title = title, Detail = detail, Status = statusCode, Instance = HttpContext?.Request?.Path };
}
