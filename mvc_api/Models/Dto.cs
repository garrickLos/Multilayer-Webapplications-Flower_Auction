using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using mvc_api.Models;

namespace mvc_api.Models;

// Categorie CRUD
public record CategorieCreateDto(
    [Required, StringLength(200)] string Naam
);

public record CategorieUpdateDto(
    [Required, StringLength(200)] string Naam
);

// Veilingproduct CRUD
public record KwekerPost_Dto(
    [Required, StringLength(200)] string Naam,
    DateTime? GeplaatstDatum,
    [Range(1, int.MaxValue)] int AantalFusten,
    [Range(0, int.MaxValue)] int VoorraadBloemen,
    [Range(1, int.MaxValue)] int CategorieNr,
    [Required, StringLength(200)] string Plaats,
    [Range(1, 999999999)]
     int Minimumprijs,
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
    [Range(1, 999999999)]
     int Startprijs,
    [Range(1, int.MaxValue)] int CategorieNr,
    [Range(1, int.MaxValue)] int VeilingNr,
    [Range(1, int.MaxValue)] int Kwekernr,
    [Required, StringLength(200)] string ImagePath
);

// Gebruiker CRUD
public abstract record BaseGebruikerDto
{
    [Required, StringLength(200)]
    public string BedrijfsNaam { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string Soort { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Kvk { get; set; }

    [StringLength(200)]
    public string? StraatAdres { get; set; }

    [StringLength(10)]
    public string? Postcode { get; set; }
}

public record GebruikerCreateDto : BaseGebruikerDto;

public record GebruikerUpdateDto : BaseGebruikerDto;

public record Klant_GebruikerDto : BaseGebruikerDto
{
    public int GebruikerNr { get; set; }

    public DateTime? LaatstIngelogd { get; set; }

    public IEnumerable<VeilingMeester_BiedingDto> Biedingen { get; init; } = Enumerable.Empty<VeilingMeester_BiedingDto>();
}
