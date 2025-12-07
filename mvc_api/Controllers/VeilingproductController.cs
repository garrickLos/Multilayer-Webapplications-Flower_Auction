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
public class VeilingproductController : ControllerBase
{
    private readonly AppDbContext _db;
    public VeilingproductController(AppDbContext db) => _db = db;

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<VeilingproductPublicListDto>>> GetPublic(
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] int? minPrice,
        [FromQuery] int? maxPrice,
        [FromQuery] DateTime? createdAfter,
        [FromQuery] string? title,
        CancellationToken ct = default)
    {
        var query = BuildFilteredQuery(
            q, categorieNr, null, minPrice, maxPrice, createdAfter, title, ModelStatus.Active);

        var items = await query
            .Select(VeilingproductDtoSelectors.PublicList)
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("kweker")]
    [Authorize(Roles = "Bedrijf")]
    public async Task<ActionResult<IEnumerable<VeilingproductKwekerListDto>>> GetForKweker(
        [FromQuery] ModelStatus? status,
        CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var query = _db.Veilingproducten
            .AsNoTracking()
            .Where(v => v.Kwekernr == userId &&
                        (!status.HasValue || v.Status == status.Value));

        var items = await query
            .OrderBy(v => v.Naam)
            .Select(VeilingproductDtoSelectors.KwekerList)
            .ToListAsync(ct);

        return Ok(items);
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
        var query = BuildFilteredQuery(
            q, categorieNr, status, minPrice, maxPrice, createdAfter, title, null);

        var items = await query
            .Select(VeilingproductDtoSelectors.VeilingmeesterList)
            .ToListAsync(ct);

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

        _db.Veilingproducten.Add(entity);
        await _db.SaveChangesAsync(ct);

        var resultDto = await _db.Veilingproducten
            .AsNoTracking()
            .Where(v => v.VeilingProductNr == entity.VeilingProductNr &&
                        v.Kwekernr == userId)
            .Select(VeilingproductDtoSelectors.KwekerList)
            .SingleAsync(ct);

        return Ok(resultDto);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Bedrijf")]
    public async Task<ActionResult<VeilingproductKwekerListDto>> Update(
        int id,
        [FromBody] VeilingproductUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _db.Veilingproducten.FindAsync(id);
        if (entity == null)
            return NotFound();

        if (!TryGetUserId(out var userId) || entity.Kwekernr != userId)
            return Forbid();

        var referenceError = await ValidateReferencesAsync(dto.CategorieNr, ct);
        if (referenceError != null)
            return referenceError;

        entity.Naam            = dto.Naam.Trim();
        entity.GeplaatstDatum  = dto.GeplaatstDatum ?? entity.GeplaatstDatum;
        entity.AantalFusten    = dto.AantalFusten;
        entity.VoorraadBloemen = dto.VoorraadBloemen;
        entity.CategorieNr     = dto.CategorieNr;
        entity.ImagePath       = dto.ImagePath;
        entity.Minimumprijs    = dto.Minimumprijs;
        entity.Plaats          = dto.Plaats;

        await _db.SaveChangesAsync(ct);

        var resultDto = await _db.Veilingproducten
            .AsNoTracking()
            .Where(v => v.VeilingProductNr == id &&
                        v.Kwekernr == userId)
            .Select(VeilingproductDtoSelectors.KwekerList)
            .SingleAsync(ct);

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

        var entity = await _db.Veilingproducten.FindAsync(id);
        if (entity == null)
            return NotFound();

        entity.Startprijs = dto.Startprijs;
        entity.VeilingNr  = dto.VeilingNr;

        await _db.SaveChangesAsync(ct);

        var resultDto = await _db.Veilingproducten
            .AsNoTracking()
            .Where(v => v.VeilingProductNr == id)
            .Select(VeilingproductDtoSelectors.VeilingmeesterList)
            .SingleAsync(ct);

        return Ok(resultDto);
    }

    private IQueryable<Veilingproduct> BuildFilteredQuery(
        string? q,
        int? categorieNr,
        ModelStatus? status,
        int? minPrice,
        int? maxPrice,
        DateTime? createdAfter,
        string? title,
        ModelStatus? forceStatus)
    {
        var query = _db.Veilingproducten.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(v => v.Naam.Contains(term));
        }

        if (categorieNr is int cnr)
            query = query.Where(v => v.CategorieNr == cnr);

        if (status is ModelStatus st)
            query = query.Where(v => v.Status == st);

        if (forceStatus is ModelStatus fst)
            query = query.Where(v => v.Status == fst);

        if (minPrice is int min)
            query = query.Where(v => v.Startprijs >= min);

        if (maxPrice is int max)
            query = query.Where(v => v.Startprijs <= max);

        if (createdAfter is DateTime ca)
            query = query.Where(v => v.GeplaatstDatum >= ca);

        if (!string.IsNullOrWhiteSpace(title))
            query = query.Where(v => v.Naam.Contains(title));

        return query.OrderBy(v => v.Naam);
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

    private async Task<ActionResult?> ValidateReferencesAsync(int categorieNr, CancellationToken ct)
    {
        if (!await _db.Categorieen.AnyAsync(c => c.CategorieNr == categorieNr, ct))
        {
            ModelState.AddModelError(
                nameof(VeilingproductCreateDto.CategorieNr),
                $"Categorie met nummer {categorieNr} bestaat niet.");

            return ValidationProblem(ModelState);
        }
        return null;
    }
}
