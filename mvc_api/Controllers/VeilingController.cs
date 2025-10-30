using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController, Route("api/[controller]"), Produces("application/json")]
public class VeilingController(AppDbContext db) : ControllerBase
{
    // Response DTO's
    public sealed record VProd(int VeilingProductNr, string Naam, decimal Startprijs, int Voorraad);
    public sealed record VList(int VeilingNr, DateTime? Begintijd, DateTime? Eindtijd, VProd? Product);
    public sealed record VDetail(int VeilingNr, DateTime? Begintijd, DateTime? Eindtijd, VProd? Product);

    // GET: api/Veiling?veilingProduct=101&from=2025-10-29T09:00:00&to=2025-10-29T11:00:00&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VList>>> GetAll(
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = db.Veilingen.AsNoTracking().AsQueryable();

        if (veilingProduct is not null)
            query = query.Where(v => v.VeilingProductNr == veilingProduct);

        if (from is not null)
            query = query.Where(v => !v.Begintijd.HasValue || v.Begintijd!.Value >= from.Value);

        if (to is not null)
            query = query.Where(v => !v.Eindtijd.HasValue || v.Eindtijd!.Value <= to.Value);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(v => v.Begintijd)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new VList(
                v.VeilingNr,
                v.Begintijd,
                v.Eindtijd,
                v.Veilingproduct == null ? null
                    : new VProd(
                        v.Veilingproduct.VeilingProductNr,
                        v.Veilingproduct.Naam,
                        v.Veilingproduct.Startprijs,
                        v.Veilingproduct.Voorraad
                    )
            ))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"] = page.ToString();
        Response.Headers["X-Page-Size"] = pageSize.ToString();

        return Ok(items);
    }

    // GET: api/Veiling/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VDetail>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await db.Veilingen
            .AsNoTracking()
            .Where(x => x.VeilingNr == id)
            .Select(x => new VDetail(
                x.VeilingNr,
                x.Begintijd,
                x.Eindtijd,
                x.Veilingproduct == null ? null
                    : new VProd(
                        x.Veilingproduct.VeilingProductNr,
                        x.Veilingproduct.Naam,
                        x.Veilingproduct.Startprijs,
                        x.Veilingproduct.Voorraad
                    )
            ))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(Problem("Niet gevonden", $"Geen veiling met ID {id}.", 404))
            : Ok(dto);
    }

    // POST: api/Veiling
    [HttpPost]
    public async Task<ActionResult<VDetail>> Create([FromBody] VeilingCreateDto dto, CancellationToken ct = default)
    {
        var e = new Veiling
        {
            Begintijd = dto.Begintijd,
            Eindtijd  = dto.Eindtijd,
            VeilingProductNr = dto.VeilingProductNr
        };

        db.Veilingen.Add(e);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Mogelijke FK-violation (VeilingProductNr onbekend)
            return BadRequest(Problem("Ongeldige referentie", "VeilingProductNr bestaat niet.", 400));
        }

        var r = await db.Veilingen.AsNoTracking()
            .Where(x => x.VeilingNr == e.VeilingNr)
            .Select(x => new VDetail(
                x.VeilingNr,
                x.Begintijd,
                x.Eindtijd,
                x.Veilingproduct == null ? null
                    : new VProd(
                        x.Veilingproduct.VeilingProductNr,
                        x.Veilingproduct.Naam,
                        x.Veilingproduct.Startprijs,
                        x.Veilingproduct.Voorraad
                    )
            ))
            .FirstAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = e.VeilingNr }, r);
    }

    // PUT: api/Veiling/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<VDetail>> Update(int id, [FromBody] VeilingUpdateDto dto, CancellationToken ct = default)
    {
        var e = await db.Veilingen.FindAsync(new object[] { id }, ct);
        if (e is null) return NotFound(Problem("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        e.Begintijd = dto.Begintijd;
        e.Eindtijd  = dto.Eindtijd;
        e.VeilingProductNr = dto.VeilingProductNr;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return BadRequest(Problem("Ongeldige referentie", "VeilingProductNr bestaat niet.", 400));
        }

        var r = await db.Veilingen.AsNoTracking()
            .Where(x => x.VeilingNr == id)
            .Select(x => new VDetail(
                x.VeilingNr,
                x.Begintijd,
                x.Eindtijd,
                x.Veilingproduct == null ? null
                    : new VProd(
                        x.Veilingproduct.VeilingProductNr,
                        x.Veilingproduct.Naam,
                        x.Veilingproduct.Startprijs,
                        x.Veilingproduct.Voorraad
                    )
            ))
            .FirstAsync(ct);

        return Ok(r);
    }

    // DELETE: api/Veiling/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var e = await db.Veilingen.FindAsync(new object[] { id }, ct);
        if (e is null) return NotFound(Problem("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        db.Veilingen.Remove(e);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private ProblemDetails Problem(string title, string? detail = null, int statusCode = 400) =>
        new() { Title = title, Detail = detail, Status = statusCode, Instance = HttpContext?.Request?.Path };
}
