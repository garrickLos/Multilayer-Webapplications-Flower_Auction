using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

public static class VeilingStatus
{
    public const string Active   = "active";
    public const string Inactive = "inactive";
    public const string Sold     = "sold";
}

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class VeilingController : ControllerBase
{
    private readonly AppDbContext _db;

    public VeilingController(AppDbContext db) => _db = db;

    // GET: api/Veiling
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VeilingMeester_VeilingDto>>> GetAll(
        [FromQuery] string? rol,
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

        var query = _db.Veilingen.AsNoTracking().AsQueryable();
        var now   = DateTime.UtcNow;

        if (veilingProduct.HasValue)
            query = query.Where(v => v.Veilingproducten.Any(p => p.VeilingProductNr == veilingProduct.Value));

        if (from.HasValue)
            query = query.Where(v => v.Begintijd >= from.Value);

        if (to.HasValue)
            query = query.Where(v => v.Eindtijd <= to.Value);

        if (onlyActive)
            query = query.Where(v => v.Status == VeilingStatus.Active && v.Eindtijd > now);

        var total = await query.CountAsync(ct);
        this.SetPaginationHeaders(total, page, pageSize);

        query = query
            .OrderBy(v => v.Begintijd)
            .ThenBy(v => v.VeilingNr)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        if (rol == "VeilingMeester")
        {
            var items = await query
                .ProjectToVeilingMeesterDto(now)
                .ToListAsync(ct);

            return Ok(items);
        }

        var guestItems = await query
            .ProjectToReadDto(now)
            .ToListAsync(ct);

        return Ok(guestItems);
    }

    // GET: api/Veiling/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VeilingMeester_VeilingDto>> GetById(
        int id,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var dto = await _db.Veilingen.AsNoTracking()
            .Where(x => x.VeilingNr == id)
            .ProjectToReadDto(now)
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(this.CreateProblemDetails("Niet gevonden", "Geen veiling gevonden met dit ID.", 404))
            : Ok(dto);
    }

    // POST: api/Veiling
    [HttpPost]
    public async Task<ActionResult<VeilingCreateDto>> Create(
        [FromBody] VeilingCreateDto dto,
        CancellationToken ct = default)
    {
        var now    = DateTime.UtcNow;
        var entity = new Veiling
        {
            VeilingNaam = dto.VeilingNaam,
            Begintijd   = dto.Begintijd,
            Eindtijd    = dto.Eindtijd,
            Status      = NormalizeStatus(dto.Status)
        };

        if (entity.Eindtijd <= now)
            entity.Status = VeilingStatus.Inactive;

        _db.Veilingen.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch
        {
            return StatusCode(500, this.CreateProblemDetails(
                "Opslagfout",
                "Er is een fout opgetreden bij het opslaan van de Veiling.",
                500));
        }

        var resultDto = new Klant_VeilingDto
        {
            VeilingNr   = entity.VeilingNr,
            VeilingNaam = entity.VeilingNaam,
            Begintijd   = entity.Begintijd,
            Eindtijd    = entity.Eindtijd,
            Status      = entity.Status,
        };

        return CreatedAtAction(nameof(GetById), new { id = entity.VeilingNr }, resultDto);
    }

    // PUT: api/Veiling/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<VeilingUpdateDto>> Update(
        int id,
        [FromBody] VeilingUpdateDto dto,
        CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);

        if (entity is null)
            return NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        entity.VeilingNaam = dto.VeilingNaam;
        entity.Begintijd   = dto.Begintijd;
        entity.Eindtijd    = dto.Eindtijd;

        var now = DateTime.UtcNow;
        if (entity.Eindtijd <= now && entity.Status == VeilingStatus.Active)
            entity.Status = VeilingStatus.Inactive;

        await _db.SaveChangesAsync(ct);

        var resultDto = new VeilingUpdateDto
        {
            VeilingNaam = entity.VeilingNaam,
            Begintijd   = entity.Begintijd,
            Eindtijd    = entity.Eindtijd,
        };

        return Ok(resultDto);
    }

    // DELETE: api/Veiling/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);

        if (entity is null)
            return NotFound(this.CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        _db.Veilingen.Remove(entity);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private static string NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return VeilingStatus.Inactive;

        return status.Trim().ToLowerInvariant() switch
        {
            VeilingStatus.Active => VeilingStatus.Active,
            VeilingStatus.Sold   => VeilingStatus.Sold,
            _ => VeilingStatus.Inactive
        };
    }
}

public static class VeilingExtensions
{
    public static IQueryable<Klant_VeilingDto> ProjectToReadDto(
        this IQueryable<Veiling> query, DateTime now) =>
        query.Select(v => new Klant_VeilingDto
        {
            VeilingNr   = v.VeilingNr,
            VeilingNaam = v.VeilingNaam,
            Begintijd   = v.Begintijd,
            Eindtijd    = v.Eindtijd,
            Status = v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0)
                ? VeilingStatus.Sold
                : v.Eindtijd <= now
                    ? VeilingStatus.Inactive
                    : v.Begintijd <= now
                        ? VeilingStatus.Active
                        : VeilingStatus.Inactive,
            Producten = v.Veilingproducten.Select(p => new VeilingProductDto
            {
                VeilingProductNr = p.VeilingProductNr,
                Naam             = p.Naam,
                Startprijs       = p.Startprijs,
                Voorraad         = p.VoorraadBloemen,
                ImagePath        = p.ImagePath
            })
        });

    public static IQueryable<VeilingMeester_VeilingDto> ProjectToVeilingMeesterDto(
        this IQueryable<Veiling> query, DateTime now) =>
        query.Select(v => new VeilingMeester_VeilingDto
        {
            VeilingNr   = v.VeilingNr,
            VeilingNaam = v.VeilingNaam,
            Begintijd   = v.Begintijd,
            Eindtijd    = v.Eindtijd,
            Status = v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0)
                ? VeilingStatus.Sold
                : v.Eindtijd <= now
                    ? VeilingStatus.Inactive
                    : v.Begintijd <= now
                        ? VeilingStatus.Active
                        : VeilingStatus.Inactive,
            Producten = v.Veilingproducten.Select(p => new VeilingProductDto
            {
                VeilingProductNr = p.VeilingProductNr,
                Naam             = p.Naam,
                Startprijs       = p.Startprijs,
                Voorraad         = p.VoorraadBloemen,
                ImagePath        = p.ImagePath
            }).ToList(),
            Biedingen = v.Biedingen.Select(b => new VeilingMeester_BiedingDto
            {
                BiedingNr        = b.BiedNr,
                VeilingNr        = b.VeilingNr,
                VeilingProductNr = b.VeilingproductNr,
                AantalStuks      = b.AantalStuks,
                GebruikerNr      = b.GebruikerNr,
                BedragPerFust    = b.BedragPerFust
            }).ToList(),
        });
}
