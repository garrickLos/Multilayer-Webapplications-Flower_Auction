using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class VeilingController : ControllerBase
{
    private readonly AppDbContext _db;

    public VeilingController(AppDbContext db)
    {
        _db = db;
    }

    // Response DTO's
    public sealed record VProd(int VeilingProductNr, string Naam, decimal Startprijs, int Voorraad);

    public sealed record VList(
        int VeilingNr,
        DateTime? Begintijd,
        DateTime? Eindtijd,
        string Status,
        VProd? Product
    );

    public sealed record VDetail(
        int VeilingNr,
        DateTime? Begintijd,
        DateTime? Eindtijd,
        string Status,
        VProd? Product
    );

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

        var query = _db.Veilingen.AsNoTracking().AsQueryable();

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
                v.Status,
                v.Veilingproduct == null
                    ? null
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
        var dto = await _db.Veilingen
            .AsNoTracking()
            .Where(x => x.VeilingNr == id)
            .Select(x => new VDetail(
                x.VeilingNr,
                x.Begintijd,
                x.Eindtijd,
                x.Status,
                x.Veilingproduct == null
                    ? null
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
        var status = NormalizeStatus(dto.Status, fallback: "inactive");

        // Alleen als de nieuw aangemaakte veiling 'active' wordt,
        // zetten we andere actieve veilingen voor hetzelfde product op 'inactive'.
        if (status == "active")
        {
            var otherActive = await _db.Veilingen
                .Where(v => v.VeilingProductNr == dto.VeilingProductNr && v.Status == "active")
                .ToListAsync(ct);

            foreach (var v in otherActive)
            {
                v.Status = "inactive";
            }
        }

        var e = new Veiling
        {
            Begintijd        = dto.Begintijd,
            Eindtijd         = dto.Eindtijd,
            VeilingProductNr = dto.VeilingProductNr,
            Status           = status
        };

        _db.Veilingen.Add(e);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Mogelijke FK-violation (VeilingProductNr onbekend)
            return BadRequest(Problem("Ongeldige referentie", "VeilingProductNr bestaat niet.", 400));
        }

        var r = await _db.Veilingen.AsNoTracking()
            .Where(x => x.VeilingNr == e.VeilingNr)
            .Select(x => new VDetail(
                x.VeilingNr,
                x.Begintijd,
                x.Eindtijd,
                x.Status,
                x.Veilingproduct == null
                    ? null
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
        var e = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        if (e is null) return NotFound(Problem("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        e.Begintijd        = dto.Begintijd;
        e.Eindtijd         = dto.Eindtijd;
        e.VeilingProductNr = dto.VeilingProductNr;

        var hasStatus = !string.IsNullOrWhiteSpace(dto.Status);
        string? newStatus = hasStatus ? NormalizeStatus(dto.Status) : null;

        if (newStatus is not null)
        {
            // Als we deze veiling 'active' zetten, alle andere actieve voor dit product 'inactive'
            if (newStatus == "active")
            {
                var otherActive = await _db.Veilingen
                    .Where(v =>
                        v.VeilingProductNr == e.VeilingProductNr &&
                        v.VeilingNr != e.VeilingNr &&
                        v.Status == "active")
                    .ToListAsync(ct);

                foreach (var v in otherActive)
                {
                    v.Status = "inactive";
                }
            }

            // En uiteindelijk status van deze veiling updaten
            e.Status = newStatus;
        }

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            return BadRequest(Problem("Ongeldige referentie", "VeilingProductNr bestaat niet.", 400));
        }

        var r = await _db.Veilingen.AsNoTracking()
            .Where(x => x.VeilingNr == id)
            .Select(x => new VDetail(
                x.VeilingNr,
                x.Begintijd,
                x.Eindtijd,
                x.Status,
                x.Veilingproduct == null
                    ? null
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
        var e = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        if (e is null) return NotFound(Problem("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        _db.Veilingen.Remove(e);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ---------------------------
    // Helpers
    // ---------------------------
    private static string NormalizeStatus(string? status, string fallback = "inactive")
    {
        if (string.IsNullOrWhiteSpace(status))
            return fallback;

        var s = status.Trim().ToLowerInvariant();
        return s switch
        {
            "active"   => "active",
            "inactive" => "inactive",
            "sold"     => "sold",
            _          => fallback
        };
    }

    private ProblemDetails Problem(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title = title,
            Detail = detail,
            Status = statusCode,
            Instance = HttpContext?.Request?.Path
        };
}
