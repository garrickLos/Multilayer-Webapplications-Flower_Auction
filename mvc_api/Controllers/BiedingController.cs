using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

namespace mvc_api.Controllers
{
    // API-controller voor biedingen.
    // Toont biedingen en de naam van de bieder.
    [Route("api/[controller]")]
    [ApiController]
    public class BiedingController : ControllerBase
    {
        // GET: api/Bieding
        // Haalt alle biedingen op, inclusief bieder-naam.
        [HttpGet]
        public ActionResult<object> GetAll()
        {
            var data =
                from b in DataStore.Biedingen
                join g in DataStore.Gebruikers on b.GebruikerNr equals g.GebruikerNr
                select new
                {
                    b.BiedNr,
                    b.BedragPerFust,
                    b.AantalStuks,
                    b.VeilingNr,
                    Gebruiker = new { g.GebruikerNr, g.Naam }
                };

            return Ok(data);
        }

        // GET: api/Bieding/{id}
        // Haalt één specifieke bieding op.
        [HttpGet("{id:int}")]
        public ActionResult<object> GetById(int id)
        {
            var bieding = DataStore.Biedingen.FirstOrDefault(x => x.BiedNr == id);
            if (bieding is null)
                return NotFound(new { Message = $"Geen bieding gevonden met ID {id}." });

            var gebruiker = DataStore.Gebruikers.FirstOrDefault(g => g.GebruikerNr == bieding.GebruikerNr);

            return Ok(new
            {
                bieding.BiedNr,
                bieding.BedragPerFust,
                bieding.AantalStuks,
                bieding.VeilingNr,
                Gebruiker = gebruiker is null
                    ? null
                    : new { gebruiker.GebruikerNr, gebruiker.Naam }
            });
        }
    }
}