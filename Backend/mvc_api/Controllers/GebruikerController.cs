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

    /// <summary>
    /// Controller voor het ophalen van gebruikersgegevens (verschillende views/DTO's).
    /// </summary>
    public GebruikerController(AppDbContext db) => _db = db;

    /// <summary>
    /// Haalt een lijst gebruikers op voor de veilingmeester (auction team).
    /// Optioneel filter op rol (soort) en status. Verwijderde users worden uitgesloten.
    /// </summary>
    /// <param name="role">Optioneel: filter op soort/rol (bijv. Koper/Bedrijf).</param>
    /// <param name="status">Optioneel: filter op status (Active/Inactive/Deleted).</param>
    /// <returns>Lijst met compacte gebruiker-samenvattingen.</returns>
    [HttpGet("veilingmeester")]
    [Authorize(Roles = "VeilingMeester")]
    public ActionResult<IEnumerable<GebruikerSummaryDto>> GetForAuctionTeam(
        [FromQuery] string? role,
        [FromQuery] ModelStatus? status)
    {
        var query = Filter(QueryGebruikers(), null, role, status, null)
            .Where(g => g.Status != ModelStatus.Deleted)
            .Where(g => GebruikerSoorten.Allowed.Contains(g.Soort))
            .OrderBy(g => g.GebruikerNr);

        var items = query
            .Select(MapToSummary)
            .ToList();

        return Ok(items);
    }

    /// <summary>
    /// Haalt het eigen account op van de ingelogde gebruiker.
    /// Gebruikt de NameIdentifier claim om het gebruikerNr te bepalen.
    /// </summary>
    /// <returns>Detail DTO van de ingelogde gebruiker of Unauthorized.</returns>
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

    /// <summary>
    /// Haalt alleen de (bedrijfs)naam op van een gebruiker op basis van GebruikerNr.
    /// Wordt anoniem aangeboden (bijv. om een kwekernaam te tonen).
    /// </summary>
    /// <param name="GebruikerNr">ID van de gebruiker.</param>
    /// <returns>Anonymous DTO met naam of 404 als niet gevonden.</returns>
    [HttpGet("kwekerNaam")]
    [AllowAnonymous]
    public ActionResult<GebruikerAnonymousDto> GetgebruikerNaam([FromQuery] int GebruikerNr)
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

    /// <summary>
    /// Basis query voor gebruikers (NoTracking voor read-only performance).
    /// </summary>
    private IQueryable<Gebruiker> QueryGebruikers() => _db.Gebruikers.AsNoTracking();

    /// <summary>
    /// Past filters toe op een gebruikersquery (zoekterm, rol/soort, status en email).
    /// Alleen filters die gevuld zijn worden toegepast.
    /// </summary>
    /// <param name="query">Startquery.</param>
    /// <param name="term">Optioneel: zoekterm op bedrijfsnaam of email.</param>
    /// <param name="role">Optioneel: filter op soort/rol.</param>
    /// <param name="status">Optioneel: filter op status.</param>
    /// <param name="email">Optioneel: filter op (deel van) email.</param>
    /// <returns>De gefilterde query.</returns>
    private static IQueryable<Gebruiker> Filter(
        IQueryable<Gebruiker> query,
        string? term,
        string? role,
        ModelStatus? status,
        string? email)
    {
        var trimmedTerm = TrimOrNull(term);
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

    /// <summary>
    /// Zet een Gebruiker entity om naar een compacte summary DTO.
    /// </summary>
    private static GebruikerSummaryDto MapToSummary(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Kvk, g.Status);

    /// <summary>
    /// Zet een Gebruiker entity om naar een detail DTO (incl. adres en laatst ingelogd).
    /// </summary>
    private static GebruikerDetailDto MapToDetail(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam, g.Email!, g.Soort, g.Kvk, g.Status, g.StraatAdres, g.Postcode, g.LaatstIngelogd);

    /// <summary>
    /// Zet een Gebruiker entity om naar een minimale DTO (alleen nr + naam).
    /// </summary>
    private static GebruikerAnonymousDto MapToAnonymous(Gebruiker g) =>
        new(g.GebruikerNr, g.BedrijfsNaam);

    /// <summary>
    /// Probeert gebruikerNr uit de JWT/claims te halen (NameIdentifier).
    /// </summary>
    /// <param name="gebruikerNr">Uitkomst: parsed gebruikerNr.</param>
    /// <returns>True als de claim aanwezig en parsebaar is.</returns>
    private bool TryGetGebruikerNr(out int gebruikerNr)
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idValue, out gebruikerNr);
    }

    /// <summary>
    /// Maakt een standaard "niet gevonden" problem message voor gebruikers.
    /// </summary>
    private ProblemDetails NotFoundProblem(int id) =>
        CreateProblemDetails("Niet gevonden", $"Geen gebruiker met ID {id}.", 404);

    /// <summary>
    /// Maakt een standaard ProblemDetails object voor consistente foutmeldingen.
    /// </summary>
    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title = title,
            Detail = detail,
            Status = statusCode,
            Instance = HttpContext?.Request?.Path
        };

    /// <summary>
    /// Trimt een string; geeft null terug als de waarde leeg of whitespace is.
    /// </summary>
    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
