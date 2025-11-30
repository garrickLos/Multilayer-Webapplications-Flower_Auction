using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        var query = Filter(QueryGebruikers(), q, role, status, email);

        var items = query
            .Select(MapToAdminList)
            .ToList();

        return await Task.FromResult<ActionResult<IEnumerable<GebruikerAdminListDto>>>(Ok(items));
    }

    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<GebruikerAdminDetailDto>> GetAdminDetail(int id, CancellationToken ct = default)
    {
        var dto = QueryGebruikers()
            .Where(g => g.GebruikerNr == id)
            .Select(MapToAdminDetail)
            .FirstOrDefault();

        return await Task.FromResult<ActionResult<GebruikerAdminDetailDto>>(
            dto is null ? NotFound(NotFoundProblem(id)) : Ok(dto));
    }

    [HttpGet("veilingmeester")]
    [Authorize(Roles = "Veilingmeester")]
    public async Task<ActionResult<IEnumerable<GebruikerAuctionViewDto>>> GetForAuctionTeam(
        [FromQuery] string? role,
        [FromQuery] ModelStatus? status,
        CancellationToken ct = default)
    {
        var query = Filter(QueryGebruikers(), null, role, status, null);

        var items = query
            .Select(MapToAuction)
            .ToList();

        return await Task.FromResult<ActionResult<IEnumerable<GebruikerAuctionViewDto>>>(Ok(items));
    }

    [HttpGet("veilingmeester/{id:int}")]
    [Authorize(Roles = "Veilingmeester")]
    public async Task<ActionResult<GebruikerAuctionViewDto>> GetAuctionDetail(int id, CancellationToken ct = default)
    {
        var dto = QueryGebruikers()
            .Where(g => g.GebruikerNr == id && g.Status != ModelStatus.Deleted)
            .Select(MapToAuction)
            .FirstOrDefault();

        return await Task.FromResult<ActionResult<GebruikerAuctionViewDto>>(
            dto is null ? NotFound(NotFoundProblem(id)) : Ok(dto));
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] GebruikerStatusUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (user is null)
            return NotFound(NotFoundProblem(id));

        user.Status = dto.Status;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:int}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateRole(
        int id,
        [FromBody] string role,
        CancellationToken ct = default)
    {
        var user = await _db.Gebruikers.FindAsync(new object[] { id }, ct);
        if (user is null)
            return NotFound(NotFoundProblem(id));

        if (string.IsNullOrWhiteSpace(role))
            return BadRequest(CreateProblemDetails("Ongeldige rol", "Rol mag niet leeg zijn.", 400));

        user.Soort = role.Trim();
        await _db.SaveChangesAsync(ct);
        return NoContent();
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
            return NotFound(NotFoundProblem(id));

        user.BedrijfsNaam = dto.BedrijfsNaam.Trim();
        user.Email        = dto.Email.Trim();
        user.UserName     = dto.Email.Trim();
        user.Soort        = dto.Soort;
        user.Kvk          = dto.Kvk;
        user.StraatAdres  = dto.StraatAdres;
        user.Postcode     = dto.Postcode;

        await _db.SaveChangesAsync(ct);

        // Hier hergebruiken we de bestaande methode, maar dat is nu ook sync-in-Task
        return await GetAdminDetail(id, ct);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<GebruikerSelfDto>> GetSelf(CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var dto = QueryGebruikers()
            .Where(g => g.GebruikerNr == userId && g.Status == ModelStatus.Active)
            .Select(MapToSelf)
            .FirstOrDefault();

        return await Task.FromResult<ActionResult<GebruikerSelfDto>>(
            dto is null ? Unauthorized() : Ok(dto));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateSelf(
        [FromBody] GebruikerSelfUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (!TryGetUserId(out var userId))
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

    private IQueryable<Gebruiker> QueryGebruikers() => _db.Gebruikers;

    private static IQueryable<Gebruiker> Filter(
        IQueryable<Gebruiker> query,
        string? term,
        string? role,
        ModelStatus? status,
        string? email)
    {
        var trimmedTerm  = term?.Trim();
        var trimmedEmail = email?.Trim();

        if (!string.IsNullOrWhiteSpace(trimmedTerm))
        {
            query = query.Where(g =>
                g.BedrijfsNaam.Contains(trimmedTerm!) ||
                g.Email!.Contains(trimmedTerm!));
        }

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(g => g.Soort == role);

        if (status is not null)
            query = query.Where(g => g.Status == status);

        if (!string.IsNullOrWhiteSpace(trimmedEmail))
            query = query.Where(g => g.Email!.Contains(trimmedEmail!));

        return query;
    }

    private static GebruikerAdminListDto MapToAdminList(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Status);

    private static GebruikerAdminDetailDto MapToAdminDetail(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Kvk, g.StraatAdres, g.Postcode, g.Status, g.LaatstIngelogd);

    private static GebruikerAuctionViewDto MapToAuction(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Kvk, g.Status);

    private static GebruikerSelfDto MapToSelf(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Kvk, g.StraatAdres, g.Postcode, g.LaatstIngelogd, g.Status);

    private bool TryGetUserId(out int userId) =>
        int.TryParse(User?.Identity?.Name, out userId);

    private ProblemDetails NotFoundProblem(int id) =>
        CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404);

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title    = title,
            Detail   = detail,
            Status   = statusCode,
            Instance = HttpContext?.Request?.Path
        };
}
