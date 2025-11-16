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
    [Range(typeof(decimal), "0.01", "999999999")] decimal Startprijs,
    [Range(1, int.MaxValue)] int CategorieNr,
    [Range(1, int.MaxValue)] int VeilingNr,
    string Plaats,
    decimal Minimumprijs,
    int Kwekernr,
    DateTime beginDatum,
    bool status,
    string ImagePath
);

public record VeilingproductUpdateDto(
    [Required, StringLength(200)] string Naam,
    DateTime? GeplaatstDatum,
    [Range(1, int.MaxValue)] int Fust,
    [Range(0, int.MaxValue)] int Voorraad,
    [Range(typeof(decimal), "0.01", "999999999")] decimal Startprijs,
    [Range(1, int.MaxValue)] int CategorieNr,
    [Range(1, int.MaxValue)] int VeilingNr,
    int Kwekernr,
    string ImagePath
);

// Bieding CRUD
public record BiedingCreateDto(
    [Range(typeof(decimal), "0.01", "999999999")] decimal BedragPerFust,
    [Range(1, int.MaxValue)] int AantalStuks,
    [Range(1, int.MaxValue)] int GebruikerNr,
    [Range(1, int.MaxValue)] int VeilingNr
);

public record BiedingUpdateDto(
    [Range(typeof(decimal), "0.01", "999999999")] decimal BedragPerFust,
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
public record VeilingCreateDto(
    [Required] DateTime Begintijd,
    [Required] DateTime Eindtijd,
    [Range(typeof(decimal), "0.01", "999999999")] decimal Minimumprijs,
    [StringLength(20)] string? Status
);

public record VeilingUpdateDto(
    [Required] DateTime Begintijd,
    [Required] DateTime Eindtijd,
    [Range(typeof(decimal), "0.01", "999999999")] decimal Minimumprijs,
    [StringLength(20)] string? Status
);
