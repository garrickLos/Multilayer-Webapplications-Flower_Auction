/*
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]

public class VeilingproductV2Controller : ControllerBase
{
    public class ProductModel
    {
        public int? VeilingproductNr { get; set; }
        public string Naam { get; set; }
        public DateTime GeplaatseDatum { get; set; }
        public int Fust { get; set; } //aantal fusten (Voorraad / Fust = aantal stuks in een fust)
        public int Voorraad { get; set; } //hoeveelheid bloemen
        public int StartPrijs { get; set; } //max prijs (veilingmeester)
        public int CategorieNr { get; set; }
        public int VeilingNr { get; set; }
        public string Plaats { get; set; }
        public int MinimumPrijs { get; set; }
        public int KwekerNr { get; set; }
        public DateTime BeginDatum { get; set; }
        public DateTime EindDatum { get; set; }
        public bool Status { get; set; }
        public string Bestandspad { get; set; }
    }

    private static List<ProductModel> _veilingproduct = new();

    //Toevoegen van een nieuwe veilingproduct
    [HttpPost]
    public IActionResult VoegNieuwProductToe(ProductModel product)
    {
        _veilingproduct.Add(product);
        return Ok();
    }

    //Product ophalen
    [HttpGet]
    public IActionResult HaalProductOp()
    {
        return Ok(_veilingproduct);
    }
}
*/
