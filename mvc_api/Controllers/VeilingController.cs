using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
using ApiGetFilters;
using mvc_api.statusPrinter;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize (Roles = "VeilingMeester, Koper, Bedrijf")]
public class VeilingController : ControllerBase
{
    private readonly AppDbContext _db;

    public VeilingController(AppDbContext db) => _db = db;

    private static readonly ProjectieVeilingController _projectie = new ProjectieVeilingController();

    private static readonly NormalizeStatus _statusNormalize = new NormalizeStatus();

    private async Task UpdateVeilingenEnVoorraadAsync(DateTime now, CancellationToken ct)
    {
        var veilingenTeUpdaten = await _db.Veilingen
            .Where(v =>
                (v.Status != VeilingStatus.Active && v.Begintijd <= now && v.Eindtijd > now)
                || (v.Status == VeilingStatus.Active && (
                       v.Eindtijd <= now ||
                       !_db.Veilingproducten.Any(p => p.VeilingNr == v.VeilingNr && p.VoorraadBloemen > 0)
                   ))
            )
            .ToListAsync(ct);

        if (veilingenTeUpdaten.Count == 0)
            return;

        foreach (var v in veilingenTeUpdaten)
        {
            var producten = await _db.Veilingproducten
                .Where(p => p.VeilingNr == v.VeilingNr)
                .ToListAsync(ct);

            var heeftVoorraad = producten.Any(p => p.VoorraadBloemen > 0);

            if (v.Eindtijd <= now || !heeftVoorraad)
                v.Status = VeilingStatus.Inactive;
            else if (v.Begintijd <= now && v.Eindtijd > now && heeftVoorraad)
                v.Status = VeilingStatus.Active;

            foreach (var p in producten)
            {
                if (p.VoorraadBloemen <= 0)
                    p.Status = ModelStatus.Inactive;
            }
        }

        await _db.SaveChangesAsync(ct);
    }

