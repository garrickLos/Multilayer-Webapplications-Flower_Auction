using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

namespace mvc_api.Controllers
{
    // API-controller voor veilingen en hun bijbehorende veilingproducten.
    [Route("api/[controller]")]
    [ApiController]
    public class VeilingController : ControllerBase
    {
        // GET: api/Veiling
        // Haalt alle veilingen op met bijhorend product.
        [HttpGet]
        public ActionResult<object> GetAll()
        {
            var data =
                from v in DataStore.Veilingen
                join vp in DataStore.Veilingproducten on v.VeilingProduct equals vp.VeilingNr
                select new
                {
                    v.VeilingNr,
                    v.Begintijd,
                    v.Eindtijd,
                    Product = new
                    {
                        vp.VeilingNr,
                        vp.Naam,
                        vp.Startprijs,
                        vp.Voorraad
                    }
                };

            return Ok(data);
        }

        // GET: api/Veiling/{id}
        // Haalt één specifieke veiling op.
        [HttpGet("{id:int}")]
        public ActionResult<object> GetById(int id)
        {
            var v = DataStore.Veilingen.FirstOrDefault(x => x.VeilingNr == id);
            if (v is null)
                return NotFound(new { Message = $"Geen veiling gevonden met ID {id}." });

            var vp = DataStore.Veilingproducten.FirstOrDefault(p => p.VeilingNr == v.VeilingProduct);

            // Als er geen product is gekoppeld, geef melding terug.
            if (vp is null)
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

            // Als product wel bestaat, toon beide.
            return Ok(new
            {
                v.VeilingNr,
                v.Begintijd,
                v.Eindtijd,
                Product = new
                {
                    vp.VeilingNr,
                    vp.Naam,
                    vp.Startprijs,
                    vp.Voorraad
                }
            });
        }
    }
}
