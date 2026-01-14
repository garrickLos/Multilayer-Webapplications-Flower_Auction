using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Models.Dtos;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Bedrijf, Koper, VeilingMeester")]
public class VeilingproductController : ControllerBase
{
    private readonly IVeilingproductRepository _repository;

    //private readonly IImageStorageService _imageStorage;

    /// <summary>
    /// Controller voor veilingproducten: ophalen per rol, aanmaken, updaten en plannen (veiling koppelen).
    /// Logica voor database acties zit in de repository.
    /// </summary>
    public VeilingproductController(IVeilingproductRepository repository)
    {
        _repository = repository;
        // _imageStorage = imageStorage;
    }

    private DateTimeWithZone _myDate = new DateTimeWithZone(DateTime.UtcNow, TijdZoneConfig.Amsterdam);

    /// <summary>
    /// Haalt veilingproducten op voor een koper (met zoekterm/categorie + paginering).
    /// Zet paginering informatie in response headers.
    /// </summary>
    /// <param name="q">Optioneel: zoekterm (bijv. naam).</param>
    /// <param name="categorieNr">Optioneel: filter op categorie.</param>
    /// <param name="page">Pagina (start bij 1).</param>
    /// <param name="pageSize">Items per pagina.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Lijst met producten voor koper.</returns>
    // GET: api/Veilingproduct/Klant
    [HttpGet("Klant")]
    [Authorize(Roles = "Koper")]
    public async Task<ActionResult<IEnumerable<klantVeilingproductGet_dto>>> KlantGetAll(
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await _repository.GetKlantAsync(q, categorieNr, page, pageSize, ct);

        SetPaginationHeaders(result.TotalCount, result.Page, result.PageSize);

        return Ok(result.Items);
    }

    /// <summary>
    /// Haalt veilingproducten op voor een kweker/bedrijf (eigen producten).
    /// Ondersteunt zoeken/filteren + paginering en zet headers.
    /// </summary>
    /// <param name="Nummer">KwekerNr/Bedrijf ID (gebruikerNr).</param>
    /// <param name="q">Optioneel: zoekterm.</param>
    /// <param name="categorieNr">Optioneel: filter op categorie.</param>
    /// <param name="page">Pagina (start bij 1).</param>
    /// <param name="pageSize">Items per pagina.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Lijst met producten voor kweker.</returns>
    // GET: api/Veilingproduct/Kweker
    [HttpGet("Kweker")]
    [Authorize(Roles = "Bedrijf")]
    public async Task<ActionResult<IEnumerable<kwekerVeilingproductGet_dto>>> KwekerGetAll(
        [FromQuery] int Nummer,
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await _repository.GetKwekerAsync(Nummer, q, categorieNr, page, pageSize, ct);

        SetPaginationHeaders(result.TotalCount, result.Page, result.PageSize);

        return Ok(result.Items);
    }

