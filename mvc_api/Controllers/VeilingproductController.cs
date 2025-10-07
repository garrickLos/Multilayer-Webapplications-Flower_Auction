using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class VeilingproductController : ControllerBase
{
    // GET: api/Veilingproduct
    [HttpGet]
    public ActionResult<object> GetAll()
    {
        var data =
            from vp in DataStore.Veilingproducten
            join c in DataStore.Categorieen on vp.CategorieNr equals c.CategorieNr
            select new
            {
                vp.VeilingNr,
                vp.Naam,
                vp.GeplaatstDatum,
                vp.Fust,
                vp.Voorraad,
                vp.Startprijs,
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

        return Ok(new
        {
            vp.VeilingNr,
            vp.Naam,
            vp.GeplaatstDatum,
            vp.Fust,
            vp.Voorraad,
            vp.Startprijs,
            Categorie = categorie,
            Biedingen = biedingen
        });
    }

    // POST: api/Veilingproduct
    [HttpPost]
    public ActionResult<object> Create([FromBody] VeilingproductCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Naam)) return BadRequest("Naam is verplicht.");
        if (DataStore.Categorieen.All(c => c.CategorieNr != dto.CategorieNr))
            return BadRequest("Categorie bestaat niet.");

        var newId = DataStore.Ids.NextVeilingproductId();
        var entity = new Veilingproduct
        {
            VeilingNr = newId,
            Naam = dto.Naam,
            GeplaatstDatum = dto.GeplaatstDatum,
            Fust = dto.Fust,
            Voorraad = dto.Voorraad,
            Startprijs = dto.Startprijs,
            CategorieNr = dto.CategorieNr
        };

        DataStore.Veilingproducten.Add(entity);

        return CreatedAtAction(nameof(GetById), new { id = entity.VeilingNr }, new
        {
            entity.VeilingNr,
            entity.Naam,
            entity.GeplaatstDatum,
            entity.Fust,
            entity.Voorraad,
            entity.Startprijs,
            entity.CategorieNr
        });
    }

    // PUT: api/Veilingproduct/1234
    [HttpPut("{id:int}")]
    public ActionResult<object> Update(int id, [FromBody] VeilingproductUpdateDto dto)
    {
        var vp = DataStore.Veilingproducten.FirstOrDefault(x => x.VeilingNr == id);
        if (vp is null) return NotFound();

        if (DataStore.Categorieen.All(c => c.CategorieNr != dto.CategorieNr))
            return BadRequest("Categorie bestaat niet.");

        vp.Naam = dto.Naam;
        vp.GeplaatstDatum = dto.GeplaatstDatum;
        vp.Fust = dto.Fust;
        vp.Voorraad = dto.Voorraad;
        vp.Startprijs = dto.Startprijs;
        vp.CategorieNr = dto.CategorieNr;

        return Ok(new
        {
            vp.VeilingNr,
            vp.Naam,
            vp.GeplaatstDatum,
            vp.Fust,
            vp.Voorraad,
            vp.Startprijs,
            vp.CategorieNr
        });
    }

    // DELETE: api/Veilingproduct/1234
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var vp = DataStore.Veilingproducten.FirstOrDefault(x => x.VeilingNr == id);
        if (vp is null) return NotFound();

        // in-memory cascade
        DataStore.Biedingen.RemoveAll(b => b.VeilingNr == id);

        DataStore.Veilingproducten.Remove(vp);
        return NoContent();
    }
}
