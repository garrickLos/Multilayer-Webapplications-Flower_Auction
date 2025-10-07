using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

namespace mvc_api.Controllers
{
    // API-controller voor categorieën.
    // Haalt categorieën op uit de nepdata (DataStore).
    [Route("api/[controller]")]
    [ApiController]
    public class CategorieController : ControllerBase
    {
        // GET: api/Categorie
        // Haalt alle categorieën op.
        [HttpGet]
        public ActionResult<object> GetAll()
        {
            var data = DataStore.Categorieen
                .Select(c => new
                {
                    c.CategorieNr,
                    c.Naam
                });

            return Ok(data);
        }

        // GET: api/Categorie/{id}
        // Haalt één specifieke categorie op.
        [HttpGet("{id:int}")]
        public ActionResult<object> GetById(int id)
        {
            var categorie = DataStore.Categorieen.FirstOrDefault(x => x.CategorieNr == id);

            if (categorie is null)
                return NotFound(new { Message = $"Geen categorie gevonden met ID {id}." });

            return Ok(new
            {
                categorie.CategorieNr,
                categorie.Naam
            });
        }
    }
}