using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

// Categorie CRUD
public record CategorieCreateDto(
    [Required, StringLength(200)] string Naam
);

public record CategorieUpdateDto(
    [Required, StringLength(200)] string Naam
);

// Veilingproduct CRUD
public record VeilingproductCreateDto(
    [Required, StringLength(200)] string Naam,
    DateTime? GeplaatstDatum,
    [Range(1, int.MaxValue)] int AantalFusten,
    [Range(0, int.MaxValue)] int VoorraadBloemen,
    [Range(typeof(int), "1", "9999999")] int Startprijs,
    [Range(1, int.MaxValue)] int CategorieNr,
    [Range(1, int.MaxValue)] int VeilingNr,
    [Required, StringLength(200)] string Plaats,
    [Range(typeof(int), "1", "9999999")] int Minimumprijs,
    [Range(1, int.MaxValue)] int Kwekernr,
    DateOnly beginDatum,
    bool status,
    [Required, StringLength(200)] string ImagePath
);

public record VeilingproductUpdateDto(
    [Required, StringLength(200)] string Naam,
    DateTime? GeplaatstDatum,
    [Range(1, int.MaxValue)] int Fust,
    [Range(0, int.MaxValue)] int Voorraad,
    [Range(typeof(int), "1", "9999999")] int Startprijs,
    [Range(1, int.MaxValue)] int CategorieNr,
    [Range(1, int.MaxValue)] int VeilingNr,
    [Range(1, int.MaxValue)] int Kwekernr,
    [Required, StringLength(200)] string ImagePath
);

// Bieding CRUD

public abstract record BaseBieding_Dto
{

    [Range(typeof(int), "1", "9999999")] 
    public Decimal BedragPerFust { get; set; }
    
    [Range(1, int.MaxValue)] 
    public int AantalStuks { get; set; }
    
    [Range(1, int.MaxValue)] 
    public int GebruikerNr { get; set; }
}

public record VeilingMeester_BiedingDto : BaseBieding_Dto
{
    public int BiedingNr { get; set; }

    [Range(1, int.MaxValue)]
    [Required] 
    public int VeilingNr { get; set; }
    
    [Required]
    public int VeilingProductNr { get; set; }
}

public record BiedingCreateDto : BaseBieding_Dto
{
    public int BiedingNr { get; set; }
    
    public int VeilingNr { get; set; } 
    public int VeilingproductNr { get; set; }
}

public record BiedingUpdateDto : BaseBieding_Dto;

// public record BiedingUpdateDto(
//     [Range(typeof(int), "1", "9999999")] int BedragPerFust,
//     [Range(1, int.MaxValue)] int AantalStuks
// );

// Gebruiker CRUD
public abstract record BaseGebruiker
{

    [Required, StringLength(200)] 
    public string BedrijfsNaam { get; set; }
    
    [Required, EmailAddress, StringLength(200)] 
    public string Email { get; set; }
    
    [Required, StringLength(200)] 
    public string Wachtwoord { get; set; }

    public DateTime LaatstIngelogd { get; set; }
    
    [Required, StringLength(50)] 
    public string Soort { get; set; }
    
    [StringLength(20)] 
    public string? Kvk { get; set; }
    
    [StringLength(200)] 
    public string? StraatAdres { get; set; }
    
    [StringLength(10)] 
    public string? Postcode { get; set; }
}

public record GebruikerCreateDto : BaseGebruiker;

public record GebruikerUpdateDto : BaseGebruiker;

public record Klant_GebruikerDto : BaseGebruiker
{
    public int GebruikerNr { get; set; }
    
    public IEnumerable<VeilingMeester_BiedingDto> Biedingen { get; init; } = Enumerable.Empty<VeilingMeester_BiedingDto>();
}


// Veiling CRUD
public abstract record BaseVeiling_Dto {

    [Required]
    [StringLength(100)]
    public string VeilingNaam { get; set; }
    
    [Required] 
    public DateTime Begintijd { get; set; }
    
    [Required] 
    public DateTime Eindtijd { get; set; }
    
}

public record Klant_VeilingDto : BaseVeiling_Dto
{
    public int VeilingNr { get; set; }
    
    [StringLength(20)] 
    public string Status { get; set; }

    public IEnumerable<VeilingProductDto>? Producten { get; init; } = Enumerable.Empty<VeilingProductDto>();
}

public record VeilingCreateDto : BaseVeiling_Dto
{

    [StringLength(20)] 
    public string Status { get; set; }
}

public record VeilingUpdateDto : BaseVeiling_Dto; 

public record VeilingMeester_VeilingDto : BaseVeiling_Dto
{
    [StringLength(20)] 
    public string Status { get; set; }
    public int VeilingNr { get; init; }
    public IEnumerable<VeilingProductDto> Producten { get; init; } = Enumerable.Empty<VeilingProductDto>();
    public IEnumerable<VeilingMeester_BiedingDto> Biedingen { get; init; } = Enumerable.Empty<VeilingMeester_BiedingDto>();
}

/* deze 2 is er om te zorgen dat er zeker een producten en biedingen gekozen zijn die getoond worden
    Mss handig deze te vervangen in de toekomst door een andere abstracte dto van de biedingen en producten zodat we niet teveel dubbel hebben
*/
public record VeilingProductDto(
    int VeilingProductNr,
    string Naam,
    decimal Startprijs,
    int Voorraad,
    string ImagePath
);