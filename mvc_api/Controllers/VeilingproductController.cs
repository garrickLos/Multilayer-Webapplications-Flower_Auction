using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Models.Dtos;
using VeilingproductUpdateDto = mvc_api.Models.Dtos.VeilingproductUpdateDto;

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
        var query = BuildFilteredQuery(q, categorieNr, null, minPrice, maxPrice, createdAfter, title, ModelStatus.Active);

        var items = await query
            .Select(v => new VeilingproductPublicListDto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.ImagePath,
                v.Plaats,
                v.VoorraadBloemen,
                v.AantalFusten,
                v.Startprijs
            ))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("public/{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<VeilingproductPublicDetailDto>> GetPublicDetail(int id, CancellationToken ct = default)
    {
        var dto = await _db.Veilingproducten.AsNoTracking()
            .Where(v => v.VeilingProductNr == id && v.Status == ModelStatus.Active)
            .Select(v => new VeilingproductPublicDetailDto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.ImagePath,
                v.Plaats,
                v.VoorraadBloemen,
                v.AantalFusten,
                v.Startprijs,
                v.Minimumprijs,
                v.GeplaatstDatum,
                v.Gebruiker.BedrijfsNaam
            ))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404))
            : Ok(dto);
    }

    [HttpGet("kweker")]
    [Authorize(Roles = "Kweker")]
    public async Task<ActionResult<IEnumerable<VeilingproductKwekerListDto>>> GetForKweker(
        [FromQuery] ModelStatus? status,
        CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var query = _db.Veilingproducten.AsNoTracking()
            .Where(v => v.Kwekernr == userId && (!status.HasValue || v.Status == status.Value));

        var items = await query
            .OrderBy(v => v.Naam)
            .Select(v => new VeilingproductKwekerListDto(
                v.VeilingProductNr,
                v.Naam,
                v.Status,
                v.Startprijs,
                v.Minimumprijs,
                v.AantalFusten,
                v.VoorraadBloemen,
                v.VeilingNr
            ))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("kweker/{id:int}")]
    [Authorize(Roles = "Kweker")]
    public async Task<ActionResult<VeilingproductKwekerDetailDto>> GetKwekerDetail(int id, CancellationToken ct = default)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var dto = await _db.Veilingproducten.AsNoTracking()
            .Where(v => v.VeilingProductNr == id && v.Kwekernr == userId)
            .Select(v => new VeilingproductKwekerDetailDto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.Status,
                v.Startprijs,
                v.Minimumprijs,
                v.AantalFusten,
                v.VoorraadBloemen,
                v.Plaats,
                v.GeplaatstDatum,
                v.VeilingNr,
                v.ImagePath,
                v.beginDatum
            ))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id} voor deze kweker.", 404))
            : Ok(dto);
    }

    [HttpGet("veilingmeester")]
    [Authorize(Roles = "Veilingmeester")]
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
        var query = BuildFilteredQuery(q, categorieNr, status, minPrice, maxPrice, createdAfter, title, null);

        var items = await query
            .Select(v => new VeilingproductVeilingmeesterListDto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.Status,
                v.VeilingNr,
                v.Kwekernr,
                v.Gebruiker.BedrijfsNaam,
                v.Startprijs,
                v.Minimumprijs
            ))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("veilingmeester/{id:int}")]
    [Authorize(Roles = "Veilingmeester")]
    public async Task<ActionResult<VeilingproductVeilingmeesterDetailDto>> GetVeilingmeesterDetail(int id, CancellationToken ct = default)
    {
        var dto = await _db.Veilingproducten.AsNoTracking()
            .Where(v => v.VeilingProductNr == id)
            .Select(v => new VeilingproductVeilingmeesterDetailDto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.Status,
                v.VeilingNr,
                v.Startprijs,
                v.Minimumprijs,
                v.AantalFusten,
                v.VoorraadBloemen,
                v.Plaats,
                v.GeplaatstDatum,
                v.ImagePath,
                v.Kwekernr,
                v.Gebruiker.BedrijfsNaam
            ))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404))
            : Ok(dto);
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<VeilingproductAdminListDto>>> GetAdmin(
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] ModelStatus? status,
        [FromQuery] int? minPrice,
        [FromQuery] int? maxPrice,
        [FromQuery] DateTime? createdAfter,
        [FromQuery] string? title,
        [FromQuery] int? kwekerNr,
        CancellationToken ct = default)
    {
        var query = BuildFilteredQuery(q, categorieNr, status, minPrice, maxPrice, createdAfter, title, null);

        if (kwekerNr.HasValue)
            query = query.Where(v => v.Kwekernr == kwekerNr.Value);

        var items = await query
            .Select(v => new VeilingproductAdminListDto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.Status,
                v.VeilingNr,
                v.Startprijs,
                v.Minimumprijs,
                v.Plaats,
                v.Kwekernr,
                v.Gebruiker.BedrijfsNaam
            ))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<VeilingproductAdminDetailDto>> GetAdminDetail(int id, CancellationToken ct = default)
    {
        var dto = await _db.Veilingproducten.AsNoTracking()
            .Where(v => v.VeilingProductNr == id)
            .Select(v => new VeilingproductAdminDetailDto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.VeilingNr,
                v.Status,
                v.Startprijs,
                v.Minimumprijs,
                v.AantalFusten,
                v.VoorraadBloemen,
                v.Plaats,
                v.GeplaatstDatum,
                v.ImagePath,
                v.Kwekernr,
                v.Gebruiker.BedrijfsNaam,
                v.Gebruiker.Email!
            ))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404))
            : Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Kweker")]
    public async Task<ActionResult<VeilingproductAdminDetailDto>> Create(
        [FromBody] VeilingproductCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (!await _db.Categorieen.AnyAsync(c => c.CategorieNr == dto.CategorieNr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Categorie bestaat niet.", 400));

        if (!await _db.Gebruikers.AnyAsync(g => g.GebruikerNr == dto.Kwekernr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Kweker bestaat niet.", 400));

        if (User.IsInRole("Kweker") && (!TryGetUserId(out var userId) || userId != dto.Kwekernr))
            return Forbid();

        var entity = new Veilingproduct
        {
            Naam            = dto.Naam.Trim(),
            GeplaatstDatum  = dto.GeplaatstDatum ?? DateTime.UtcNow,
            AantalFusten    = dto.AantalFusten,
            VoorraadBloemen = dto.VoorraadBloemen,
            Startprijs      = dto.Startprijs,
            CategorieNr     = dto.CategorieNr,
            Plaats          = dto.Plaats,
            Minimumprijs    = dto.Minimumprijs,
            Kwekernr        = dto.Kwekernr,
            beginDatum      = dto.beginDatum,
            Status          = ModelStatus.Active,
            ImagePath       = dto.ImagePath
        };

        _db.Veilingproducten.Add(entity);
        await _db.SaveChangesAsync(ct);

        return await GetAdminDetail(entity.VeilingProductNr, ct);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Kweker")]
    public async Task<ActionResult<VeilingproductAdminDetailDto>> Update(
        int id,
        [FromBody] VeilingproductUpdateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404));

        if (User.IsInRole("Kweker") && (!TryGetUserId(out var userId) || entity.Kwekernr != userId))
            return Forbid();

        if (!await _db.Categorieen.AnyAsync(c => c.CategorieNr == dto.CategorieNr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Categorie bestaat niet.", 400));

        if (!await _db.Gebruikers.AnyAsync(g => g.GebruikerNr == dto.Kwekernr, ct))
            return BadRequest(CreateProblemDetails("Ongeldige referentie", "Kweker bestaat niet.", 400));

        entity.Naam            = dto.Naam.Trim();
        entity.GeplaatstDatum  = dto.GeplaatstDatum ?? entity.GeplaatstDatum;
        entity.AantalFusten    = dto.AantalFusten;
        entity.VoorraadBloemen = dto.VoorraadBloemen;
        entity.Startprijs      = dto.Startprijs;
        entity.CategorieNr     = dto.CategorieNr;
        entity.VeilingNr       = dto.VeilingNr;
        entity.Kwekernr        = dto.Kwekernr;
        entity.ImagePath       = dto.ImagePath;
        entity.Minimumprijs    = dto.Minimumprijs;
        entity.Plaats          = dto.Plaats;

        await _db.SaveChangesAsync(ct);

        return await GetAdminDetail(id, ct);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin,Veilingmeester,Kweker")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] VeilingproductStatusUpdateDto dto, CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var entity = await _db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404));

        if (User.IsInRole("Kweker"))
        {
            if (!TryGetUserId(out var userId) || entity.Kwekernr != userId)
                return Forbid();

            if (dto.Status is not (ModelStatus.Inactive or ModelStatus.Deleted))
                return BadRequest(CreateProblemDetails("Ongeldige status", "Kweker mag enkel eigen items (de)activeren of verwijderen.", 400));
        }

        entity.Status = dto.Status;
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPost("{id:int}/mark-sold")]
    [Authorize(Roles = "Admin,Veilingmeester")]
    public async Task<IActionResult> MarkAsSold(int id, CancellationToken ct = default)
    {
        var entity = await _db.Veilingproducten.FindAsync(new object[] { id }, ct);
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veilingproduct met ID {id}.", 404));

        entity.Status = ModelStatus.Archived;
        await _db.SaveChangesAsync(ct);
        return NoContent();
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
        if (int.TryParse(User?.Identity?.Name, out var parsed))
        {
            userId = parsed;
            return true;
        }

        userId = 0;
        return false;
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