    [HttpGet("anonymous")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetAnonymous(
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        now = now.ToLocalTime();

        await UpdateVeilingenEnVoorraadAsync(now, ct);

        if (veilingenTeUpdaten.Any())
        {
            foreach (var v in veilingenTeUpdaten)
            {
                // Check opnieuw per item wat er moet gebeuren
                if (now >= v.Eindtijd)
                {
                    // Tijd is voorbij -> Sluiten
                    v.Status = VeilingStatus.Inactive;
                }
                else if (now >= v.Begintijd.Date && now < v.Eindtijd.Date)
                {
                    v.Status = VeilingStatus.Active;
                }
            }
            // Sla alle wijzigingen in één keer op
            await _db.SaveChangesAsync(ct);
        }
        
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var filter = new VeilingControllerFilter(_db, veilingProduct, from, to, onlyActive, DateTime.Now);

        var query = filter.ResultaatQuery;

        var total = await query.CountAsync(ct);

        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        query = query
                .OrderBy(v => v.Begintijd)
                .ThenBy(v => v.VeilingNr)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

        var items = await _projectie
            .ProjectToVeiling_anonymousDto(query,now) //roept de data op van een niet ingelogde persoon.
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("VeilingMeester")]
    [Authorize (Roles="VeilingMeester")]
    public async Task<ActionResult<IEnumerable<object>>> GetVeilingMeester(
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        now = now.ToLocalTime();

        await UpdateVeilingenEnVoorraadAsync(now, ct);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var filter = new VeilingControllerFilter(_db, veilingProduct, from, to, onlyActive, DateTime.Now);

        var query = filter.ResultaatQuery;

        var total = await query.CountAsync(ct);

        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        query = query
                .OrderBy(v => v.Begintijd)
                .ThenBy(v => v.VeilingNr)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

        if (User.Identity.IsAuthenticated && User.IsInRole("VeilingMeester"))
        {
            var items = await _projectie
                .ProjectToVeiling_VeilingMeesterDto(query, now)
                .ToListAsync(ct);

            return Ok(items);
        }
        else
        {
            return Unauthorized();
        }
    }

    [HttpGet("klant")]
    public async Task<ActionResult<IEnumerable<object>>> GetKlant(
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        now = now.ToLocalTime();

        await UpdateVeilingenEnVoorraadAsync(now, ct);

        if (veilingenTeUpdaten.Any())
        {
            foreach (var v in veilingenTeUpdaten)
            {
                // Check opnieuw per item wat er moet gebeuren
                if (now >= v.Eindtijd)
                {
                    // Tijd is voorbij -> Sluiten
                    v.Status = VeilingStatus.Inactive;
                }
                else if (now >= v.Begintijd && now < v.Eindtijd)
                {
                    v.Status = VeilingStatus.Active;
                }
            }
            // Sla alle wijzigingen in één keer op
            await _db.SaveChangesAsync(ct);
        }
        
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var filter = new VeilingControllerFilter(_db, veilingProduct, from, to, onlyActive, DateTime.Now);

        var query = filter.ResultaatQuery;

        var total = await query.CountAsync(ct);

        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        query = query
                .OrderBy(v => v.Begintijd)
                .ThenBy(v => v.VeilingNr)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            // --- Projectie & Execution ---
        if (User.Identity.IsAuthenticated)
        {
            var items = await _projectie
                .ProjectToVeiling_klantDto(query, now)
                .ToListAsync(ct);

            return Ok(items);
        }
        else
        {
            return Unauthorized();
        }
    }

    [HttpGet("{id:int}")]
    [Authorize (Roles ="VeilingMeester, Koper, Bedrijf")]
    public async Task<ActionResult<VeilingMeester_VeilingDto>> GetById(
        int id,
        CancellationToken ct = default)
    {

        var now = DateTime.UtcNow;

        now = now.ToLocalTime();

        var query = _db.Veilingen.AsNoTracking()
            .AsQueryable();

        var item = await _projectie
            .ProjectToVeiling_klantDto(query, now)
            .Where(x => x.VeilingNr == id)
            .FirstOrDefaultAsync(ct);

        if (item is null)
        {
            return NotFound(Problem("Geen veiling gevonden met dit ID.", statusCode: 404, title: "Niet Gevonden"));
        }

        if (User.Identity.IsAuthenticated)
        {
            return Ok(item);
        }
        else
        {
            return Unauthorized();
        }
    }

    [HttpPost]
    public async Task<ActionResult<VeilingCreateDto>> Create(
        [FromBody] VeilingCreateDto dto,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        now = now.ToLocalTime();

        var entity = new Veiling
        {
            VeilingNaam = dto.VeilingNaam,
            Begintijd = dto.Begintijd,
            Eindtijd = dto.Eindtijd,
            Status = _statusNormalize.StatusPrinter(dto.Status)
        };

        if (entity.Eindtijd <= now)
        {
            entity.Status = VeilingStatus.Inactive;
        }

        _db.Veilingen.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch
        {
            return StatusCode(500, CreateProblemDetails(
                "Opslagfout",
                "Er is een fout opgetreden bij het opslaan van de Veiling.",
                500));
        }

        var resultDto = new Klant_VeilingDto
        {
            VeilingNr = entity.VeilingNr,
            VeilingNaam = entity.VeilingNaam,
            Begintijd = entity.Begintijd,
            Eindtijd = entity.Eindtijd,
            Status = entity.Status,
        };

        return CreatedAtAction(nameof(GetById), new { id = entity.VeilingNr }, resultDto);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<VeilingUpdateDto>> Update(
        int id,
        [FromBody] VeilingUpdateDto dto,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        now = now.ToLocalTime();

        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);

        if (entity is null)
            return NotFound(Problem($"Geen veiling met ID {id}.", statusCode: 404, title: "Niet gevonden"));

        entity.VeilingNaam = dto.VeilingNaam;
        entity.Begintijd = dto.Begintijd;
        entity.Eindtijd = dto.Eindtijd;

        // if (!string.IsNullOrWhiteSpace(dto.Status))
        //     entity.Status = NormalizeStatus(dto.Status);

        // Business Logic check
        if (entity.Eindtijd <= now && entity.Status == VeilingStatus.Active)
            entity.Status = VeilingStatus.Inactive;

        await _db.SaveChangesAsync(ct);

        var resultDto = new VeilingUpdateDto
        {
            VeilingNaam = entity.VeilingNaam,
            Begintijd = entity.Begintijd,
            Eindtijd = entity.Eindtijd,
        };

        return Ok(resultDto);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "VeilingMeester, Koper")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);

        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        _db.Veilingen.Remove(entity);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title = title,
            Detail = detail,
            Status = statusCode,
            Instance = HttpContext?.Request?.Path
        };
}