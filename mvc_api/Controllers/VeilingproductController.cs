using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class VeilingproductController : ControllerBase
{
    private readonly AppDbContext _db;

    public VeilingproductController(AppDbContext db) => _db = db;

    // GET: api/Veilingproduct?q=tulp&categorieNr=1&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VeilingproductListDto>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Veilingproducten.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(vp => vp.Naam.Contains(term));
        }

        if (categorieNr is int cnr)
            query = query.Where(vp => vp.CategorieNr == cnr);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(vp => vp.Naam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VeilingproductListDto
            {
                VeilingProductNr = v.VeilingProductNr,
                Naam             = v.Naam,
                GeplaatstDatum   = v.GeplaatstDatum,
                Fust             = v.AantalFusten,
                Voorraad         = v.VoorraadBloemen,
                Startprijs       = v.Startprijs,
                Categorie        = v.Categorie == null ? null : v.Categorie.Naam,
                VeilingNr        = v.VeilingNr,
                ImagePath        = v.ImagePath
            })
            .ToListAsync(ct);

        SetPaginationHeaders(total, page, pageSize);

        return Ok(items);
    }

    // GET: api/Veilingproduct/101
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VeilingproductDetailDto>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await ProjectToDetail(_db.Veilingproducten.AsNoTracking().Where(v => v.VeilingProductNr == id))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Veilingproduct
    [HttpPost]
    public async Task<ActionResult<VeilingproductDetailDto>> Create(
        [FromBody] VeilingproductCreateRequest dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (!await ReferenceExists(_db.Categorieen, c => c.CategorieNr == dto.CategorieNr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Categorie bestaat niet.", 400));

        if (!await ReferenceExists(_db.Veilingen, v => v.VeilingNr == dto.VeilingNr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Veiling bestaat niet.", 400));

        if (!await ReferenceExists(_db.Gebruikers, g => g.GebruikerNr == dto.Kwekernr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Kweker bestaat niet.", 400));

        var entity = new Veilingproduct
        {
            Naam            = dto.Naam.Trim(),
            GeplaatstDatum  = dto.GeplaatstDatum ?? DateTime.UtcNow,
            AantalFusten    = dto.AantalFusten,
            VoorraadBloemen = dto.VoorraadBloemen,
            Startprijs      = dto.Startprijs,
            CategorieNr     = dto.CategorieNr,
            VeilingNr       = dto.VeilingNr,
            Plaats          = dto.Plaats,
            Minimumprijs    = dto.Minimumprijs,
            Kwekernr        = dto.Kwekernr,
            BeginDatum      = dto.BeginDatum,
            Status          = dto.Status,
            ImagePath       = dto.ImagePath
        };

        _db.Veilingproducten.Add(entity);
        await _db.SaveChangesAsync(ct);

        var result = await ProjectToDetail(_db.Veilingproducten.AsNoTracking().Where(v => v.VeilingProductNr == entity.VeilingProductNr))
            .FirstAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = entity.VeilingProductNr }, result);
    }

    // PUT: api/Veilingproduct/1234
    [HttpPut("{id:int}")]
    public async Task<ActionResult<VeilingproductDetailDto>> Update(
        int id,
        [FromBody] VeilingproductUpdateRequest dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404));

        if (!await ReferenceExists(_db.Categorieen, c => c.CategorieNr == dto.CategorieNr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Categorie bestaat niet.", 400));

        if (!await ReferenceExists(_db.Veilingen, v => v.VeilingNr == dto.VeilingNr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Veiling bestaat niet.", 400));

        if (!await ReferenceExists(_db.Gebruikers, g => g.GebruikerNr == dto.Kwekernr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Kweker bestaat niet.", 400));

        entity.Naam            = dto.Naam.Trim();
        entity.GeplaatstDatum  = dto.GeplaatstDatum ?? entity.GeplaatstDatum;
        entity.AantalFusten    = dto.Fust;
        entity.VoorraadBloemen = dto.Voorraad;
        entity.Startprijs      = dto.Startprijs;
        entity.CategorieNr     = dto.CategorieNr;
        entity.VeilingNr       = dto.VeilingNr;
        entity.Kwekernr        = dto.Kwekernr;
        entity.ImagePath       = dto.ImagePath;

        await _db.SaveChangesAsync(ct);

        var result = await ProjectToDetail(_db.Veilingproducten.AsNoTracking().Where(v => v.VeilingProductNr == id))
            .FirstAsync(ct);

        return Ok(result);
    }

    // DELETE: api/Veilingproduct/1234
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404));

        _db.Veilingproducten.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static IQueryable<VeilingproductDetailDto> ProjectToDetail(IQueryable<Veilingproduct> query) =>
        query.Select(v => new VeilingproductDetailDto
        {
            VeilingProductNr = v.VeilingProductNr,
            Naam             = v.Naam,
            GeplaatstDatum   = v.GeplaatstDatum,
            Fust             = v.AantalFusten,
            Voorraad         = v.VoorraadBloemen,
            Startprijs       = v.Startprijs,
            Categorie        = v.Categorie == null ? null : v.Categorie.Naam,
            VeilingNr        = v.VeilingNr,
            ImagePath        = v.ImagePath,
            Biedingen        = v.Veiling != null
                ? v.Veiling.Biedingen
                    .OrderByDescending(b => b.BiedNr)
                    .Select(b => new VeilingproductBidListItem
                    {
                        BiedNr        = b.BiedNr,
                        BedragPerFust = b.BedragPerFust,
                        AantalStuks   = b.AantalStuks,
                        GebruikerNr   = b.GebruikerNr
                    })
                : Enumerable.Empty<VeilingproductBidListItem>()
        });

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title    = title,
            Detail   = detail,
            Status   = statusCode,
            Instance = HttpContext?.Request?.Path
        };

    private void SetPaginationHeaders(int total, int page, int pageSize)
    {
        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();
    }

    private static Task<bool> ReferenceExists<T>(DbSet<T> set, Expression<Func<T, bool>> predicate, CancellationToken ct)
        where T : class => set.AsNoTracking().AnyAsync(predicate, ct);
}

public sealed class VeilingproductCreateRequest
{
    [Required, StringLength(200)]
    public string Naam { get; init; } = string.Empty;

    public DateTime? GeplaatstDatum { get; init; }

    [Range(1, int.MaxValue)]
    public int AantalFusten { get; init; }

    [Range(0, int.MaxValue)]
    public int VoorraadBloemen { get; init; }

    [Range(typeof(int), "1", "999999999")]
    public int Startprijs { get; init; }

    [Range(1, int.MaxValue)]
    public int CategorieNr { get; init; }

    [Range(1, int.MaxValue)]
    public int VeilingNr { get; init; }

    [Required, StringLength(200)]
    public string Plaats { get; init; } = string.Empty;

    [Range(typeof(int), "1", "999999999")]
    public int Minimumprijs { get; init; }

    [Range(1, int.MaxValue)]
    public int Kwekernr { get; init; }

    public DateOnly BeginDatum { get; init; }

    public bool Status { get; init; }

    [Required, StringLength(200)]
    public string ImagePath { get; init; } = string.Empty;
}

public sealed class VeilingproductUpdateRequest
{
    [Required, StringLength(200)]
    public string Naam { get; init; } = string.Empty;

    public DateTime? GeplaatstDatum { get; init; }

    [Range(1, int.MaxValue)]
    public int Fust { get; init; }

    [Range(0, int.MaxValue)]
    public int Voorraad { get; init; }

    [Range(typeof(int), "1", "999999999")]
    public int Startprijs { get; init; }

    [Range(1, int.MaxValue)]
    public int CategorieNr { get; init; }

    [Range(1, int.MaxValue)]
    public int VeilingNr { get; init; }

    [Range(1, int.MaxValue)]
    public int Kwekernr { get; init; }

    [Required, StringLength(200)]
    public string ImagePath { get; init; } = string.Empty;
}

public sealed class VeilingproductListDto
{
    public int VeilingProductNr { get; init; }
    public string Naam { get; init; } = string.Empty;
    public DateTime GeplaatstDatum { get; init; }
    public int Fust { get; init; }
    public int Voorraad { get; init; }
    public decimal Startprijs { get; init; }
    public string? Categorie { get; init; }
    public int VeilingNr { get; init; }
    public string ImagePath { get; init; } = string.Empty;
}

public sealed class VeilingproductBidListItem
{
    public int BiedNr { get; init; }
    public decimal BedragPerFust { get; init; }
    public int AantalStuks { get; init; }
    public int GebruikerNr { get; init; }
}

public sealed class VeilingproductDetailDto
{
    public int VeilingProductNr { get; init; }
    public string Naam { get; init; } = string.Empty;
    public DateTime GeplaatstDatum { get; init; }
    public int Fust { get; init; }
    public int Voorraad { get; init; }
    public decimal Startprijs { get; init; }
    public string? Categorie { get; init; }
    public int VeilingNr { get; init; }
    public string ImagePath { get; init; } = string.Empty;
    public IEnumerable<VeilingproductBidListItem> Biedingen { get; init; } = Enumerable.Empty<VeilingproductBidListItem>();
}
