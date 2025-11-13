using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
namespace mvc_api.Controllers;

/*
 biednr die kan NULL blijven in de code
 BedragPerFust (hoeveelheidbloemen)
 AantalStuks (aantal fusten)
 GebruikerNr
 Veilingnr
 KwekerNr
 */

[ApiController]
[Route("api/[Controller]")]

public class BiedingV2Controller : ControllerBase
{
    public class ProductModel
    {
        //Dit hoort de 'database' voor te stellen 
        public int? BiedNr { get; set; } //Dit wordt in de database gemaakt
        public int BedragPerFust { get; set; } //De prijs waarvoor de klant de fust kocht
        public int AantalStuks { get; set; } //Aantal fusten die de klant heeft gekocht
        public int? GebruikerNr { get; set; } //Dit is de unieke nummer van de klant (Moet opgehaald worden van de Klant Tabel)
        public int? VeilingNr { get; set; } //Dit is de unieke nummer van de Veiling waarop geboden is (ophalen van Veiling)
        public int? KwekerNr { get; set; } //Dit is de unieke nummer van de Kweker die het product geplaatst heeft (ophalen van Veilingproduct)
    }

    private static List<ProductModel> Bod = new();
    
    //Alleen 2 CRUD elementen nodig?

    //Maakt een nieuwe element aan in Bod met de waardes van ProductModel.
    //Stuurt een Ok terug naar de API dat het gelukt is.
    [HttpPost]
    public IActionResult VoegBiedingenToe(ProductModel bieding)
    {
        Bod.Add(bieding);
        return CreatedAtAction(nameof(HaalBiedingenOp), bieding);
    }

    //Haalt alle biedingen op die in de lijst Bod zitten.
    //Dit moet later vervangen worden met informatie van de database
    [HttpGet]
    public IActionResult HaalBiedingenOp()
    {
        return Ok(Bod);
    }
    
}