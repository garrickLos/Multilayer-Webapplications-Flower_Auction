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
    DateTime beginDatum,
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
    [Range(1, int.MaxValue)] int VeilingNr
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
public record VeilingCreateDto(
    [Required] DateTime Begintijd,
    [Required] DateTime Eindtijd,
    [Range(typeof(int), "1", "9999999")] int Minimumprijs,
    [StringLength(20)] string? Status
);

public record VeilingUpdateDto(
    [Required] DateTime Begintijd,
    [Required] DateTime Eindtijd,
    [Range(typeof(int), "1", "9999999")] int Minimumprijs,
    [StringLength(20)] string? Status
);
