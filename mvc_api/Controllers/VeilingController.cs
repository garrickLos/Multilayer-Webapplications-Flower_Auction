using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;

namespace mvc_api.Controllers
{
    // API-controller voor veilingen en hun bijbehorende veilingproducten.
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class VeilingController : ControllerBase
    {
        private readonly AppDbContext _db;
        public VeilingController(AppDbContext db) => _db = db;

        // GET: api/Veiling
        // Optionele filters:
        //   ?veilingProduct=101
        //   ?from=09:00:00&to=11:00:00   (TimeSpan, HH:mm:ss)
        // Optionele paginering:
        //   ?page=1&pageSize=50 (pageSize max 200)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll(
            [FromQuery] int? veilingProduct,
            [FromQuery] TimeSpan? from,
            [FromQuery] TimeSpan? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken ct = default)
        {
            if (page < 1) page = 1;
            pageSize = Math.Clamp(pageSize, 1, 200);

            var query = _db.Veilingen.AsNoTracking().AsQueryable();

            if (veilingProduct.HasValue)
                query = query.Where(v => v.VeilingProduct == veilingProduct.Value);

            if (from.HasValue)
                query = query.Where(v => !v.Begintijd.HasValue || v.Begintijd.Value >= from.Value);

            if (to.HasValue)
                query = query.Where(v => !v.Eindtijd.HasValue || v.Eindtijd.Value <= to.Value);

            var total = await query.CountAsync(ct);

            var data = await query
                .OrderBy(v => v.Begintijd)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(v => new
                {
                    v.VeilingNr,
                    v.Begintijd,
                    v.Eindtijd,
                    Product = v.Veilingproduct == null ? null : new
                    {
                        v.Veilingproduct.VeilingNr,
                        v.Veilingproduct.Naam,
                        v.Veilingproduct.Startprijs,
                        v.Veilingproduct.Voorraad
                    }
                })
                .ToListAsync(ct);

            Response.Headers["X-Total-Count"] = total.ToString();
            return Ok(data);
        }

        // GET: api/Veiling/{id}
        // Haalt één specifieke veiling op.
        [HttpGet("{id:int}")]
        public async Task<ActionResult<object>> GetById(int id, CancellationToken ct = default)
        {
            var v = await _db.Veilingen
                .AsNoTracking()
                .Where(x => x.VeilingNr == id)
                .Select(x => new
                {
                    x.VeilingNr,
                    x.Begintijd,
                    x.Eindtijd,
                    Product = x.Veilingproduct == null ? null : new
                    {
                        x.Veilingproduct.VeilingNr,
                        x.Veilingproduct.Naam,
                        x.Veilingproduct.Startprijs,
                        x.Veilingproduct.Voorraad
                    }
                })
                .FirstOrDefaultAsync(ct);

            if (v is null)
                return NotFound(new { Message = $"Geen veiling gevonden met ID {id}." });

            // Als er geen product is, geef dat helder terug (compatibel met je huidige shape)
            if (v.Product is null)
            {
                return Ok(new
                {
                    v.VeilingNr,
                    v.Begintijd,
                    v.Eindtijd,
                    Product = (object?)null,
                    Opmerking = "Geen gekoppeld veilingproduct gevonden."
                });
            }

            return Ok(v);
        }
    }
}
