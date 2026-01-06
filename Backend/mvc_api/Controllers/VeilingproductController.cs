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
[Authorize (Roles ="Bedrijf, Koper, VeilingMeester")]
public class VeilingproductController : ControllerBase
{
    private readonly IVeilingproductRepository _repository;

    public VeilingproductController(IVeilingproductRepository repository) =>
        _repository = repository;

    //Get voor klant
    [HttpGet("Klant")]
    [Authorize(Roles = "Koper")]
    public async Task<ActionResult<IEnumerable<klantVeilingproductGet_dto>>> KlantGetAll(
        //[FromQuery] string Nummer,
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
    
    //Get voor kweker
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
        var result = await _repository.GetKwekerAsync(q, categorieNr, page, pageSize, ct);

        SetPaginationHeaders(result.TotalCount, result.Page, result.PageSize);

        return Ok(result.Items);
    }

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

    [HttpPost]
    [Authorize(Roles = "Bedrijf")]
    public async Task<ActionResult<VeilingproductKwekerListDto>> Create(
        [FromBody] VeilingproductCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var referenceError = await ValidateReferencesAsync(dto.CategorieNr, ct);
        if (referenceError != null)
            return referenceError;

        if (!TryGetUserId(out var userId))
            return Forbid();

        var entity = new Veilingproduct
        {
            Naam            = dto.Naam.Trim(),
            GeplaatstDatum  = dto.GeplaatstDatum ?? DateTime.UtcNow,
            AantalFusten    = dto.AantalFusten,
            VoorraadBloemen = dto.VoorraadBloemen,
            Startprijs      = null,
            CategorieNr     = dto.CategorieNr,
            Plaats          = dto.Plaats,
            Minimumprijs    = dto.Minimumprijs,
            Kwekernr        = userId,
            BeginDatum      = dto.BeginDatum,
            Status          = ModelStatus.Active,
            ImagePath       = dto.ImagePath
        };

        _repository.Add(entity);
        await _repository.SaveChangesAsync(ct);

        var resultDto = await _repository.GetKwekerListByIdAsync(entity.VeilingProductNr, userId, ct);

        return Ok(resultDto);
    }

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

        if (dto.CategorieNr != null)
        {
            var referenceError = await ValidateReferencesAsync((int)dto.CategorieNr, ct);
            if (referenceError != null)
                return referenceError;   
        }

        if (!string.IsNullOrEmpty(dto.Naam))
        {
            entity.Naam = dto.Naam.Trim();
        }

        entity.GeplaatstDatum  = dto.GeplaatstDatum ?? entity.GeplaatstDatum;
        entity.AantalFusten    = dto.AantalFusten ?? entity.AantalFusten;
        entity.VoorraadBloemen = dto.VoorraadBloemen ?? entity.VoorraadBloemen;
        entity.CategorieNr     = dto.CategorieNr ?? entity.CategorieNr;

        if (!string.IsNullOrEmpty(dto.ImagePath))
        {
            entity.ImagePath       = dto.ImagePath;      
        }

        entity.Minimumprijs    = dto.Minimumprijs ?? entity.Minimumprijs;
        entity.Plaats          = dto.Plaats ?? entity.Plaats;

        await _repository.SaveChangesAsync(ct);

        var resultDto = await _repository.GetKwekerListByIdAsync(id, null, ct);

        return Ok(resultDto);
    }

    // startprijs + veiling koppelen
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

        var now = DateTime.UtcNow.ToLocalTime();

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
        entity.VeilingNr  = dto.VeilingNr;

        await _repository.SaveChangesAsync(ct);

        var resultDto = await _repository.GetVeilingmeesterListByIdAsync(id, ct);

        return Ok(resultDto);
    }

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


    private void SetPaginationHeaders(int total, int page, int pageSize)
    {
        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();
    }

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

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title    = title,
            Detail   = detail,
            Status   = statusCode,
            Instance = HttpContext?.Request?.Path
        };
}
