using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class BiedingController : ControllerBase
    {
        private readonly AppDbContext _db;
        public BiedingController(AppDbContext db) => _db = db;

        // GET: api/Bieding
        // Optionele filters: ?gebruikerNr=2&veilingNr=101
        // Optionele paginering: ?page=1&pageSize=50 (max 200)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll(
            [FromQuery] int? gebruikerNr,
            [FromQuery] int? veilingNr,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken ct = default)
        {
            if (page < 1) page = 1;
            pageSize = Math.Clamp(pageSize, 1, 200);

            var q = _db.Biedingen.AsNoTracking().AsQueryable();

            if (gebruikerNr.HasValue)
                q = q.Where(b => b.GebruikerNr == gebruikerNr.Value);

            if (veilingNr.HasValue)
                q = q.Where(b => b.VeilingNr == veilingNr.Value);

            var total = await q.CountAsync(ct);

            var data = await q
                .OrderByDescending(b => b.BiedNr)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new
                {
                    b.BiedNr,
                    b.BedragPerFust,
                    b.AantalStuks,
                    b.GebruikerNr,
                    b.VeilingNr
                })
                .ToListAsync(ct);

            Response.Headers["X-Total-Count"] = total.ToString();
            return Ok(data);
        }

        // GET: api/Bieding/1001
        [HttpGet("{id:int}")]
        public async Task<ActionResult<object>> GetById(int id, CancellationToken ct = default)
        {
            var b = await _db.Biedingen
                .AsNoTracking()
                .Where(x => x.BiedNr == id)
                .Select(x => new
                {
                    x.BiedNr,
                    x.BedragPerFust,
                    x.AantalStuks,
                    x.GebruikerNr,
                    x.VeilingNr
                })
                .FirstOrDefaultAsync(ct);

            if (b is null)
                return NotFound(new { Message = $"Geen bieding gevonden met ID {id}." });

            return Ok(b);
        }

        // POST: api/Bieding
        [HttpPost]
        public async Task<ActionResult<object>> Create([FromBody] BiedingCreateDto dto, CancellationToken ct = default)
        {
            // FK-validaties (extra defensief, hoewel DB FKs het ook afdwingen)
            var gebruikerBestaat = await _db.Gebruikers.AnyAsync(g => g.GebruikerNr == dto.GebruikerNr, ct);
            if (!gebruikerBestaat) return BadRequest("Gebruiker bestaat niet.");

            var veilingBestaat = await _db.Veilingproducten.AnyAsync(v => v.VeilingNr == dto.VeilingNr, ct);
            if (!veilingBestaat) return BadRequest("Veilingproduct bestaat niet.");

            var entity = new Bieding
            {
                // PK (BiedNr) wordt door DB gezet
                BedragPerFust = dto.BedragPerFust,
                AantalStuks = dto.AantalStuks,
                GebruikerNr = dto.GebruikerNr,
                VeilingNr = dto.VeilingNr
            };

            _db.Biedingen.Add(entity);
            await _db.SaveChangesAsync(ct);

            // Retourneer dezelfde shape als GetById
            var result = new
            {
                entity.BiedNr,
                entity.BedragPerFust,
                entity.AantalStuks,
                entity.GebruikerNr,
                entity.VeilingNr
            };

            return CreatedAtAction(nameof(GetById), new { id = entity.BiedNr }, result);
        }

        // PUT: api/Bieding/1001
        [HttpPut("{id:int}")]
        public async Task<ActionResult<object>> Update(int id, [FromBody] BiedingUpdateDto dto, CancellationToken ct = default)
        {
            var b = await _db.Biedingen.FindAsync(new object[] { id }, ct);
            if (b is null) return NotFound(new { Message = $"Geen bieding gevonden met ID {id}." });

            b.BedragPerFust = dto.BedragPerFust;
            b.AantalStuks = dto.AantalStuks;

            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                b.BiedNr,
                b.BedragPerFust,
                b.AantalStuks,
                b.GebruikerNr,
                b.VeilingNr
            });
        }

        // DELETE: api/Bieding/1001
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
        {
            var b = await _db.Biedingen.FindAsync(new object[] { id }, ct);
            if (b is null) return NotFound(new { Message = $"Geen bieding gevonden met ID {id}." });

            _db.Biedingen.Remove(b);
            await _db.SaveChangesAsync(ct);

            return NoContent();
        }
    }
}
