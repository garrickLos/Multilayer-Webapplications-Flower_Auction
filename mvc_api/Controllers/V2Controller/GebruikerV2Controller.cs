/*using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
namespace mvc_api.Controllers;

[ApiController]
[Route("api/[Controller]")]

public class GebruikerV2Controller : ControllerBase
{
    public class ProductModel
    {
        public int? GebruikerNr { get; set; } //Elke gebruiker krijgt zijn eigen unieke nummer automatisch aangemaakt
        public string BedrijfsNaam { get; set; } //Naam van de bedrijf
        public string Email { get; set; } //Email naam
        public string Wachtwoord { get; set; } // wachtwoord (moet nog gehashed worden)
        public DateTime LaatstIngelogd { get; set; } //Laatste ingelogde datum en tijd (vooral voor het ophalen van gegevens)
        public string Soort  { get; set; } //Soort gebruiker (Kweker, Koper, Veilingmeester)
        public string KVK { get; set; } //Minimaal en maximaal 8 karakters
        public string StraatAdres { get; set; } //Adres van het bedrijf
        public string Postcode { get; set; } //Postcode van het bedrijf
        
        //Niet 100% zeker
        public string PNaam { get; set; } //Naam van het personeel
    }

    private static List<ProductModel> _gebruiker = new();
    
    //Informatie creëeren (bij het registreren)
    [HttpPost]
    public IActionResult GebruikerToevoegen(ProductModel gebruiker)
    {
        _gebruiker.Add(gebruiker);
        return Ok();
    }
    
    //Gebruiker info ophalen bijv voor het inloggen
    [HttpGet]
    public IActionResult HaalGebruikerGegevensOp()
    {
        return Ok(_gebruiker);
    }
    
    //Put en Delete kunnen later toegevoegd worden zijn voor nu minder belangrijk
}*/