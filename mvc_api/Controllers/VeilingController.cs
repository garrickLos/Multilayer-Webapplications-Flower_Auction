using System.ComponentModel.Design;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using mvc_api.Data;
using mvc_api.Models;
using SQLitePCL;

namespace mvc_api.Controllers;

// Constants kunnen hier, of nog beter in een globale 'Constants.cs'
public static class VeilingStatus
{
    public const string Active = "active";
    public const string Inactive = "inactive";
    public const string Sold = "sold";
}



[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class VeilingController : ControllerBase
{
    private readonly AppDbContext _db;

    public VeilingController(AppDbContext db) => _db = db;

    public sealed record VDetail(
        int VeilingNr,
        string VeilingNaam,
        DateTime Begintijd,
        DateTime Eindtijd,
        string Status
    );

    // GET: api/Veiling
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VeilingMeester_VeilingDto>>> GetAll(
        /* rol is tijdelijk, Zorgt ervoor dat we even makkelijk zonder het rollen systeem de api kunnen laten werken door 
        bij de api een '?rol=VeilingMeester' of een andere rol te plaatsen om de goede data te krijgen
        enige wat dan wel nog moet is dat die rol moet worden aangemaakt of het krijgt de standaar no rol info
        */
        [FromQuery] string? rol, // dit is tijdelijk om een rolsysteem erin te bouwen die verschillende dto's laat zien op basis van de rol
        [FromQuery] int? veilingProduct,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] bool onlyActive = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _db.Veilingen.AsNoTracking()
            .AsQueryable();

        var now = DateTime.UtcNow;

        // --- Filtering ---
        if (veilingProduct.HasValue)
            query = query.Where(v => v.Veilingproducten.Any(p => p.VeilingProductNr == veilingProduct.Value));

        if (from.HasValue)
            query = query.Where(v => v.Begintijd >= from.Value);

        if (to.HasValue)
            query = query.Where(v => v.Eindtijd <= to.Value);

        if (onlyActive)
            query = query.Where(v => v.Status == VeilingStatus.Active && v.Eindtijd > now);

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

        if (rol == "VeilingMeester")
        {
            // --- Projectie & Execution ---
            var items = await query
                .ProjectToVeiling_VeilingMeesterDto(now) // Roept de meester helper methode op zodat het de juiste gegevens laat zien
                .ToListAsync(ct);

            return Ok(items); 
        } 
        else
        {
            // --- Projectie & Execution ---
            var items = await query
                .ProjectToReadDto(now) // Roept de andere helper methode aan zodat het Alleen de basis laat zien
                .ToListAsync(ct);

            return Ok(items);
        } 
    }

    // GET: api/Veiling/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<VeilingMeester_VeilingDto>> GetById(
        int id, 
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        
        var dto = await _db.Veilingen.AsNoTracking()
            .Where(x => x.VeilingNr == id)
            .ProjectToReadDto(now)
            .FirstOrDefaultAsync(ct);

        if (dto is null)
        {
            // Gebruik standaard ProblemDetails responses
            return NotFound(Problem("Geen veiling gevonden met dit ID.", statusCode: 404, title: "Niet Gevonden"));
        }

        return Ok(dto);
    }

    // POST: api/Veiling
    [HttpPost]
    public async Task<ActionResult<VeilingCreateDto>> Create(
        [FromBody] VeilingCreateDto dto, 
        CancellationToken ct = default)
    {
        // Validatie van [Required] gebeurt automatisch door [ApiController]
        var now = DateTime.UtcNow;

        var entity = new Veiling
        {
            VeilingNaam = dto.VeilingNaam,
            Begintijd = dto.Begintijd,
            Eindtijd = dto.Eindtijd,
            Status = NormalizeStatus(dto.Status)
        };

        if (entity.Eindtijd <= now) 
        {
            entity.Status = VeilingStatus.Inactive;
        }

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
    public async Task<ActionResult<VeilingUpdateDto>> Update(
        int id, 
        [FromBody] VeilingUpdateDto dto, 
        CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        
        if (entity is null)
            return NotFound(Problem($"Geen veiling met ID {id}.", statusCode: 404, title: "Niet gevonden"));

        // Update fields
        entity.VeilingNaam = dto.VeilingNaam;
        entity.Begintijd = dto.Begintijd;
        entity.Eindtijd = dto.Eindtijd;

        // if (!string.IsNullOrWhiteSpace(dto.Status))
        //     entity.Status = NormalizeStatus(dto.Status);

        // Business Logic check
        var now = DateTime.UtcNow;
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
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var entity = await _db.Veilingen.FindAsync(new object[] { id }, ct);
        
        if (entity is null)
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen veiling met ID {id}.", 404));

        _db.Veilingen.Remove(entity);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private static string NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return VeilingStatus.Inactive;

        return status.Trim().ToLowerInvariant() switch
        {
            VeilingStatus.Active => VeilingStatus.Active,
            VeilingStatus.Sold => VeilingStatus.Sold,
            _ => VeilingStatus.Inactive
        };
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

// dit zijn de Dto projecties die worden opgehaald voor de data die nodig is. 
// de ProjectToReadDto is voor de standaard en niet ingelogde gebruiker
// de projectToMeesterDto is voor het ophalen van meerdere gegevens voor de veilingsMeester
public static class VeilingExtensions
{
    // Projectie voor Gasten
    public static IQueryable<Klant_VeilingDto> ProjectToReadDto(
        this IQueryable<Veiling> query, DateTime now)
    {
        return query.Select(v => new Klant_VeilingDto
        {
            VeilingNr = v.VeilingNr,
            VeilingNaam = v.VeilingNaam,
            Begintijd = v.Begintijd,
            Eindtijd = v.Eindtijd,

            Status = (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                ? VeilingStatus.Sold
                : (v.Eindtijd <= now 
                    ? VeilingStatus.Inactive 
                    : (v.Begintijd <= now 
                        ? VeilingStatus.Active
                        : VeilingStatus.Inactive)),
            
            Producten = v.Veilingproducten.Select(p => new VeilingProductDto(
                p.VeilingProductNr,
                p.Naam,
                p.Startprijs,
                p.VoorraadBloemen,
                p.ImagePath
            ))
        });
    }

    // Projectie voor Veilingmeesters
    public static IQueryable<VeilingMeester_VeilingDto> ProjectToVeiling_VeilingMeesterDto(
        this IQueryable<Veiling> query, DateTime now)
    {
        return query.Select(v => new VeilingMeester_VeilingDto
        {
            VeilingNr       = v.VeilingNr,
            VeilingNaam     = v.VeilingNaam,
            Begintijd       = v.Begintijd,
            Eindtijd        = v.Eindtijd,

            Status = (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                ? VeilingStatus.Sold
                : (v.Eindtijd <= now 
                    ? VeilingStatus.Inactive
                    : (v.Begintijd <= now 
                        ? VeilingStatus.Active
                        : VeilingStatus.Inactive)),

            Producten = v.Veilingproducten.Select(p => new VeilingProductDto(
                p.VeilingProductNr,
                p.Naam,
                p.Startprijs,
                p.VoorraadBloemen,
                p.ImagePath
            )).ToList(),

            Biedingen = v.Biedingen.Select(b => new VeilingMeester_BiedingDto
            {
                // Eigen properties van VeilingMeester_BiedingDto
                BiedingNr = b.BiedNr,
                VeilingNr = b.VeilingNr, // Of v.VeilingNr, afhankelijk van je database relatie
                VeilingProductNr = b.VeilingproductNr,

                // Properties geërfd van BaseBieding_Dto
                AantalStuks = b.AantalStuks,
                GebruikerNr = b.GebruikerNr,
                BedragPerFust = b.BedragPerFust
            }).ToList(),
        });
    }
}