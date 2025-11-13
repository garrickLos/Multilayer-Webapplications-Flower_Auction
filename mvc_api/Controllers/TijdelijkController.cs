using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TijdelijkController : ControllerBase
{
    
    private static List<TijdelijkProduct> Producten = new List<TijdelijkProduct>();

    [HttpPost]
    public IActionResult Create(TijdelijkProduct product)
    {
        Producten.Add(product);
        return CreatedAtAction(nameof(GetAll), product);
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(Producten);
    }
}