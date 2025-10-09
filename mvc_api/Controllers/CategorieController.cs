using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;

namespace mvc_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class CategorieController : ControllerBase
    {
        private readonly AppDbContext _db;
        public CategorieController(AppDbContext db) => _db = db;

        // GET: api/Categorie
        // Optioneel: ?q=roos&page=1&pageSize=50 (pageSize max 200)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll(
            [FromQuery] string? q,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken ct = default)
        {
            if (page < 1) page = 1;
            pageSize = Math.Clamp(pageSize, 1, 200);

            var query = _db.Categorieen.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                query = query.Where(c => c.Naam.Contains(term));
            }

            var total = await query.CountAsync(ct);

            var data = await query
                .OrderBy(c => c.Naam)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.CategorieNr,
                    c.Naam
                })
                .ToListAsync(ct);

            Response.Headers["X-Total-Count"] = total.ToString();
            return Ok(data);
        }

        // GET: api/Categorie/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<object>> GetById(int id, CancellationToken ct = default)
        {
            var categorie = await _db.Categorieen
                .AsNoTracking()
                .Where(x => x.CategorieNr == id)
                .Select(c => new { c.CategorieNr, c.Naam })
                .FirstOrDefaultAsync(ct);

            if (categorie is null)
                return NotFound(new { Message = $"Geen categorie gevonden met ID {id}." });

            return Ok(categorie);
        }
    }
}
