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

    private static class VeilingStatus
    {
        public const string Active   = "active";
        public const string Inactive = "inactive";
        public const string Sold     = "sold";
    }

    private const decimal MinToegestanePrijs = 0.01m;

    public sealed record VProd(int VeilingProductNr, string Naam, decimal Startprijs, int Voorraad);
    public sealed record VeilingDto(
        int VeilingNr,
        DateTime Begintijd,
        DateTime Eindtijd,
        string Status,
        decimal Minimumprijs,
        IEnumerable<VProd> Producten
    );

    // GET: api/Veiling
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

        var now   = DateTime.UtcNow;
        var query = _db.Veilingen.AsNoTracking().AsQueryable();

        if (veilingProduct is not null)
        {
            int vpNr = veilingProduct.Value;
            query = query.Where(v => v.Veilingproducten.Any(p => p.VeilingProductNr == vpNr));
        }

        if (from is not null)
            query = query.Where(v => v.Begintijd >= from.Value);

        if (to is not null)
            query = query.Where(v => v.Eindtijd <= to.Value);

        if (onlyActive)
            query = query.Where(v => v.Status == VeilingStatus.Active && v.Eindtijd > now);

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

    // GET: api/Veiling/{id}
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

    // POST: api/Veiling
    [HttpPost]
    public async Task<ActionResult<VeilingDto>> Create(
        [FromBody] VeilingCreateDto dto,
        CancellationToken ct = default)
    {
        if (dto.Minimumprijs < MinToegestanePrijs)
            return BadRequest(CreateProblemDetails(
                "Ongeldige minimumprijs",
                $"Minimumprijs moet minimaal {MinToegestanePrijs} zijn.",
                400));

        var now    = DateTime.UtcNow;
        var entity = new Veiling
        {
            Begintijd    = dto.Begintijd,
            Eindtijd     = dto.Eindtijd,
            Minimumprijs = dto.Minimumprijs,
            Status       = NormalizeStatus(dto.Status, fallback: VeilingStatus.Inactive)
        };

        if (entity.Eindtijd <= now && entity.Status == VeilingStatus.Active)
            entity.Status = VeilingStatus.Inactive;

        _db.Veilingen.Add(entity);
        await _db.SaveChangesAsync(ct);

        var result = await ProjectToDto(
                _db.Veilingen.AsNoTracking().Where(x => x.VeilingNr == entity.VeilingNr))
            .FirstAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = entity.VeilingNr }, result);
    }

    // PUT: api/Veiling/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<VeilingDto>> Update(
        int id,
        [FromBody] VeilingUpdateDto dto,
        CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        if (dto.Minimumprijs < MinToegestanePrijs)
            return BadRequest(CreateProblemDetails(
                "Ongeldige minimumprijs",
                $"Minimumprijs moet minimaal {MinToegestanePrijs} zijn.",
                400));

        entity.Begintijd    = dto.Begintijd;
        entity.Eindtijd     = dto.Eindtijd;
        entity.Minimumprijs = dto.Minimumprijs;

        if (!string.IsNullOrWhiteSpace(dto.Status))
            entity.Status = NormalizeStatus(dto.Status);

        var now = DateTime.UtcNow;
        if (entity.Eindtijd <= now && entity.Status == VeilingStatus.Active)
            entity.Status = VeilingStatus.Inactive;

        await _db.SaveChangesAsync(ct);

        var result = await ProjectToDto(
                _db.Veilingen.AsNoTracking().Where(x => x.VeilingNr == id))
            .FirstAsync(ct);

        return Ok(result);
    }

    // DELETE: api/Veiling/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        _db.Veilingen.Remove(entity);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // Helpers

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

    private static IQueryable<VeilingDto> ProjectToDto(IQueryable<Veiling> query)
    {
        var now = DateTime.UtcNow;

        return query.Select(v => new VeilingDto(
            v.VeilingNr,
            v.Begintijd,
            v.Eindtijd,
            v.Veilingproducten.Any() &&
            v.Veilingproducten.All(p => p.VoorraadBloemen <= 0)
                ? VeilingStatus.Sold
                : (v.Eindtijd <= now && v.Status == VeilingStatus.Active
                    ? VeilingStatus.Inactive
                    : v.Status),
            v.Minimumprijs,
            v.Veilingproducten.Select(p => new VProd(
                p.VeilingProductNr,
                p.Naam,
                p.Startprijs,
                p.VoorraadBloemen
            ))
        ));
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