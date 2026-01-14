using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize (Roles ="VeilingMeester, Bedrijf, Koper")]
public class CategorieController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategorieController(AppDbContext db) => _db = db;
    
    // GET: api/Categorie?q=roos&page=1&pageSize=50
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<CList>>> GetAll(
        CancellationToken ct = default)
    {
        var query = _db.Categorieen.AsNoTracking().AsQueryable();
        var items = await query
            .OrderBy(c => c.Naam)
            .Select(c => new CList(c.CategorieNr, c.Naam))
            .ToListAsync(ct);
        return Ok(items);
    }

    // GET: api/Categorie/123
    [HttpGet("{id:int}")]
    [Authorize]
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
    [Authorize (Roles ="VeilingMeester")]
    public async Task<ActionResult<CDetail>> Create(
        [FromBody] CategorieCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(new ValidationProblemDetails
            {
                Detail = "Je hebt een lege of te lange categorie toegevoegd."
            });

        var e = new Categorie { Naam = dto.Naam.Trim() };

        _db.Categorieen.Add(e);
        await _db.SaveChangesAsync(ct);

        var r = new CDetail(e.CategorieNr, e.Naam);
        return CreatedAtAction(nameof(GetById), new { id = e.CategorieNr }, r);
    }

    // PUT: api/Categorie/123
    [HttpPut("{id:int}")]
    [Authorize (Roles ="VeilingMeester")]
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

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title    = title,
            Detail   = detail,
            Status   = statusCode,
            Instance = HttpContext?.Request?.Path
        };
}
