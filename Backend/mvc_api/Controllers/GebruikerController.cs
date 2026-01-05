using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
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
    public ActionResult<IEnumerable<GebruikerSummaryDto>> GetForAuctionTeam(
        [FromQuery] string? role,
        [FromQuery] ModelStatus? status)
    {
        var query = Filter(QueryGebruikers(), null, role, status, null)
            .Where(g => g.Status != ModelStatus.Deleted)
            .OrderBy(g => g.GebruikerNr);

        var items = query
            .Select(MapToSummary)
            .ToList();

        return Ok(items);
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<GebruikerDetailDto> GetSelf()
    {
        if (!TryGetGebruikerNr(out var gebruikerNr))
            return Unauthorized();

        var dto = QueryGebruikers()
            .Where(g => g.GebruikerNr == gebruikerNr && g.Status == ModelStatus.Active)
            .Select(MapToDetail)
            .FirstOrDefault();

        if (dto is null)
            return Unauthorized();

        return Ok(dto);
    }

    [HttpGet("kwekerNaam")]
    [AllowAnonymous]
    public ActionResult<GebruikerAnonymousDto> GetgebruikerNaam(
    [FromQuery] int GebruikerNr
    )    
    {
        var dto = QueryGebruikers()
            .Where(g => g.GebruikerNr == GebruikerNr)
            .Select(MapToAnonymous)
            .FirstOrDefault();
        
        if (dto is null)
        {
            return NotFound();
        }

        return Ok(dto);
    }

    private IQueryable<Gebruiker> QueryGebruikers() => _db.Gebruikers.AsNoTracking();

    private static IQueryable<Gebruiker> Filter(
        IQueryable<Gebruiker> query,
        string? term,
        string? role,
        ModelStatus? status,
        string? email)
    {
        var trimmedTerm  = TrimOrNull(term);
        var trimmedEmail = TrimOrNull(email);

        if (!string.IsNullOrWhiteSpace(trimmedTerm))
        {
            query = query.Where(g =>
                g.BedrijfsNaam.Contains(trimmedTerm!) ||
                g.Email!.Contains(trimmedTerm!));
        }

        if (GebruikerSoorten.TryNormalize(role, out var normalizedRole))
            query = query.Where(g => g.Soort == normalizedRole);

        if (status is not null)
            query = query.Where(g => g.Status == status);

        if (!string.IsNullOrWhiteSpace(trimmedEmail))
            query = query.Where(g => g.Email!.Contains(trimmedEmail!));

        return query;
    }

    private static GebruikerSummaryDto MapToSummary(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Kvk, g.Status);

    private static GebruikerDetailDto MapToDetail(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Kvk, g.Status, g.StraatAdres, g.Postcode, g.LaatstIngelogd);

    private static GebruikerAnonymousDto MapToAnonymous(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam);

    private bool TryGetGebruikerNr(out int gebruikerNr)
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idValue, out gebruikerNr);
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

    private static string? TrimOrNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
