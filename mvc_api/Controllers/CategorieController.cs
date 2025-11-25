using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CategorieController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategorieController(AppDbContext db) => _db = db;

    // GET: api/Categorie?q=roos&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategorieListDto>>> GetAll(
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
            .Select(c => new CategorieListDto { CategorieNr = c.CategorieNr, Naam = c.Naam })
            .ToListAsync(ct);

        this.SetPaginationHeaders(total, page, pageSize);

        return Ok(items);
    }

    // GET: api/Categorie/123
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategorieDetailDto>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await _db.Categorieen.AsNoTracking()
            .Where(c => c.CategorieNr == id)
            .Select(c => new CategorieDetailDto { CategorieNr = c.CategorieNr, Naam = c.Naam })
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen categorie met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Categorie
    [HttpPost]
    public async Task<ActionResult<CategorieDetailDto>> Create(
        [FromBody] CategorieCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = new Categorie { Naam = dto.Naam.Trim() };

        _db.Categorieen.Add(entity);
        await _db.SaveChangesAsync(ct);

        var result = new CategorieDetailDto { CategorieNr = entity.CategorieNr, Naam = entity.Naam };
        return CreatedAtAction(nameof(GetById), new { id = entity.CategorieNr }, result);
    }

    // PUT: api/Categorie/123
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategorieDetailDto>> Update(
        int id,
        [FromBody] CategorieUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _db.Categorieen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen categorie met ID {id}.", 404));

        entity.Naam = dto.Naam.Trim();
        await _db.SaveChangesAsync(ct);

        return Ok(new CategorieDetailDto { CategorieNr = entity.CategorieNr, Naam = entity.Naam });
    }

    // DELETE: api/Categorie/123
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Categorieen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen categorie met ID {id}.", 404));

        _db.Categorieen.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
