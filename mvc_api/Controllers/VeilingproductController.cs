using System.ComponentModel.DataAnnotations;
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
    
    //Get voor klant
    [HttpGet("Klant")]
    public async Task<ActionResult<IEnumerable<klantVeilingproductGet_dto>>> KlantGetAll(
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
            .Select(v => new klantVeilingproductGet_dto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.ImagePath,
                v.Plaats
            ))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

        return Ok(items);
    }
    
    //Get voor kweker
    [HttpGet("Kweker")]
    public async Task<ActionResult<IEnumerable<kwekerVeilingproductGet_dto>>> KwekerGetAll(
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
            .Select(v => new kwekerVeilingproductGet_dto(
                v.VeilingProductNr,
                v.Naam,
                v.GeplaatstDatum,
                v.AantalFusten,
                v.VoorraadBloemen,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.ImagePath,
                v.Plaats
            ))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

        return Ok(items);
    }
    
    // GET: api/Veilingproduct?q=tulp&categorieNr=1&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VpList>>> GetAll(
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
            .Select(v => new VpList(
                v.VeilingProductNr,
                v.Naam,
                v.GeplaatstDatum,
                v.AantalFusten,
                v.VoorraadBloemen,
                v.Startprijs,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.VeilingNr,
                v.ImagePath,
                v.Plaats
            ))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

        return Ok(items);
    }
    
    // GET: api/Veilingproduct/101
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VpDetail>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await ProjectToDetail(
                _db.Veilingproducten.AsNoTracking().Where(v => v.VeilingProductNr == id))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Veilingproduct
    [HttpPost]
    public async Task<ActionResult<VpDetail>> Create(
        [FromBody] KwekerPost_Dto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var categorieBestaat = await _db.Categorieen
            .AnyAsync(c => c.CategorieNr == dto.CategorieNr, ct);
        if (!categorieBestaat)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Categorie bestaat niet.", 400));
        
        var kwekerBestaat = await _db.Gebruikers
            .AnyAsync(g => g.GebruikerNr == dto.Kwekernr, ct);
        if (!kwekerBestaat)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Kweker bestaat niet.", 400));

        var e = new Veilingproduct
        {
            Naam            = dto.Naam.Trim(),
            GeplaatstDatum  = dto.GeplaatstDatum ?? DateTime.UtcNow,
            AantalFusten    = dto.AantalFusten,
            VoorraadBloemen = dto.VoorraadBloemen,
            CategorieNr     = dto.CategorieNr,
            Plaats          = dto.Plaats,
            Minimumprijs    = dto.Minimumprijs,
            Kwekernr        = dto.Kwekernr,
            beginDatum      = dto.beginDatum,
            status          = dto.status,
            ImagePath       = dto.ImagePath
        };

        _db.Veilingproducten.Add(e);
        await _db.SaveChangesAsync(ct);

        var r = await ProjectToDetail(
                _db.Veilingproducten.AsNoTracking().Where(v => v.VeilingProductNr == e.VeilingProductNr))
            .FirstAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = e.VeilingProductNr }, r);
    }

    // PUT: api/Veilingproduct/1234
    [HttpPut("{id:int}")]
    public async Task<ActionResult<VpDetail>> Update(
        int id,
        [FromBody] VeilingproductUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var e = await _db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (e is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404));

        var categorieBestaat = await _db.Categorieen
            .AnyAsync(c => c.CategorieNr == dto.CategorieNr, ct);
        if (!categorieBestaat)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Categorie bestaat niet.", 400));

        var veilingBestaat = await _db.Veilingen
            .AnyAsync(v => v.VeilingNr == dto.VeilingNr, ct);
        if (!veilingBestaat)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Veiling bestaat niet.", 400));

        var kwekerBestaat = await _db.Gebruikers
            .AnyAsync(g => g.GebruikerNr == dto.Kwekernr, ct);
        if (!kwekerBestaat)
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Kweker bestaat niet.", 400));

        e.Naam            = dto.Naam.Trim();
        e.GeplaatstDatum  = dto.GeplaatstDatum ?? e.GeplaatstDatum;
        e.AantalFusten    = dto.Fust;
        e.VoorraadBloemen = dto.Voorraad;
        e.Startprijs      = dto.Startprijs;
        e.CategorieNr     = dto.CategorieNr;
        e.VeilingNr       = dto.VeilingNr;
        e.Kwekernr        = dto.Kwekernr;
        e.ImagePath       = dto.ImagePath;

        await _db.SaveChangesAsync(ct);

        var r = await ProjectToDetail(
                _db.Veilingproducten.AsNoTracking().Where(v => v.VeilingProductNr == id))
            .FirstAsync(ct);

        return Ok(r);
    }

    // DELETE: api/Veilingproduct/1234
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var e = await _db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (e is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404));

        _db.Veilingproducten.Remove(e);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Helpers

    private static IQueryable<VpDetail> ProjectToDetail(IQueryable<Veilingproduct> query) =>
        query.Select(v => new VpDetail(
            v.VeilingProductNr,
            v.Naam,
            v.GeplaatstDatum,
            v.AantalFusten,
            v.VoorraadBloemen,
            v.Startprijs,
            v.Categorie == null ? null : v.Categorie.Naam,
            v.VeilingNr,
            v.ImagePath,
            v.Veiling.Biedingen
                .OrderByDescending(b => b.BiedNr)
                .Select(b => new VBList(b.BiedNr, b.BedragPerFust, b.AantalStuks, b.GebruikerNr))
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
