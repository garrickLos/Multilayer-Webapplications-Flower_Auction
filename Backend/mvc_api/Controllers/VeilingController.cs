using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
using ApiGetFilters;
using mvc_api.Controllers.Constants;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "VeilingMeester, Koper, Bedrijf")]
public class VeilingController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ProjectieVeilingController _projectie;
    private readonly IVeilingControllerFilter _filter;

    private readonly VeilingUpdate _updateVeiling = new VeilingUpdate();

    private DateTimeWithZone _myDate = new DateTimeWithZone(DateTime.UtcNow, TijdZoneConfig.Amsterdam);

    /// <summary>
    /// Controller voor veilingen: ophalen (per rol), detail ophalen en aanmaken/updaten.
    /// Gebruikt filters + projecties zodat elke rol alleen de juiste data terugkrijgt.
    /// </summary>
    public VeilingController(
        AppDbContext db,
        ProjectieVeilingController projectie,
        IVeilingControllerFilter filter)
    {
        _db = db;
        _projectie = projectie;
        _filter = filter;
    }

    /// <summary>
    /// Haalt veilingen op voor anonieme gebruikers.
    /// Werkt met filters + paginering en werkt eerst veilingen bij die open/gesloten moeten worden.
    /// </summary>
    /// <param name="veilingProduct">Optioneel filter op veilingproduct.</param>
    /// <param name="from">Optioneel: vanaf datum/tijd.</param>
    /// <param name="to">Optioneel: tot datum/tijd.</param>
    /// <param name="onlyActive">Alleen actieve veilingen.</param>
    /// <param name="page">Pagina (start bij 1).</param>
    /// <param name="pageSize">Items per pagina.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Lijst met veilingen (anonymous DTO) + paging headers.</returns>
    // GET: api/Veiling/anonymous
    [HttpGet("anonymous")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetAnonymous(
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var now = _myDate.LocalTime;

        // Update veilingen die eigenlijk open/gesloten moeten zijn op basis van tijd
        var veilingenTeUpdaten = _db.Veiling
            .Where(v =>
                (v.Status != VeilingStatus.Active && v.Begintijd <= now && v.Eindtijd > now) ||
                (v.Status == VeilingStatus.Active && v.Eindtijd <= now));

        if (veilingenTeUpdaten.Any())
        {
            await _updateVeiling.ForEachUpdateProduct(veilingenTeUpdaten, now, _db, ct);
        }

        // Paginering veilig maken
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        // Filters toepassen
        var query = _filter.Apply(veilingProduct, from, to, onlyActive, DateTime.Now);

        // Total count + headers
        var total = await query.CountAsync(ct);
        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        // Paging + sortering
        query = query
            .OrderBy(v => v.Begintijd)
            .ThenBy(v => v.VeilingNr)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        // Projectie voor anonymous view
        var items = await _projectie
            .ProjectToVeiling_anonymousDto(query, now)
            .ToListAsync(ct);

        return Ok(items);
    }

    /// <summary>
    /// Haalt veilingen op voor veilingmeesters.
    /// Zelfde filtering/paging als anonymous, maar met uitgebreide DTO (incl. biedingen).
    /// </summary>
    /// <param name="veilingProduct">Optioneel filter op veilingproduct.</param>
    /// <param name="from">Optioneel: vanaf datum/tijd.</param>
    /// <param name="to">Optioneel: tot datum/tijd.</param>
    /// <param name="onlyActive">Alleen actieve veilingen.</param>
    /// <param name="page">Pagina (start bij 1).</param>
    /// <param name="pageSize">Items per pagina.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Lijst met veilingen voor veilingmeester + paging headers.</returns>
    [HttpGet("VeilingMeester")]
    [Authorize(Roles = "VeilingMeester")]
    public async Task<ActionResult<IEnumerable<object>>> GetVeilingMeester(
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var now = _myDate.LocalTime;

        // Veilingen updaten op basis van tijd
        var veilingenTeUpdaten = _db.Veiling
            .Where(v =>
                (v.Status != VeilingStatus.Active && v.Begintijd <= now && v.Eindtijd > now) ||
                (v.Status == VeilingStatus.Active && v.Eindtijd <= now));

        if (veilingenTeUpdaten.Any())
        {
            await _updateVeiling.ForEachUpdateProduct(veilingenTeUpdaten, now, _db, ct);
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _filter.Apply(veilingProduct, from, to, onlyActive, DateTime.Now);

        var total = await query.CountAsync(ct);
        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        query = query
            .OrderBy(v => v.Begintijd)
            .ThenBy(v => v.VeilingNr)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        // Extra check (role staat al op de endpoint, maar dit houdt het consistent)
        if (User.Identity.IsAuthenticated && User.IsInRole("VeilingMeester"))
        {
            var items = await _projectie
                .ProjectToVeiling_VeilingMeesterDto(query, now)
                .ToListAsync(ct);

            return Ok(items);
        }

        return Unauthorized();
    }

    /// <summary>
    /// Haalt veilingen op voor een koper.
    /// Gebruikt klant-projectie zodat de koper de juiste details ziet.
    /// </summary>
    /// <param name="veilingProduct">Optioneel filter op veilingproduct.</param>
    /// <param name="from">Optioneel: vanaf datum/tijd.</param>
    /// <param name="to">Optioneel: tot datum/tijd.</param>
    /// <param name="onlyActive">Alleen actieve veilingen.</param>
    /// <param name="page">Pagina (start bij 1).</param>
    /// <param name="pageSize">Items per pagina.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Lijst met veilingen voor koper + paging headers.</returns>
    [HttpGet("klant")]
    [Authorize(Roles = "Koper")]
    public async Task<ActionResult<IEnumerable<object>>> GetKlant(
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var now = _myDate.LocalTime;

        // Veilingen updaten op basis van tijd
        var veilingenTeUpdaten = _db.Veiling
            .Where(v =>
                (v.Status != VeilingStatus.Active && v.Begintijd <= now && v.Eindtijd > now) ||
                (v.Status == VeilingStatus.Active && v.Eindtijd <= now));

        if (veilingenTeUpdaten.Any())
        {
            await _updateVeiling.ForEachUpdateProduct(veilingenTeUpdaten, now, _db, ct);
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _filter.Apply(veilingProduct, from, to, onlyActive, DateTime.Now);

        var total = await query.CountAsync(ct);
        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        query = query
            .OrderBy(v => v.Begintijd)
            .ThenBy(v => v.VeilingNr)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        if (User.Identity.IsAuthenticated)
        {
            var items = await _projectie
                .ProjectToVeiling_klantDto(query, now)
                .ToListAsync(ct);

            return Ok(items);
        }

        return Unauthorized();
    }

    /// <summary>
    /// Haalt één veiling op via ID.
    /// Gebruikt klant-projectie voor detailweergave.
    /// </summary>
    /// <param name="id">Veiling ID.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Veiling DTO of 404.</returns>
    // GET: api/Veiling/{id}
    [HttpGet("{id:int}")]
    [Authorize(Roles = "VeilingMeester, Koper, Bedrijf")]
    public async Task<ActionResult<VeilingMeester_VeilingDto>> GetById(int id, CancellationToken ct = default)
    {
        var now = _myDate.LocalTime;

        var query = _db.Veiling.AsNoTracking().AsQueryable();

        var item = await _projectie
            .ProjectToVeiling_klantDto(query, now)
            .Where(x => x.VeilingNr == id)
            .FirstOrDefaultAsync(ct);

        if (item is null)
        {
            return NotFound(Problem("Geen veiling gevonden met dit ID.", statusCode: 404, title: "Niet Gevonden"));
        }

        if (User.Identity.IsAuthenticated)
        {
            return Ok(item);
        }

        return Unauthorized();
    }

    /// <summary>
    /// Maakt een nieuwe veiling aan (alleen veilingmeester).
    /// Valideert de begin/eindtijd en zet de status standaard op Inactive.
    /// </summary>
    /// <param name="dto">Nieuwe veiling gegevens.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>201 Created met de aangemaakte veiling.</returns>
    // POST: api/Veiling
    [HttpPost]
    [Authorize(Roles = "VeilingMeester")]
    public async Task<ActionResult<VeilingCreateDto>> Create([FromBody] VeilingCreateDto dto, CancellationToken ct = default)
    {
        var now = _myDate.LocalTime;

        var timeValidation = ValidateVeilingTimes(dto.Begintijd, dto.Eindtijd, now);
        if (timeValidation is not null)
            return timeValidation;

        var entity = new Veiling
        {
            VeilingNaam = dto.VeilingNaam,
            Begintijd = dto.Begintijd,
            Eindtijd = dto.Eindtijd,
            Status = VeilingStatus.Inactive
        };

        _db.Veiling.Add(entity);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch
        {
            return StatusCode(500, CreateProblemDetails(
                "Opslagfout",
                "Er is een fout opgetreden bij het opslaan van de Veiling.",
                500));
        }

        var resultDto = new Klant_VeilingDto
        {
            VeilingNr = entity.VeilingNr,
            VeilingNaam = entity.VeilingNaam,
            Begintijd = entity.Begintijd,
            Eindtijd = entity.Eindtijd,
            Status = entity.Status,
        };

        return CreatedAtAction(nameof(GetById), new { id = entity.VeilingNr }, resultDto);
    }

    /// <summary>
    /// Past een bestaande veiling aan (alleen veilingmeester).
    /// Controleert of de veiling bestaat en valideert de tijden.
    /// </summary>
    /// <param name="id">Veiling ID.</param>
    /// <param name="dto">Nieuwe waarden voor naam/begin/eindtijd.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>De bijgewerkte veiling gegevens.</returns>
    // PUT: api/Veiling/{id}
    [HttpPut("{id:int}")]
    [Authorize(Roles = "VeilingMeester")]
    public async Task<ActionResult<VeilingMeester_VeilingDto>> Update(int id, [FromBody] VeilingUpdateDto dto, CancellationToken ct = default)
    {
        var now = _myDate.LocalTime;

        var entity = await _db.Veiling.FindAsync(new object[] { id }, ct);

        if (entity is null)
            return NotFound(($"Geen veiling met ID {id}.", statusCode: 404, title: "Niet gevonden"));

        var timeValidation = ValidateVeilingTimes(dto.Begintijd, dto.Eindtijd, now);
        if (timeValidation is not null)
            return timeValidation;

        entity.VeilingNaam = dto.VeilingNaam ?? entity.VeilingNaam;
        entity.Begintijd = dto.Begintijd;
        entity.Eindtijd = dto.Eindtijd;
        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            entity.Status = dto.Status;
        }

        await _db.SaveChangesAsync(ct);

        var resultDto = new VeilingMeester_VeilingDto
        {
            VeilingNr = entity.VeilingNr,
            VeilingNaam = entity.VeilingNaam,
            Begintijd = entity.Begintijd,
            Eindtijd = entity.Eindtijd,
            Status = entity.Status
        };

        return Ok(resultDto);
    }

    /// <summary>
    /// Laat een koper een nieuwe (geupdate) begintijd doorgeven voor een veiling.
    /// Past ook de status aan als de nieuwe begintijd de veiling onlogisch maakt t.o.v. eindtijd.
    /// </summary>
    /// <param name="id">Veiling ID.</param>
    /// <param name="dto">Nieuwe begintijd.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>De opgeslagen begintijd update.</returns>
    [HttpPut("UpdateBeginTijd/{id:int}")]
    [Authorize(Roles = "Koper")]
    public async Task<ActionResult<VeilingUpdate_UpdateVeilingTijd>> Update_NieuweBeginTijd(
        int id,
        [FromBody] VeilingUpdate_UpdateVeilingTijd dto,
        CancellationToken ct = default)
    {
        var entity = await _db.Veiling.FindAsync(new object[] { id }, ct);

        if (entity is null)
            return NotFound(Problem($"Geen veiling met ID {id}.", statusCode: 404, title: "Niet gevonden"));

        entity.GeupdateBeginTijd = dto.GeupdateBeginTijd;

        // Business rule: als de nieuwe begintijd ná (of gelijk aan) eindtijd ligt en hij was active -> zet inactive
        if (entity.Eindtijd <= dto.GeupdateBeginTijd && entity.Status == VeilingStatus.Active)
            entity.Status = VeilingStatus.Inactive;

        await _db.SaveChangesAsync(ct);

        return Ok(dto);
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

    /// <summary>
    /// Valideert de begin/eindtijd van een veiling:
    /// - start mag niet in het verleden liggen
    /// - eindtijd moet dezelfde datum hebben
    /// - duur moet precies 1, 2 of 3 uur zijn
    /// </summary>
    /// <param name="begintijd">Starttijd van de veiling.</param>
    /// <param name="eindtijd">Eindtijd van de veiling.</param>
    /// <param name="now">Huidige tijd (voor "in het verleden" check).</param>
    /// <returns>BadRequest als ongeldig, anders null.</returns>
    private ActionResult? ValidateVeilingTimes(DateTime begintijd, DateTime eindtijd, DateTime now)
    {
        if (begintijd < now)
        {
            return BadRequest(CreateProblemDetails(
                "Starttijd in het verleden",
                "De starttijd mag niet in het verleden liggen.",
                400));
        }

        if (eindtijd.Date != begintijd.Date)
        {
            return BadRequest(CreateProblemDetails(
                "Ongeldige eindtijd",
                "De eindtijd moet op dezelfde datum vallen als de starttijd.",
                400));
        }

        var durationMinutes = (eindtijd - begintijd).TotalMinutes;
        if (durationMinutes != 60 && durationMinutes != 120 && durationMinutes != 180)
        {
            return BadRequest(CreateProblemDetails(
                "Ongeldige eindtijd",
                "De eindtijd moet exact 1, 2 of 3 uur na de starttijd liggen.",
                400));
        }

        return null;
    }
}
