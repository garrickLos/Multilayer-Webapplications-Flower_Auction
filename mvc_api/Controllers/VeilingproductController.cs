using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

namespace mvc_api.Controllers;

// Toont veilingproducten en de categorie-naam.
[Route("api/[controller]")]
[ApiController]
public class VeilingproductController : ControllerBase
{
    // GET: api/Veilingproduct
    [HttpGet]
    public ActionResult<object> GetAll()
    {
        var data = from vp in DataStore.Veilingproducten
            join c in DataStore.Categorieen on vp.CategorieNr equals c.CategorieNr
            select new {
                vp.VeilingNr, vp.Naam, vp.Geplaatst_Datum, vp.Fust, vp.Voorraad, vp.Startprijs,
                Categorie = c.Naam
            };
        return Ok(data);
    }

    // GET: api/Veilingproduct/101
    [HttpGet("{id:int}")]
    public ActionResult<object> GetById(int id)
    {
        var vp = DataStore.Veilingproducten.FirstOrDefault(x => x.VeilingNr == id);
        if (vp is null) return NotFound();

        var categorie = DataStore.Categorieen.FirstOrDefault(c => c.CategorieNr == vp.CategorieNr)?.Naam;

        var biedingen = DataStore.Biedingen
            .Where(b => b.VeilingNr == id)
            .OrderByDescending(b => b.BiedNr)
            .Select(b => new { b.BiedNr, b.BedragPerFust, b.AantalStuks, b.GebruikerNr });

        return Ok(new {
            vp.VeilingNr, vp.Naam, vp.Geplaatst_Datum, vp.Fust, vp.Voorraad, vp.Startprijs,
            Categorie = categorie,
            Biedingen = biedingen
        });
    }
}