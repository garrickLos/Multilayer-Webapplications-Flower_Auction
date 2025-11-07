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

    public VeilingController(AppDbContext db) => _db = db;

    // Status-constants om magic strings te vermijden
    private static class VeilingStatus
    {
        public const string Active   = "active";
        public const string Inactive = "inactive";
        public const string Sold     = "sold";
    }

    // DTO's voor responses
    public sealed record VProd(int VeilingProductNr, string Naam, decimal Startprijs, int Voorraad);

    public sealed record VeilingDto(
        int VeilingNr,
        DateTime Begintijd,
        DateTime Eindtijd,
        string Status,
        VProd? Product
    );

    /// <summary>
    /// Haalt veilingen op met optionele filtering en paginatie.
    /// Zorgt eerst dat er max 1 'active' veiling per product is.
    /// </summary>
    /// GET: api/Veiling?veilingProduct=101&from=...&to=...&onlyActive=true&page=1&pageSize=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VeilingDto>>> GetAll(
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        // Eerst: ervoor zorgen dat per product max 1 'active' is
        await EnsureSingleActiveAsync(veilingProduct, ct);
        await _db.SaveChangesAsync(ct);

        var query = _db.Veilingen.AsNoTracking();

        if (veilingProduct is not null)
            query = query.Where(v => v.VeilingProductNr == veilingProduct);

        if (from is not null)
            query = query.Where(v => v.Begintijd >= from.Value);

        if (to is not null)
            query = query.Where(v => v.Eindtijd <= to.Value);

        if (onlyActive)
            query = query.Where(v => v.Status == VeilingStatus.Active);

        var total = await query.CountAsync(ct);

        var items = await ProjectToDto(
                query.OrderBy(v => v.Begintijd)
                     .ThenBy(v => v.VeilingNr)
                     .Skip((page - 1) * pageSize)
                     .Take(pageSize))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

        return Ok(items);
    }

    /// <summary>
    /// Haalt een enkele veiling op.
    /// </summary>
    /// GET: api/Veiling/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VeilingDto>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await ProjectToDto(
                _db.Veilingen.AsNoTracking().Where(x => x.VeilingNr == id))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404))
            : Ok(dto);
    }

    /// <summary>
    /// Maakt een nieuwe veiling aan.
    /// </summary>
    /// POST: api/Veiling
    [HttpPost]
    public async Task<ActionResult<VeilingDto>> Create(
        [FromBody] VeilingCreateDto dto,
        CancellationToken ct = default)
    {
        var entity = new Veiling
        {
            Begintijd        = dto.Begintijd,
            Eindtijd         = dto.Eindtijd,
            VeilingProductNr = dto.VeilingProductNr,
            Status           = NormalizeStatus(dto.Status, fallback: VeilingStatus.Inactive)
        };

        _db.Veilingen.Add(entity);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            // 1e Save: ID genereren
            await _db.SaveChangesAsync(ct);

            // Correctie: max 1 'active' voor dit product
            await EnsureSingleActiveAsync(entity.VeilingProductNr, ct);
            await _db.SaveChangesAsync(ct);

            await tx.CommitAsync(ct);
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync(ct);
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "VeilingProductNr bestaat niet.", 400));
        }

        var result = await ProjectToDto(
                _db.Veilingen.AsNoTracking().Where(x => x.VeilingNr == entity.VeilingNr))
            .FirstAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = entity.VeilingNr }, result);
    }

    /// <summary>
    /// Wijzigt een bestaande veiling.
    /// </summary>
    /// PUT: api/Veiling/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<VeilingDto>> Update(
        int id,
        [FromBody] VeilingUpdateDto dto,
        CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        // Hier gaan we ervan uit dat dto.Begintijd/Eindtijd non-nullable DateTime zijn
        entity.Begintijd        = dto.Begintijd;
        entity.Eindtijd         = dto.Eindtijd;
        entity.VeilingProductNr = dto.VeilingProductNr;

        if (!string.IsNullOrWhiteSpace(dto.Status))
            entity.Status = NormalizeStatus(dto.Status);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            await _db.SaveChangesAsync(ct);

            await EnsureSingleActiveAsync(entity.VeilingProductNr, ct);
            await _db.SaveChangesAsync(ct);

            await tx.CommitAsync(ct);
        }
        catch (DbUpdateException)
        {
            await tx.RollbackAsync(ct);
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "VeilingProductNr bestaat niet.", 400));
        }

        var result = await ProjectToDto(
                _db.Veilingen.AsNoTracking().Where(x => x.VeilingNr == id))
            .FirstAsync(ct);

        return Ok(result);
    }

    /// <summary>
    /// Verwijdert een veiling.
    /// </summary>
    /// DELETE: api/Veiling/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        int productNr = entity.VeilingProductNr;

        _db.Veilingen.Remove(entity);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        await _db.SaveChangesAsync(ct);

        await EnsureSingleActiveAsync(productNr, ct);
        await _db.SaveChangesAsync(ct);

        await tx.CommitAsync(ct);

        return NoContent();
    }

    // ---------------------------
    // Helpers
    // ---------------------------

    private static string NormalizeStatus(string? status, string fallback = VeilingStatus.Inactive)
    {
        if (string.IsNullOrWhiteSpace(status))
            return fallback;

        return status.Trim().ToLowerInvariant() switch
        {
            VeilingStatus.Active   => VeilingStatus.Active,
            VeilingStatus.Inactive => VeilingStatus.Inactive,
            VeilingStatus.Sold     => VeilingStatus.Sold,
            _                      => fallback
        };
    }

    /// <summary>
    /// Zorgt dat er maximaal één 'active' veiling per product is.
    /// Als veilingProductNr null is: voor alle producten.
    /// </summary>
    private async Task EnsureSingleActiveAsync(int? veilingProductNr, CancellationToken ct)
    {
        var query = _db.Veilingen.Where(v => v.Status == VeilingStatus.Active);

        if (veilingProductNr.HasValue)
            query = query.Where(v => v.VeilingProductNr == veilingProductNr.Value);

        var groups = await query
            .GroupBy(v => v.VeilingProductNr)
            .ToListAsync(ct);

        foreach (var group in groups)
        {
            var ordered = group
                .OrderByDescending(v => v.Begintijd)
                .ThenByDescending(v => v.VeilingNr)
                .ToList();

            foreach (var v in ordered.Skip(1))
                v.Status = VeilingStatus.Inactive;
        }
    }

    private static IQueryable<VeilingDto> ProjectToDto(IQueryable<Veiling> query) =>
        System.Linq.Queryable.Select(query, v => new VeilingDto(
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
