using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Produces("application/json")]
public class VeilingproductController : ControllerBase
{
    private readonly AppDbContext _db;
    public VeilingproductController(AppDbContext db) => _db = db;

    // GET: api/Veilingproduct
    // Optioneel: ?q=tulp&categorieNr=1&page=1&pageSize=50 (pageSize max 200)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Veilingproducten.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(vp => vp.Naam.Contains(term));
        }

        if (categorieNr.HasValue)
        {
            query = query.Where(vp => vp.CategorieNr == categorieNr.Value);
        }

        var total = await query.CountAsync(ct);

        var data = await query
            .OrderBy(vp => vp.Naam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(vp => new
            {
                vp.VeilingNr,
                vp.Naam,
                vp.GeplaatstDatum,
                vp.Fust,
                vp.Voorraad,
                vp.Startprijs,
                Categorie = vp.Categorie == null ? null : vp.Categorie.Naam
            })
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        return Ok(data);
    }

    // GET: api/Veilingproduct/101
    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetById(int id, CancellationToken ct = default)
    {
        var vp = await _db.Veilingproducten
            .AsNoTracking()
            .Where(v => v.VeilingNr == id)
            .Select(v => new
            {
                v.VeilingNr,
                v.Naam,
                v.GeplaatstDatum,
                v.Fust,
                v.Voorraad,
                v.Startprijs,
                Categorie = v.Categorie == null ? null : v.Categorie.Naam,
                Biedingen = v.Biedingen!
                    .OrderByDescending(b => b.BiedNr)
                    .Select(b => new { b.BiedNr, b.BedragPerFust, b.AantalStuks, b.GebruikerNr })
            })
            .FirstOrDefaultAsync(ct);

        if (vp is null) return NotFound(new { Message = $"Geen veilingproduct gevonden met ID {id}." });
        return Ok(vp);
    }

    // POST: api/Veilingproduct
    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] VeilingproductCreateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Naam))
            return BadRequest("Naam is verplicht.");

        var categorieBestaat = await _db.Categorieen.AnyAsync(c => c.CategorieNr == dto.CategorieNr, ct);
        if (!categorieBestaat) return BadRequest("Categorie bestaat niet.");

        var entity = new Veilingproduct
        {
            // PK wordt door DB gezet (ValueGeneratedOnAdd)
            Naam = dto.Naam.Trim(),
            GeplaatstDatum = dto.GeplaatstDatum,
            Fust = dto.Fust,
            Voorraad = dto.Voorraad,
            Startprijs = dto.Startprijs,
            CategorieNr = dto.CategorieNr
        };

        _db.Veilingproducten.Add(entity);
        await _db.SaveChangesAsync(ct);

        var result = new
        {
            entity.VeilingNr,
            entity.Naam,
            entity.GeplaatstDatum,
            entity.Fust,
            entity.Voorraad,
            entity.Startprijs,
            entity.CategorieNr
        };

        return CreatedAtAction(nameof(GetById), new { id = entity.VeilingNr }, result);
    }

    // PUT: api/Veilingproduct/1234
    [HttpPut("{id:int}")]
    public async Task<ActionResult<object>> Update(int id, [FromBody] VeilingproductUpdateDto dto, CancellationToken ct = default)
    {
        var vp = await _db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (vp is null) return NotFound(new { Message = $"Geen veilingproduct gevonden met ID {id}." });

        var categorieBestaat = await _db.Categorieen.AnyAsync(c => c.CategorieNr == dto.CategorieNr, ct);
        if (!categorieBestaat) return BadRequest("Categorie bestaat niet.");

        vp.Naam = dto.Naam.Trim();
        vp.GeplaatstDatum = dto.GeplaatstDatum;
        vp.Fust = dto.Fust;
        vp.Voorraad = dto.Voorraad;
        vp.Startprijs = dto.Startprijs;
        vp.CategorieNr = dto.CategorieNr;

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            vp.VeilingNr,
            vp.Naam,
            vp.GeplaatstDatum,
            vp.Fust,
            vp.Voorraad,
            vp.Startprijs,
            vp.CategorieNr
        });
    }

    // DELETE: api/Veilingproduct/1234
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var vp = await _db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (vp is null) return NotFound(new { Message = $"Geen veilingproduct gevonden met ID {id}." });

        _db.Veilingproducten.Remove(vp); // Cascade op Biedingen/Veilingen via modelconfig
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}
