/*using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]

public class VeilingV2Controller : ControllerBase
{
    public class ProductModel
    {
        public int VeilingNr { get; set; }
        public string VeilingNaam { get; set; }
        public DateTime BeginTijd { get; set; }
        public DateTime EindTijd { get; set; }
        public bool Status { get; set; }
    }

    private static List<ProductModel> _veiling = new();

    [HttpPost]
    public IActionResult VoegVeilingToe(ProductModel veiling)
    {
        _veiling.Add(veiling);
        return Ok();
    }

    [HttpGet]
    public IActionResult HaalVeilingOp()
    {
        return Ok(_veiling);
    }
}*/