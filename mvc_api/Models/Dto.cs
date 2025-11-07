using System;
using System.ComponentModel.DataAnnotations;

namespace mvc_api.Models
{
    // Categorie CRUD
    public record CategorieCreateDto(
        [Required, MaxLength(200)] string Naam
    );

    public record CategorieUpdateDto(
        [Required, MaxLength(200)] string Naam
    );

    // Veilingproduct CRUD
    public record VeilingproductCreateDto(
        [Required, MaxLength(200)] string Naam,
        DateTime? GeplaatstDatum,
        [Range(1, int.MaxValue)] int Fust,
        [Range(0, int.MaxValue)] int Voorraad,
        // decimal-range met typeof(decimal) i.p.v. double
        [Range(typeof(decimal), "0", "999999999")] decimal Startprijs,
        [Range(1, int.MaxValue)] int CategorieNr
    );

    public record VeilingproductUpdateDto(
        [Required, MaxLength(200)] string Naam,
        DateTime? GeplaatstDatum,
        [Range(1, int.MaxValue)] int Fust,
        [Range(0, int.MaxValue)] int Voorraad,
        [Range(typeof(decimal), "0", "999999999")] decimal Startprijs,
        [Range(1, int.MaxValue)] int CategorieNr
    );

    // Bieding CRUD
    public record BiedingCreateDto(
        [Range(typeof(decimal), "0", "999999999")] decimal BedragPerFust,
        [Range(1, int.MaxValue)] int AantalStuks,
        [Range(1, int.MaxValue)] int GebruikerNr,
        [Range(1, int.MaxValue)] int VeilingNr
    );

    public record BiedingUpdateDto(
        [Range(typeof(decimal), "0", "999999999")] decimal BedragPerFust,
        [Range(1, int.MaxValue)] int AantalStuks
    );

    // Gebruiker CRUD
    public record GebruikerCreateDto(
        [Required, MaxLength(200)] string Naam,
        [Required, EmailAddress, MaxLength(200)] string Email,
        [Required, MaxLength(200)] string Wachtwoord,
        [Required, MaxLength(50)] string Soort,
        [MaxLength(20)] string? Kvk,
        [MaxLength(200)] string? StraatAdres,
        [MaxLength(10)] string? Postcode,
        int? Assortiment,
        [MaxLength(50)] string? PersoneelsNr
    );

    public record GebruikerUpdateDto(
        [Required, MaxLength(200)] string Naam,
        [Required, EmailAddress, MaxLength(200)] string Email,
        [Required, MaxLength(50)] string Soort,
        [MaxLength(20)] string? Kvk,
        [MaxLength(200)] string? StraatAdres,
        [MaxLength(10)] string? Postcode,
        int? Assortiment,
        [MaxLength(50)] string? PersoneelsNr
        // Wachtwoord via aparte DTO/endpoint voor password-change
    );

    // Veiling CRUD
    public record VeilingCreateDto(
        [Required] DateTime Begintijd,
        [Required] DateTime Eindtijd,
        [Range(1, int.MaxValue)] int VeilingProductNr,
        // Optioneel: "active", "inactive", "sold"
        [MaxLength(20)] string? Status
    );

    public record VeilingUpdateDto(
        [Required] DateTime Begintijd,
        [Required] DateTime Eindtijd,
        [Range(1, int.MaxValue)] int VeilingProductNr,
        [MaxLength(20)] string? Status
    );
}
