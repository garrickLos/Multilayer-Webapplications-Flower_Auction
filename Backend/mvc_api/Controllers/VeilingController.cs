using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
using ApiGetFilters;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize (Roles = "VeilingMeester, Koper, Bedrijf")]
public class VeilingController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ProjectieVeilingController _projectie;
    private readonly IVeilingControllerFilter _filter;

    public VeilingController(
        AppDbContext db,
        ProjectieVeilingController projectie,
        IVeilingControllerFilter filter)
    {
        _db = db;
        _projectie = projectie;
        _filter = filter;
    }
    
    // GET: api/Veiling
    [HttpGet("anonymous")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetAnonymous(
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        DateTime? testNow = null,
        CancellationToken ct = default)
    {
        var now = testNow ?? DateTime.UtcNow;

        var veilingenTeUpdaten = _db.Veilingen
        .Where(v => 
            // Scenario A: Moet open gaan
            (v.Status != VeilingStatus.Active && v.Begintijd <= now && v.Eindtijd > now) 
            || 
            // Scenario B: Moet sluiten
            (v.Status == VeilingStatus.Active && v.Eindtijd <= now)
        );

        if (veilingenTeUpdaten.Any())
        {
            foreach (var v in veilingenTeUpdaten)
            {
                // Check opnieuw per item wat er moet gebeuren
                if (now >= v.Eindtijd)
                {
                    // Tijd is voorbij -> Sluiten
                    v.Status = VeilingStatus.Inactive;
                }
                else if (now >= v.Begintijd && now < v.Eindtijd)
                {
                    v.Status = VeilingStatus.Active;
                }
            }
            // Sla alle wijzigingen in één keer op
            await _db.SaveChangesAsync(ct);
        }
        
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _filter.Apply(veilingProduct, from, to, onlyActive, DateTime.Now);
        
        // --- Count & Paging ---
        var total = await query.CountAsync(ct);
        
        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        query = query
                .OrderBy(v => v.Begintijd)
                .ThenBy(v => v.VeilingNr)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);
                
        // --- Projectie & Execution ---
        var items = await _projectie
            .ProjectToVeiling_anonymousDto(query,now) //roept de data op van een niet ingelogde persoon.
            .ToListAsync(ct);

        return Ok(items); 
    }

    [HttpGet("VeilingMeester")]
    [Authorize (Roles="VeilingMeester")]
    public async Task<ActionResult<IEnumerable<object>>> GetVeilingMeester(

        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        DateTime? testNow = null,
        CancellationToken ct = default)
    {
        var now = testNow ?? DateTime.UtcNow;

        // if (testNow == null)
        // {
        //     now = now.ToLocalTime();
        // }

        var veilingenTeUpdaten = _db.Veilingen
        .Where(v => 
            // Scenario A: Moet open gaan
            (v.Status != VeilingStatus.Active && v.Begintijd <= now && v.Eindtijd > now) 
            || 
            // Scenario B: Moet sluiten
            (v.Status == VeilingStatus.Active && v.Eindtijd <= now)
        );

        if (veilingenTeUpdaten.Any())
        {
            foreach (var v in veilingenTeUpdaten)
            {
                // Check opnieuw per item wat er moet gebeuren
                if (v.Eindtijd <= now)
                {
                    // Tijd is voorbij -> Sluiten
                    v.Status = VeilingStatus.Inactive;
                }
                else if (v.Begintijd <= now && v.Eindtijd > now)
                {
                    // Tijd is bezig -> Openen
                    v.Status = VeilingStatus.Active;
                }
            }
            // Sla alle wijzigingen in één keer op
            await _db.SaveChangesAsync(ct);
        }
        
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);
        
        var query = _filter.Apply(veilingProduct, from, to, onlyActive, DateTime.Now);
        
        // --- Count & Paging ---
        var total = await query.CountAsync(ct);
        
        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        query = query
                .OrderBy(v => v.Begintijd)
                .ThenBy(v => v.VeilingNr)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            // --- Projectie & Execution ---
        if (User.Identity.IsAuthenticated && User.IsInRole("VeilingMeester"))
        {
            var items = await _projectie
            .ProjectToVeiling_VeilingMeesterDto(query, now) // Roept de meester helper methode op zodat het de juiste gegevens laat zien
            .ToListAsync(ct);

            return Ok(items);   
        } else
        {
            return Unauthorized();
        }      
    }

    [HttpGet("klant")]
    [Authorize (Roles ="Koper")]
    public async Task<ActionResult<IEnumerable<object>>> GetKlant(

        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        now = now.ToLocalTime();

        var veilingenTeUpdaten = _db.Veilingen
        .Where(v => 
            // Scenario A: Moet open gaan
            (v.Status != VeilingStatus.Active && v.Begintijd <= now && v.Eindtijd > now) 
            || 
            // Scenario B: Moet sluiten
            (v.Status == VeilingStatus.Active && v.Eindtijd <= now)
        );

        if (veilingenTeUpdaten.Any())
        {
            foreach (var v in veilingenTeUpdaten)
            {
                // Check opnieuw per item wat er moet gebeuren
                if (now >= v.Eindtijd)
                {
                    // Tijd is voorbij -> Sluiten
                    v.Status = VeilingStatus.Inactive;
                }
                else if (now >= v.Begintijd && now < v.Eindtijd)
                {
                    v.Status = VeilingStatus.Active;
                }
            }
            // Sla alle wijzigingen in één keer op
            await _db.SaveChangesAsync(ct);
        }
        
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _filter.Apply(veilingProduct, from, to, onlyActive, DateTime.Now);
        
        // --- Count & Paging ---
        var total = await query.CountAsync(ct);
        
        Response.Headers.Append("X-Total-Count", total.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        query = query
                .OrderBy(v => v.Begintijd)
                .ThenBy(v => v.VeilingNr)
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

            // --- Projectie & Execution ---
        if (User.Identity.IsAuthenticated)
        {
            var items = await _projectie
                .ProjectToVeiling_klantDto(query, now) // Roept de klant helper methode op zodat het de juiste gegevens laat zien
                .ToListAsync(ct);

            return Ok(items);   
        } else
        {
            return Unauthorized();
        }
        
    }

    // GET: api/Veiling/{id}
    [HttpGet("{id:int}")]
    [Authorize (Roles ="VeilingMeester, Koper, Bedrijf")]
    public async Task<ActionResult<VeilingMeester_VeilingDto>> GetById(
        int id, 
        CancellationToken ct = default)
    {

        var now = DateTime.UtcNow;

        now = now.ToLocalTime();

        var query = _db.Veilingen.AsNoTracking()
            .AsQueryable();

        var item = await _projectie
            .ProjectToVeiling_klantDto(query, now)
            .Where(x => x.VeilingNr == id)
            .FirstOrDefaultAsync(ct);

        if (item is null)
        {
            // Gebruik standaard ProblemDetails responses
            return NotFound(Problem("Geen veiling gevonden met dit ID.", statusCode: 404, title: "Niet Gevonden"));
        }

        if (User.Identity.IsAuthenticated)
        {
            return Ok(item);   
        } else
        {
            return Unauthorized();
        }
    }

    // POST: api/Veiling
    [HttpPost]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<ActionResult<VeilingCreateDto>> Create(
        [FromBody] VeilingCreateDto dto,
        DateTime? testNow = null,

        CancellationToken ct = default)
    {

        var now = testNow ?? DateTime.UtcNow;

        // Validatie van [Required] gebeurt automatisch door [ApiController]
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

        _db.Veilingen.Add(entity);

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

    // PUT: api/Veiling/{id}
    [HttpPut("{id:int}")]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<ActionResult<VeilingUpdateDto>> Update(
        int id,
        [FromBody] VeilingUpdateDto dto,
        DateTime? testNow = null,
        CancellationToken ct = default)
    {
        var now = testNow ?? DateTime.UtcNow;

        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        
        if (entity is null)
            return NotFound(($"Geen veiling met ID {id}.", statusCode: 404, title: "Niet gevonden"));

        var timeValidation = ValidateVeilingTimes(dto.Begintijd, dto.Eindtijd, now);
        if (timeValidation is not null)
            return timeValidation;

        // Update fields
        entity.VeilingNaam = dto.VeilingNaam ?? entity.VeilingNaam;
        entity.Begintijd = dto.Begintijd;
        entity.Eindtijd = dto.Eindtijd;

        // if (!string.IsNullOrWhiteSpace(dto.Status))
        //     entity.Status = NormalizeStatus(dto.Status);

        // Business Logic check
        if (entity.Eindtijd <= now && entity.Status == VeilingStatus.Active)
            entity.Status = VeilingStatus.Inactive;

        await _db.SaveChangesAsync(ct);

        var resultDto = new VeilingUpdateDto
            {
                VeilingNaam = entity.VeilingNaam,
                Begintijd = entity.Begintijd,
                Eindtijd = entity.Eindtijd,
            };

        return Ok(resultDto);
    }

    // DELETE: api/Veiling/{id}
    //verwijderd ook alle producten die in de veiling zitten (mss handig om een softdelete te gebruiken)
    [HttpDelete("{id:int}")]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        _db.Veilingen.Remove(entity);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
    {
        Title    = title,
        Detail   = detail,
        Status   = statusCode,
        Instance = HttpContext?.Request?.Path
    };

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
