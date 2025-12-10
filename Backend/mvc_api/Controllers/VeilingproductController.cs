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
[Authorize (Roles ="Bedrijf, Koper, VeilingMeester")]
public class VeilingproductController : ControllerBase
{
    private readonly AppDbContext _db;
    public VeilingproductController(AppDbContext db) => _db = db;

    //Get voor klant
    [HttpGet("Klant")]
    [Authorize(Roles = "Koper")]
    public async Task<ActionResult<IEnumerable<klantVeilingproductGet_dto>>> KlantGetAll(
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Veilingproducten.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(vp => vp.Naam.Contains(term));
        }

        if (categorieNr is int cnr)
            query = query.Where(vp => vp.CategorieNr == cnr);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(vp => vp.Naam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new klantVeilingproductGet_dto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.ImagePath,
                v.Plaats
            ))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

        return Ok(items);
    }
    
    //Get voor kweker
    [HttpGet("Kweker")]
    [Authorize(Roles = "Bedrijf")]

    public async Task<ActionResult<IEnumerable<kwekerVeilingproductGet_dto>>> KwekerGetAll(
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);
        
        
        var query = _db.Veilingproducten.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(vp => vp.Naam.Contains(term));
        }

        if (categorieNr is int cnr)
            query = query.Where(vp => vp.CategorieNr == cnr);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(vp => vp.Naam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new kwekerVeilingproductGet_dto(
                v.VeilingProductNr,
                v.Naam,
                v.GeplaatstDatum,
                v.AantalFusten,
                v.VoorraadBloemen,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.ImagePath,
                v.Plaats
            ))
            .ToListAsync(ct);

        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();

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
    [Authorize(Roles = "Bedrijf, Koper, VeilingMeester")]
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
        var query = _db.Veilingproducten
            .AsNoTracking()
            .Include(v => v.Categorie)
            .AsQueryable();
        
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
            query = query.Where(v => (v.Startprijs ?? v.Minimumprijs) >= min);
        
        if (maxPrice is int max)
            query = query.Where(v => (v.Startprijs ?? v.Minimumprijs) <= max);
        
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
