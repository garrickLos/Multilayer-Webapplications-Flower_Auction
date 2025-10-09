using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;

namespace mvc_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class GebruikerController : ControllerBase
    {
        private readonly AppDbContext _db;
        public GebruikerController(AppDbContext db) => _db = db;

        // GET: api/Gebruiker
        // Optioneel: ?q=jan&page=1&pageSize=50 (pageSize max 200)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll(
            [FromQuery] string? q,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken ct = default)
        {
            if (page < 1) page = 1;
            pageSize = Math.Clamp(pageSize, 1, 200);

            var query = _db.Gebruikers.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                query = query.Where(g => g.Naam.Contains(term) || g.Email.Contains(term));
            }

            var total = await query.CountAsync(ct);

            var data = await query
                .OrderBy(g => g.Naam)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(g => new
                {
                    g.GebruikerNr,
                    g.Naam,
                    g.Email,
                    g.Soort
                })
                .ToListAsync(ct);

            Response.Headers["X-Total-Count"] = total.ToString();
            return Ok(data);
        }

        // GET: api/Gebruiker/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<object>> GetById(int id, CancellationToken ct = default)
        {
            var gebruiker = await _db.Gebruikers
                .AsNoTracking()
                .Where(x => x.GebruikerNr == id)
                .Select(g => new
                {
                    g.GebruikerNr,
                    g.Naam,
                    g.Email,
                    g.Soort,
                    g.LaatstIngelogd,
                    g.Kvk,
                    g.StraatAdres,
                    g.Postcode,
                    g.Assortiment,
                    g.PersoneelsNr,
                    Biedingen = g.Biedingen!
                        .OrderByDescending(b => b.BiedNr)
                        .Select(b => new
                        {
                            b.BiedNr,
                            b.BedragPerFust,
                            b.AantalStuks,
                            b.VeilingNr
                        })
                })
                .FirstOrDefaultAsync(ct);

            if (gebruiker is null)
                return NotFound(new { Message = $"Geen gebruiker gevonden met ID {id}." });

            return Ok(gebruiker);
        }
    }
}
