using System;
using System.ComponentModel.DataAnnotations;

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
public record BiedingCreateDto(
    [Range(typeof(int), "1", "9999999")] int BedragPerFust,
    [Range(1, int.MaxValue)] int AantalStuks,
    [Range(1, int.MaxValue)] int GebruikerNr,
    [Range(1, int.MaxValue)] int VeilingNr,
    int VeilingProductNr
);

public record BiedingUpdateDto(
    [Range(typeof(int), "1", "9999999")] int BedragPerFust,
    [Range(1, int.MaxValue)] int AantalStuks
);

// Gebruiker CRUD
public record GebruikerCreateDto(
    [Required, StringLength(200)] string BedrijfsNaam,
    [Required, EmailAddress, StringLength(200)] string Email,
    [Required, StringLength(200)] string Wachtwoord,
    [Required, StringLength(50)] string Soort,
    [StringLength(20)] string? Kvk,
    [StringLength(200)] string? StraatAdres,
    [StringLength(10)] string? Postcode
);

public record GebruikerUpdateDto(
    [Required, StringLength(200)] string BedrijfsNaam,
    [Required, EmailAddress, StringLength(200)] string Email,
    [Required, StringLength(50)] string Soort,
    [StringLength(20)] string? Kvk,
    [StringLength(200)] string? StraatAdres,
    [StringLength(10)] string? Postcode
);

// Veiling CRUD

public abstract record BaseVeiling_Dto {
    public int VeilingNr { get; set; }

    [Required]
    [StringLength(100)]
    public string VeilingNaam { get; set; }
    
    [Required] 
    public DateTime Begintijd { get; set; }
    
    [Required] 
    public DateTime Eindtijd { get; set; }
    
    [StringLength(20)] 
    public string Status { get; set; }
}

public record Klant_VeilingDto : BaseVeiling_Dto
{
    public IEnumerable<VeilingProductDto>? Producten { get; init; } = Enumerable.Empty<VeilingProductDto>();
}

public record VeilingCreateDto : BaseVeiling_Dto;

public record VeilingUpdateDto : BaseVeiling_Dto; 

public record VeilingMeester_VeilingDto : BaseVeiling_Dto
{
    public int VeilingNr { get; init; }
    public IEnumerable<VeilingProductDto> Producten { get; init; } = Enumerable.Empty<VeilingProductDto>();
    public IEnumerable<VeilingBiedingVMDto> Biedingen { get; init; } = Enumerable.Empty<VeilingBiedingVMDto>();
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

public record VeilingBiedingVMDto(
    int Biedingnr,
    int AantalStuks
);