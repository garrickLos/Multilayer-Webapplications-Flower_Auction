/*using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
namespace mvc_api.Controllers;

[ApiController]
[Route("api/[Controller]")]

public class CategorieV2Controller : ControllerBase
{
    //Dit is een soort tijdelijke 'database' dit gaat vervangen worden door de echte DB
    public class ProductModel
    {
        public int? CategorieNr { get; set; } //Wordt in de database een nummer toegewezen
        public string Naam { get; set; } //Naam van de categorie (roos, tulp, etc.)
    }
    
    //Het haalt nu niks op omdat je niks in de lijst van _categorie hebt ingevoerd
    //Nogmaals dit wordt opgehaald via de database
    private static List<ProductModel> _categorie = new();

    //Alleen een Get want je voert geen nieuwe categorieën toe
    //Je kan alleen bestaande ophalen om die te selecteren voor het toevoegen van een nieuwe product.
    [HttpGet]
    public IActionResult HaalCategorieOp()
    {
        return Ok(_categorie);
    }
}*/