using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using mvc_api.Models;

namespace mvc_api.Models;

// Veilingproduct CRUD
public record VeilingproductCreateDto(
    [Required, StringLength(200)] string Naam,
    DateTime? GeplaatstDatum,
    [Range(1, int.MaxValue)] int AantalFusten,
    [Range(0, int.MaxValue)] int VoorraadBloemen,
    [Range(typeof(int), "1", "9999999")] int? Startprijs,
    [Range(1, int.MaxValue)] int CategorieNr,
    [Range(1, int.MaxValue)] int? VeilingNr,
    [Required, StringLength(200)] string Plaats,
    [Range(typeof(int), "0.01", "9999999")] int Minimumprijs,
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

// Biedingen bij detailweergave
public sealed record VBList(
    int BiedNr, 
    int BedragPerFust, 
    int AantalStuks, 
    int GebruikerNr
);

/* deze 2 is er om te zorgen dat er zeker een producten en biedingen gekozen zijn die getoond worden
    Mss handig deze te vervangen in de toekomst door een andere abstracte dto van de biedingen en producten zodat we niet teveel dubbel hebben
*/
public record VeilingProductDto(
    int VeilingProductNr,
    string Naam,
    int? Startprijs,
    int Minimumprijs,
    string Plaats,
    int CategorieNr,
    int VoorraadBloemen,
    int AantalFusten,
    string ImagePath
);


public record VeilingProductDto_anonymous(
    int VeilingProductNr,
    string Naam,
    int? Startprijs,
    int VoorraadBloemen,
    string ImagePath
);

//kweker get dto
public sealed record kwekerVeilingproductGet_dto
(
    int VeilingProductNr,
    string Naam,
    DateTime GeplaatstDatum,
    int Fust,
    int Voorraad,
    string? Categorie,
    string ImagePath,
    string Plaats
);
//info voor klant
public sealed record klantVeilingproductGet_dto
(
    int VeilingProductNr,
    string Naam,
    string Categorie,
    string ImagePath,
    string Plaats
);

//bieding voor klantoverzicht
public sealed record klantBiedingGet_dto
(
    int VeilingProductNr,
    int BedragPerFust,
    int AantalStuks,
    int GebruikerNr
);
// Lijstweergave
public sealed record VpList(
    int VeilingProductNr,
    string Naam,
    DateTime GeplaatstDatum,
    int Fust,
    int Voorraad,
    int? Startprijs,
    string? Categorie,
    int? VeilingNr,
    string ImagePath,
    string Plaats
);

public sealed record VpDetail(
    int VeilingProductNr,
    string Naam,
    DateTime GeplaatstDatum,
    int Fust,
    int Voorraad,
    int? Startprijs,
    string? Categorie,
    int? VeilingNr,
    string ImagePath,
    IEnumerable<VBList> Biedingen
);
