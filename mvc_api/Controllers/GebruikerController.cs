using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Models.Dtos;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GebruikerController : ControllerBase
{
    private readonly AppDbContext _db;
    public GebruikerController(AppDbContext db) => _db = db;

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<GebruikerAdminListDto>>> GetAdmin(
        [FromQuery] string? q,
        [FromQuery] string? role,
        [FromQuery] ModelStatus? status,
        [FromQuery] string? email,
        CancellationToken ct = default)
    {
        var query = _db.Gebruikers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(g => g.BedrijfsNaam.Contains(term) || g.Email!.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(g => g.Soort == role);

        if (status is ModelStatus st)
            query = query.Where(g => g.Status == st);

        if (!string.IsNullOrWhiteSpace(email))
            query = query.Where(g => g.Email!.Contains(email));

        var items = await query
            .Select(g => new GebruikerAdminListDto(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Status))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<GebruikerAdminDetailDto>> GetAdminDetail(int id, CancellationToken ct = default)
    {
        var dto = await _db.Gebruikers.AsNoTracking()
            .Where(g => g.GebruikerNr == id)
            .Select(g => new GebruikerAdminDetailDto(
                g.GebruikerNr,
                g.BedrijfsNaam,
                g.Email!,
                g.Soort,
                g.Kvk,
                g.StraatAdres,
                g.Postcode,
                g.Status,
                g.LaatstIngelogd
            ))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404))
            : Ok(dto);
    }

    [HttpGet("veilingmeester")]
    [Authorize(Roles = "Veilingmeester")]
    public async Task<ActionResult<IEnumerable<GebruikerAuctionViewDto>>> GetForAuctionTeam(
        [FromQuery] string? role,
        [FromQuery] ModelStatus? status,
        CancellationToken ct = default)
    {
        var query = _db.Gebruikers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(g => g.Soort == role);

        if (status is ModelStatus st)
            query = query.Where(g => g.Status == st);

        var items = await query
            .Select(g => new GebruikerAuctionViewDto(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Status))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("veilingmeester/{id:int}")]
    [Authorize(Roles = "Veilingmeester")]
    public async Task<ActionResult<GebruikerAuctionViewDto>> GetAuctionDetail(int id, CancellationToken ct = default)
    {
        var dto = await _db.Gebruikers.AsNoTracking()
            .Where(g => g.GebruikerNr == id && g.Status != ModelStatus.Deleted)
            .Select(g => new GebruikerAuctionViewDto(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Status))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404))
            : Ok(dto);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] GebruikerStatusUpdateDto dto, CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (user is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        user.Status = dto.Status;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:int}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] string role, CancellationToken ct = default)
    {
        var user = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (user is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        if (string.IsNullOrWhiteSpace(role))
            return BadRequest(CreateProblemDetails("Ongeldige rol", "Rol mag niet leeg zijn.", 400));

        user.Soort = role.Trim();
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<GebruikerAdminDetailDto>> Create(
        [FromBody] GebruikerCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = new Gebruiker
        {
            BedrijfsNaam  = dto.BedrijfsNaam.Trim(),
            Email         = dto.Email.Trim(),
            UserName      = dto.Email.Trim(),
            Soort         = dto.Soort,
            Kvk           = dto.Kvk,
            StraatAdres   = dto.StraatAdres,
            Postcode      = dto.Postcode,
            LaatstIngelogd = null,
            Status        = ModelStatus.Active
        };

        _db.Gebruikers.Add(user);
        await _db.SaveChangesAsync(ct);

        return await GetAdminDetail(user.GebruikerNr, ct);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<GebruikerAdminDetailDto>> Update(
        int id,
        [FromBody] GebruikerUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (user is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404));

        user.BedrijfsNaam = dto.BedrijfsNaam.Trim();
        user.Email        = dto.Email.Trim();
        user.UserName     = dto.Email.Trim();
        user.Soort        = dto.Soort;
        user.Kvk          = dto.Kvk;
        user.StraatAdres  = dto.StraatAdres;
        user.Postcode     = dto.Postcode;

        await _db.SaveChangesAsync(ct);

        return await GetAdminDetail(id, ct);
    }

[HttpGet("me")]
[Authorize]
public async Task<ActionResult<GebruikerSelfDto>> GetSelf(CancellationToken ct = default)
{
        if (!int.TryParse(User?.Identity?.Name, out var userId))
            return Unauthorized();

        var dto = await _db.Gebruikers.AsNoTracking()
            .Where(g => g.GebruikerNr == userId && g.Status == ModelStatus.Active)
            .Select(g => new GebruikerSelfDto(
                g.GebruikerNr,
                g.BedrijfsNaam,
                g.Email!,
                g.Soort,
                g.Kvk,
                g.StraatAdres,
                g.Postcode,
                g.LaatstIngelogd,
                g.Status
            ))
            .FirstOrDefaultAsync(ct);

        return dto is null ? Unauthorized() : Ok(dto);
}

[HttpPut("me")]
[Authorize]
public async Task<IActionResult> UpdateSelf([FromBody] GebruikerSelfUpdateDto dto, CancellationToken ct = default)
{
    if (!ModelState.IsValid)
        return ValidationProblem(ModelState);

    if (!int.TryParse(User?.Identity?.Name, out var userId))
        return Unauthorized();

    var user = await _db.Gebruikers.FindAsync(new object[] { userId }, ct);
    if (user is null)
        return Unauthorized();

    user.BedrijfsNaam = dto.BedrijfsNaam.Trim();
    user.Email        = dto.Email.Trim();
    user.UserName     = dto.Email.Trim();
    user.Kvk          = dto.Kvk;
    user.StraatAdres  = dto.StraatAdres;
    user.Postcode     = dto.Postcode;

    await _db.SaveChangesAsync(ct);
    return NoContent();
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
