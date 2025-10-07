using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

namespace mvc_api.Controllers;

// Toont veilingen en bijbehorend product.
[Route("api/[controller]")]
[ApiController]
public class VeilingController : ControllerBase
{
    // GET: api/Veiling
    [HttpGet]
    public ActionResult<object> GetAll()
    {
        var data = from v in DataStore.Veilingen
            join vp in DataStore.Veilingproducten on v.VeilingProduct equals vp.VeilingNr
            select new {
                v.VeilingNr, v.Begintijd, v.Eindtijd,
                Product = new { vp.VeilingNr, vp.Naam }
            };
        return Ok(data);
    }

    // GET: api/Veiling/201
    [HttpGet("{id:int}")]
    public ActionResult<object> GetById(int id)
    {
        var v = DataStore.Veilingen.FirstOrDefault(x => x.VeilingNr == id);
        if (v is null) return NotFound();

        var vp = DataStore.Veilingproducten.FirstOrDefault(p => p.VeilingNr == v.VeilingProduct);
        return Ok(new {
            v.VeilingNr, v.Begintijd, v.Eindtijd,
            Product = vp is null ? null : new { vp.VeilingNr, vp.Naam }
        });
    }
}