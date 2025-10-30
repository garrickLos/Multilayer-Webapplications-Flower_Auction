using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController, Route("api/[controller]"), Produces("application/json")]
public class VeilingproductController(AppDbContext db) : ControllerBase
{
    // Response DTO's (namen en keys afgestemd op model)
    public sealed record VpList(
        int VeilingProductNr, string Naam, DateTime GeplaatstDatum, int Fust, int Voorraad, decimal Startprijs, string? Categorie);
    public sealed record VBList(int BiedNr, decimal BedragPerFust, int AantalStuks, int GebruikerNr);
    public sealed record VpDetail(
        int VeilingProductNr, string Naam, DateTime GeplaatstDatum, int Fust, int Voorraad, decimal Startprijs,
        string? Categorie, IEnumerable<VBList> Biedingen);

    // GET: api/Veilingproduct?q=tulp&categorieNr=1&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VpList>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = db.Veilingproducten.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(vp => vp.Naam.Contains(term));
        }

        if (categorieNr.HasValue)
        {
            var cnr = categorieNr.Value;
            query = query.Where(vp => vp.CategorieNr == cnr);
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(vp => vp.Naam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VpList(
                v.VeilingProductNr,
                v.Naam,
                v.GeplaatstDatum,
                v.Fust,
                v.Voorraad,
                v.Startprijs,
                v.Categorie == null ? null : v.Categorie.Naam
            ))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"] = page.ToString();
        Response.Headers["X-Page-Size"] = pageSize.ToString();

        return Ok(items);
    }

    // GET: api/Veilingproduct/101
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VpDetail>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await db.Veilingproducten
            .AsNoTracking()
            .Where(v => v.VeilingProductNr == id)
            .Select(v => new VpDetail(
                v.VeilingProductNr,
                v.Naam,
                v.GeplaatstDatum,
                v.Fust,
                v.Voorraad,
                v.Startprijs,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.Veilingen
                    .SelectMany(vei => vei.Biedingen)
                    .OrderByDescending(b => b.BiedNr)
                    .Select(b => new VBList(b.BiedNr, b.BedragPerFust, b.AantalStuks, b.GebruikerNr))
            ))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(Problem("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Veilingproduct
    [HttpPost]
    public async Task<ActionResult<VpDetail>> Create([FromBody] VeilingproductCreateDto dto, CancellationToken ct = default)
    {
        var categorieBestaat = await db.Categorieen.AnyAsync(c => c.CategorieNr == dto.CategorieNr, ct);
        if (!categorieBestaat)
            return BadRequest(Problem("Ongeldige referentie", "Categorie bestaat niet.", 400));

        // Model heeft default voor GeplaatstDatum; alleen overschrijven als DTO deze meegeeft
        var e = new Veilingproduct
        {
            Naam = dto.Naam.Trim(),
            Fust = dto.Fust,
            Voorraad = dto.Voorraad,
            Startprijs = dto.Startprijs,
            CategorieNr = dto.CategorieNr
        };
        if (dto.GeplaatstDatum.HasValue)
            e.GeplaatstDatum = dto.GeplaatstDatum.Value;

        db.Veilingproducten.Add(e);
        await db.SaveChangesAsync(ct);

        var r = await db.Veilingproducten.AsNoTracking()
            .Where(v => v.VeilingProductNr == e.VeilingProductNr)
            .Select(v => new VpDetail(
                v.VeilingProductNr,
                v.Naam,
                v.GeplaatstDatum,
                v.Fust,
                v.Voorraad,
                v.Startprijs,
                v.Categorie == null ? null : v.Categorie.Naam,
                Enumerable.Empty<VBList>() // nieuw → nog geen biedingen
            ))
            .FirstAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = e.VeilingProductNr }, r);
    }

    // PUT: api/Veilingproduct/1234
    [HttpPut("{id:int}")]
    public async Task<ActionResult<VpDetail>> Update(int id, [FromBody] VeilingproductUpdateDto dto, CancellationToken ct = default)
    {
        var e = await db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (e is null)
            return NotFound(Problem("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404));

        var categorieBestaat = await db.Categorieen.AnyAsync(c => c.CategorieNr == dto.CategorieNr, ct);
        if (!categorieBestaat)
            return BadRequest(Problem("Ongeldige referentie", "Categorie bestaat niet.", 400));

        e.Naam = dto.Naam.Trim();
        if (dto.GeplaatstDatum.HasValue)
            e.GeplaatstDatum = dto.GeplaatstDatum.Value; // anders bestaande waarde behouden
        e.Fust = dto.Fust;
        e.Voorraad = dto.Voorraad;
        e.Startprijs = dto.Startprijs;
        e.CategorieNr = dto.CategorieNr;

        await db.SaveChangesAsync(ct);

        var r = await db.Veilingproducten.AsNoTracking()
            .Where(v => v.VeilingProductNr == id)
            .Select(v => new VpDetail(
                v.VeilingProductNr,
                v.Naam,
                v.GeplaatstDatum,
                v.Fust,
                v.Voorraad,
                v.Startprijs,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.Veilingen
                    .SelectMany(vei => vei.Biedingen)
                    .OrderByDescending(b => b.BiedNr)
                    .Select(b => new VBList(b.BiedNr, b.BedragPerFust, b.AantalStuks, b.GebruikerNr))
            ))
            .FirstAsync(ct);

        return Ok(r);
    }

    // DELETE: api/Veilingproduct/1234
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var e = await db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (e is null)
            return NotFound(Problem("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404));

        db.Veilingproducten.Remove(e); // Cascade-config bepaalt gedrag voor gerelateerde entiteiten
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private ProblemDetails Problem(string title, string? detail = null, int statusCode = 400) =>
        new() { Title = title, Detail = detail, Status = statusCode, Instance = HttpContext?.Request?.Path };
}