    /// <summary>
    /// Haalt veilingproducten op voor de veilingmeester met uitgebreide filters.
    /// </summary>
    /// <param name="q">Optioneel: zoekterm.</param>
    /// <param name="categorieNr">Optioneel: filter op categorie.</param>
    /// <param name="status">Optioneel: filter op status.</param>
    /// <param name="minPrice">Optioneel: minimale prijs.</param>
    /// <param name="maxPrice">Optioneel: maximale prijs.</param>
    /// <param name="createdAfter">Optioneel: alleen producten aangemaakt na deze datum.</param>
    /// <param name="title">Optioneel: titel/naam filter.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Lijst met producten voor veilingmeester.</returns>
    [HttpGet("veilingmeester")]
    [Authorize(Roles = "VeilingMeester")]
    public async Task<ActionResult<IEnumerable<VeilingproductVeilingmeesterListDto>>> GetForVeilingmeester(
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] ModelStatus? status,
        [FromQuery] int? minPrice,
        [FromQuery] int? maxPrice,
        [FromQuery] DateTime? createdAfter,
        [FromQuery] string? title,
        CancellationToken ct = default)
    {
        var items = await _repository.GetForVeilingmeesterAsync(
            q,
            categorieNr,
            status,
            minPrice,
            maxPrice,
            createdAfter,
            title,
            ct);

        return Ok(items);
    }

    /// <summary>
    /// Maakt een nieuw veilingproduct aan (alleen bedrijf/kweker).
    /// Controleert modelvalidatie, controleert of categorie bestaat en koppelt het product aan de ingelogde gebruiker.
    /// </summary>
    /// <param name="dto">Productgegevens.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Het aangemaakte product (kweker-list DTO).</returns>
    [HttpPost]
    [Authorize(Roles = "Bedrijf")]
    public async Task<ActionResult<VeilingproductKwekerListDto>> Create(
        [FromBody] VeilingproductCreateDto dto,
        CancellationToken ct = default)
    {
        //string? imagePath = null;
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var referenceError = await ValidateReferencesAsync(dto.CategorieNr, ct);
        if (referenceError != null)
            return referenceError;

        if (!TryGetUserId(out var userId))
            return Forbid();

        var entity = new Veilingproduct
        {
            Naam = dto.Naam.Trim(),
            GeplaatstDatum = dto.GeplaatstDatum ?? DateTime.UtcNow,
            AantalFusten = dto.AantalFusten,
            VoorraadBloemen = dto.VoorraadBloemen,
            Startprijs = null,
            CategorieNr = dto.CategorieNr,
            Plaats = dto.Plaats,
            Minimumprijs = dto.Minimumprijs,
            Kwekernr = userId,
            BeginDatum = dto.BeginDatum,
            Status = ModelStatus.Active,
            ImagePath = dto.ImagePath
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(ct);

        var resultDto = await _repository.GetKwekerListByIdAsync(entity.VeilingProductNr, userId, ct);

        return Ok(resultDto);
    }

    /// <summary>
    /// Update een bestaand veilingproduct.
    /// Werkt met optionele velden (alleen ingevulde velden worden aangepast).
    /// Controleert ook of categorie bestaat als die wordt aangepast.
    /// </summary>
    /// <param name="id">VeilingProductNr.</param>
    /// <param name="dto">Velden om te wijzigen.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Het bijgewerkte product (kweker-list DTO).</returns>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Bedrijf, Koper, VeilingMeester")]
    public async Task<ActionResult<VeilingproductKwekerListDto>> Update(
        int id,
        [FromBody] VeilingproductUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _repository.FindAsync(id, ct);
        if (entity == null)
            return NotFound();

        bool userFound = TryGetUserId(out var userId);
        if (!userFound)
        {
            return BadRequest($"Kan User ID niet uit token halen. Claims in token: {string.Join(", ", User.Claims.Select(c => c.Type + ":" + c.Value))}");
        }

        // Alleen checken als categorie wordt aangepast
        if (dto.CategorieNr != null)
        {
            var referenceError = await ValidateReferencesAsync((int)dto.CategorieNr, ct);
            if (referenceError != null)
                return referenceError;
        }

        if (!string.IsNullOrEmpty(dto.Naam))
            entity.Naam = dto.Naam.Trim();

        entity.GeplaatstDatum = dto.GeplaatstDatum ?? entity.GeplaatstDatum;
        entity.AantalFusten = dto.AantalFusten ?? entity.AantalFusten;
        entity.VoorraadBloemen = dto.VoorraadBloemen ?? entity.VoorraadBloemen;
        entity.CategorieNr = dto.CategorieNr ?? entity.CategorieNr;

        if (!string.IsNullOrEmpty(dto.ImagePath))
            entity.ImagePath = dto.ImagePath;

        // Minimumprijs alleen door bedrijf/kweker aanpasbaar
        if (dto.Minimumprijs.HasValue && User.IsInRole("Bedrijf"))
            entity.Minimumprijs = dto.Minimumprijs.Value;

        entity.Plaats = dto.Plaats ?? entity.Plaats;

        await _repository.SaveChangesAsync(ct);

        var resultDto = await _repository.GetKwekerListByIdAsync(id, null, ct);

        return Ok(resultDto);
    }

    /// <summary>
    /// Veilingmeester endpoint om een product aan een veiling te koppelen/ontkoppelen en startprijs te zetten.
    /// Koppelen/ontkoppelen mag niet als de (huidige of gekozen) veiling actief is.
    /// </summary>
    /// <param name="id">VeilingProductNr.</param>
    /// <param name="dto">Planning gegevens (VeilingNr + Startprijs).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Het bijgewerkte product (veilingmeester DTO).</returns>
    [HttpPut("veilingmeester/{id:int}")]
    [Authorize(Roles = "VeilingMeester")]
    public async Task<ActionResult<VeilingproductVeilingmeesterListDto>> UpdatePlanning(
        int id,
        [FromBody] VeilingproductVeilingmeesterUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _repository.FindAsync(id, ct);
        if (entity == null)
            return NotFound();

        var now = _myDate.LocalTime;

        // Als er een veiling gekozen wordt, moet er ook een startprijs zijn en de veiling mag niet actief zijn
        if (dto.VeilingNr.HasValue)
        {
            if (!dto.Startprijs.HasValue)
            {
                return BadRequest(CreateProblemDetails(
                    "Startprijs vereist",
                    "Geef een startprijs op om een product te koppelen.",
                    400));
            }

            var veiling = await _repository.GetVeilingAsync(dto.VeilingNr.Value, ct);
            if (veiling is null)
            {
                return BadRequest(CreateProblemDetails(
                    "Ongeldige veiling",
                    $"Veiling met ID {dto.VeilingNr.Value} bestaat niet.",
                    400));
            }

            var isActive = veiling.Begintijd <= now && veiling.Eindtijd > now;
            if (isActive)
            {
                return BadRequest(CreateProblemDetails(
                    "Actieve veiling",
                    "Koppelen of ontkoppelen is niet toegestaan tijdens een actieve veiling.",
                    400));
            }
        }
        // Als er ontkoppeld wordt: check of de huidige veiling actief is
        else if (entity.VeilingNr.HasValue)
        {
            var currentVeiling = await _repository.GetVeilingAsync(entity.VeilingNr.Value, ct);
            if (currentVeiling is not null)
            {
                var isActive = currentVeiling.Begintijd <= now && currentVeiling.Eindtijd > now;
                if (isActive)
                {
                    return BadRequest(CreateProblemDetails(
                        "Actieve veiling",
                        "Koppelen of ontkoppelen is niet toegestaan tijdens een actieve veiling.",
                        400));
                }
            }
        }

        entity.Startprijs = dto.VeilingNr.HasValue ? dto.Startprijs : null;
        entity.VeilingNr = dto.VeilingNr;

        await _repository.SaveChangesAsync(ct);

        var resultDto = await _repository.GetVeilingmeesterListByIdAsync(id, ct);

        return Ok(resultDto);
    }

    /// <summary>
    /// Probeert de ingelogde gebruiker ID uit de claims te halen (NameIdentifier).
    /// </summary>
    /// <param name="userId">Uitkomst: parsed userId.</param>
    /// <returns>True als ID gevonden en parsebaar is.</returns>
    private bool TryGetUserId(out int userId)
    {
        var idValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (int.TryParse(idValue, out var parsed))
        {
            userId = parsed;
            return true;
        }

        userId = 0;
        return false;
    }

    /// <summary>
    /// Zet paginering informatie in response headers.
    /// </summary>
    /// <param name="total">Totaal aantal records.</param>
    /// <param name="page">Huidige pagina.</param>
    /// <param name="pageSize">Aantal items per pagina.</param>
    private void SetPaginationHeaders(int total, int page, int pageSize)
    {
        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"] = page.ToString();
        Response.Headers["X-Page-Size"] = pageSize.ToString();
    }

    /// <summary>
    /// Controleert of referenties (nu: categorie) bestaan voordat je opslaat.
    /// Geeft een ValidationProblem terug als categorie niet bestaat.
    /// </summary>
    /// <param name="categorieNr">Categorie ID om te checken.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Null als OK, anders een ActionResult met foutmelding.</returns>
    private async Task<ActionResult?> ValidateReferencesAsync(int categorieNr, CancellationToken ct)
    {
        if (!await _repository.CategorieExistsAsync(categorieNr, ct))
        {
            ModelState.AddModelError(
                nameof(VeilingproductCreateDto.CategorieNr),
                $"Categorie met nummer {categorieNr} bestaat niet.");

            return ValidationProblem(ModelState);
        }
        return null;
    }

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
}
