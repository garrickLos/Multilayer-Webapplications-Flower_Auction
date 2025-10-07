using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

namespace mvc_api.Controllers;

// Haalt gebruikers op uit de nepdata.
[Route("api/[controller]")]
[ApiController]
public class GebruikerController : ControllerBase
{
    // GET: api/Gebruiker
    [HttpGet]
    public ActionResult<object> GetAll()
    {
        var data = DataStore.Gebruikers
            .Select(g => new { g.GebruikerNr, g.Naam, g.Email, g.SOORT });
        return Ok(data);
    }

    // GET: api/Gebruiker/2
    [HttpGet("{id:int}")]
    public ActionResult<object> GetById(int id)
    {
        var g = DataStore.Gebruikers.FirstOrDefault(x => x.GebruikerNr == id);
        if (g is null) return NotFound();

        var biedingen = DataStore.Biedingen
            .Where(b => b.GebruikerNr == id)
            .Select(b => new { b.BiedNr, b.BedragPerFust, b.AantalStuks, b.VeilingNr });

        return Ok(new {
            g.GebruikerNr, g.Naam, g.Email, g.SOORT,
            Biedingen = biedingen
        });
    }
}