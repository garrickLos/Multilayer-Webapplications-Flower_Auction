using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize (Roles ="VeilingMeester, Bedrijf")]
public class CategorieController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategorieController(AppDbContext db) => _db = db;
    
    // GET: api/Categorie?q=roos&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CList>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Categorieen.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(c => c.Naam.Contains(term));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(c => c.Naam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CList(c.CategorieNr, c.Naam))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

        return Ok(items);
    }

    // GET: api/Categorie/123
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CDetail>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await _db.Categorieen.AsNoTracking()
            .Where(c => c.CategorieNr == id)
            .Select(c => new CDetail(c.CategorieNr, c.Naam))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen categorie met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Categorie
    [HttpPost]
    public async Task<ActionResult<CDetail>> Create(
        [FromBody] CategorieCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var e = new Categorie { Naam = dto.Naam.Trim() };

        _db.Categorieen.Add(e);
        await _db.SaveChangesAsync(ct);

        var r = new CDetail(e.CategorieNr, e.Naam);
        return CreatedAtAction(nameof(GetById), new { id = e.CategorieNr }, r);
    }

    // PUT: api/Categorie/123
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CDetail>> Update(
        int id,
        [FromBody] CategorieUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var e = await _db.Categorieen.FindAsync(new object[] { id }, ct);
        if (e is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen categorie met ID {id}.", 404));

        e.Naam = dto.Naam.Trim();
        await _db.SaveChangesAsync(ct);

        return Ok(new CDetail(e.CategorieNr, e.Naam));
    }

    // DELETE: api/Categorie/123
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var e = await _db.Categorieen.FindAsync(new object[] { id }, ct);
        if (e is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen categorie met ID {id}.", 404));

        _db.Categorieen.Remove(e);
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
