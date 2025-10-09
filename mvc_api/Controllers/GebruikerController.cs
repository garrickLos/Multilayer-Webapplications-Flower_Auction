using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

namespace mvc_api.Controllers
{
    // Haalt gebruikers op uit de nepdata (DataStore).
    [Route("api/[controller]")]
    [ApiController]
    public class GebruikerController : ControllerBase
    {
        // GET: api/Gebruiker
        // Lijst met basisinfo per gebruiker.
        [HttpGet]
        public ActionResult<object> GetAll()
        {
            var data = DataStore.Gebruikers
                .Select(g => new
                {
                    g.GebruikerNr,
                    g.Naam,
                    g.Email,
                    g.Soort
                });

            return Ok(data);
        }

        // GET: api/Gebruiker/{id}
        // Eén gebruiker + zijn/haar biedingen.
        [HttpGet("{id:int}")]
        public ActionResult<object> GetById(int id)
        {
            var g = DataStore.Gebruikers.FirstOrDefault(x => x.GebruikerNr == id);
            if (g is null)
                return NotFound(new { Message = $"Geen gebruiker gevonden met ID {id}." });

            var biedingen = DataStore.Biedingen
                .Where(b => b.GebruikerNr == id)
                .Select(b => new
                {
                    b.BiedNr,
                    BedragPE = b.BedragPerFust,
                    b.AantalStuks,
                    b.VeilingNr
                });

            // Hier tonen we nu ALLE properties
            return Ok(new
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
                Biedingen = biedingen
            });
        }
    }
}