using System;
using System.ComponentModel.DataAnnotations;

namespace mvc_api.Models
{
    public record CategorieCreateDto(
        [Required, MaxLength(200)] string Naam
    );

    public record CategorieUpdateDto(
        [Required, MaxLength(200)] string Naam
    );
    
    // Veilingproduct DTOs
    public record VeilingproductCreateDto(
        [Required, MaxLength(200)] string Naam,
        DateTime? GeplaatstDatum, // model heeft default -> optioneel in create
        [Range(1, int.MaxValue)] int Fust,
        [Range(0, int.MaxValue)] int Voorraad,
        [Range(0, 999_999_999)] decimal Startprijs,
        [Range(1, int.MaxValue)] int CategorieNr
    );

    public record VeilingproductUpdateDto(
        [Required, MaxLength(200)] string Naam,
        DateTime? GeplaatstDatum, // mag leeg blijven als je de datum niet wijzigt
        [Range(1, int.MaxValue)] int Fust,
        [Range(0, int.MaxValue)] int Voorraad,
        [Range(0, 999_999_999)] decimal Startprijs,
        [Range(1, int.MaxValue)] int CategorieNr
    );

    // Bieding DTOs
    public record BiedingCreateDto(
        [Range(0, 999_999_999)] decimal BedragPerFust,
        [Range(1, int.MaxValue)] int AantalStuks,
        [Range(1, int.MaxValue)] int GebruikerNr,
        [Range(1, int.MaxValue)] int VeilingNr
    );

    public record BiedingUpdateDto(
        [Range(0, 999_999_999)] decimal BedragPerFust,
        [Range(1, int.MaxValue)] int AantalStuks
    );
    
    public record GebruikerCreateDto(
        [Required, MaxLength(200)] string Naam,
        [Required, EmailAddress, MaxLength(200)] string Email,
        [Required, MaxLength(200)] string Wachtwoord,
        [Required, MaxLength(50)] string Soort,
        [MaxLength(20)] string? Kvk,
        [MaxLength(200)] string? StraatAdres,
        [MaxLength(10)] string? Postcode,
        int? Assortiment,                 // model: int? -> nullable
        [MaxLength(50)] string? PersoneelsNr
    );

    public record GebruikerUpdateDto(
        [Required, MaxLength(200)] string Naam,
        [Required, EmailAddress, MaxLength(200)] string Email,
        [Required, MaxLength(50)] string Soort,
        [MaxLength(20)] string? Kvk,
        [MaxLength(200)] string? StraatAdres,
        [MaxLength(10)] string? Postcode,
        int? Assortiment,                 // model: int? -> nullable
        [MaxLength(50)] string? PersoneelsNr
        // Wachtwoord via aparte DTO/endpoint voor password-change
    );
    
    public record VeilingCreateDto(
        DateTime? Begintijd,
        DateTime? Eindtijd,
        [Range(1, int.MaxValue)] int VeilingProductNr // model: VeilingProductNr
    );

    public record VeilingUpdateDto(
        DateTime? Begintijd,
        DateTime? Eindtijd,
        [Range(1, int.MaxValue)] int VeilingProductNr // model: VeilingProductNr
    );
}
