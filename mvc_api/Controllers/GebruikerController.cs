using System.Linq;
using System.Security.Claims;
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

    [HttpGet("veilingmeester")]
    [Authorize(Roles = "VeilingMeester")]
    public ActionResult<IEnumerable<GebruikerAuctionViewDto>> GetForAuctionTeam(
        [FromQuery] string? role,
        [FromQuery] ModelStatus? status)
    {
        var query = Filter(QueryGebruikers(), null, role, status, null)
            .Where(g => g.Status != ModelStatus.Deleted)
            .OrderBy(g => g.GebruikerNr);

        var items = query
            .Select(MapToAuction)
            .ToList();

        return Ok(items);
    }

    [HttpGet("veilingmeester/{id:int}")]
    [Authorize(Roles = "VeilingMeester")]
    public ActionResult<GebruikerAuctionViewDto> GetAuctionDetail(int id)
    {
        var dto = QueryGebruikers()
            .Where(g => g.GebruikerNr == id && g.Status != ModelStatus.Deleted)
            .Select(MapToAuction)
            .FirstOrDefault();

        if (dto is null)
            return NotFound(NotFoundProblem(id));

        return Ok(dto);
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<GebruikerSelfDto> GetSelf()
    {
        if (!TryGetUserId(out var gebruikerNr))
            return Unauthorized();

        var dto = QueryGebruikers()
            .Where(g => g.GebruikerNr == gebruikerNr && g.Status == ModelStatus.Active)
            .Select(MapToSelf)
            .FirstOrDefault();

        if (dto is null)
            return Unauthorized();

        return Ok(dto);
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateSelf(
        [FromBody] GebruikerSelfUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (!TryGetUserId(out var gebruikerNr))
            return Unauthorized();

        var user = await _db.Gebruikers
            .SingleOrDefaultAsync(g => g.GebruikerNr == gebruikerNr, ct);

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

    private IQueryable<Gebruiker> QueryGebruikers() => _db.Gebruikers.AsQueryable();

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

    private static GebruikerAuctionViewDto MapToAuction(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Kvk, g.Status);

    private static GebruikerSelfDto MapToSelf(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Kvk, g.StraatAdres, g.Postcode, g.LaatstIngelogd, g.Status);

    private bool TryGetUserId(out int userId)
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idValue, out userId);
    }

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