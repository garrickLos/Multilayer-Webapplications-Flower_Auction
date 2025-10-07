using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

namespace mvc_api.Controllers;

// Simpele lijst met categorieën.
[Route("api/[controller]")]
[ApiController]
public class CategorieController : ControllerBase
{
    // GET: api/Categorie
    [HttpGet]
    public ActionResult<object> GetAll() => Ok(DataStore.Categorieen);

    // GET: api/Categorie/1
    [HttpGet("{id:int}")]
    public ActionResult<object> GetById(int id)
    {
        var c = DataStore.Categorieen.FirstOrDefault(x => x.CategorieNr == id);
        return c is null ? NotFound() : Ok(c);
    }
}