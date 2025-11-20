using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

public class TestController : ControllerBase
{
    private readonly AppDbContext _db;

    public TestController(AppDbContext db) => _db = db;

    [HttpGet]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? testRol, // Voor het testen in Swagger
        [FromQuery] string? q,
        [FromQuery] int? categorieNr,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        // Basis query opbouwen
        var query = _db.Veilingproducten.AsNoTracking().AsQueryable();

        // Filtering toepassen
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(vp => vp.Naam.Contains(term));
        }

        if (categorieNr is int cnr)
        {
            query = query.Where(vp => vp.CategorieNr == cnr);
        }

        // Sorteren en Paginering (doe dit VOORDAT je de data ophaalt/projecteert)
        query = query
            .OrderBy(vp => vp.Naam)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        // Logica voor Rol-based projectie
        if (testRol == "Kweker")
        {
            // Scenario: KWEKER (Uitgebreide data)
            var items = await query.Select(v => new VeilingProductKwekerDto
            {
                // Basis velden
                VeilingProductNr = v.VeilingProductNr,
                Naam = v.Naam,
                GeplaatstDatum = v.GeplaatstDatum,
                AantalFusten = v.AantalFusten,
                VoorraadBloemen = v.VoorraadBloemen,
                Startprijs = v.Startprijs,
                CategorieNr = v.CategorieNr,
                CategorieNaam = v.Categorie != null ? v.Categorie.Naam : null,
                VeilingNr = v.VeilingNr,
                ImagePath = v.ImagePath,
                BeginDatum = v.beginDatum
            })
            .ToListAsync(ct);

            return Ok(items);
        }
        else
        {
            // Scenario: PUBLIEK (Beperkte data)
            var items = await query.Select(v => new VeilingProductPublicDto
            {
                VeilingProductNr = v.VeilingProductNr,
                Naam = v.Naam,
                GeplaatstDatum = v.GeplaatstDatum,
                AantalFusten = v.AantalFusten,
                Startprijs = v.Startprijs,
                VeilingNr = v.VeilingNr,
                ImagePath = v.ImagePath
            })
            .ToListAsync(ct);

            return Ok(items);
        }
    }
    
    // ... (De rest van je controller methodes zoals GetVeilingDetail)
}