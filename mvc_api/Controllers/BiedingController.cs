using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

namespace mvc_api.Controllers;

// Toont biedingen + naam van de bieder.
[Route("api/[controller]")]
[ApiController]
public class BiedingController : ControllerBase
{
    // GET: api/Bieding
    [HttpGet]
    public ActionResult<object> GetAll()
    {
        var data = from b in DataStore.Biedingen
            join g in DataStore.Gebruikers on b.GebruikerNr equals g.GebruikerNr
            select new {
                b.BiedNr, b.BedragPerFust, b.AantalStuks, b.VeilingNr,
                Gebruiker = new { g.GebruikerNr, g.Naam }
            };
        return Ok(data);
    }

    // GET: api/Bieding/1001
    [HttpGet("{id:int}")]
    public ActionResult<object> GetById(int id)
    {
        var b = DataStore.Biedingen.FirstOrDefault(x => x.BiedNr == id);
        if (b is null) return NotFound();

        var gebruiker = DataStore.Gebruikers.FirstOrDefault(g => g.GebruikerNr == b.GebruikerNr);
        return Ok(new {
            b.BiedNr, b.BedragPerFust, b.AantalStuks, b.VeilingNr,
            Gebruiker = gebruiker is null ? null : new { gebruiker.GebruikerNr, gebruiker.Naam }
        });
    }
}