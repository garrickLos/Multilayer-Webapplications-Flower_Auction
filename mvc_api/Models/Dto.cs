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
        [Required] DateTime GeplaatstDatum,
        [Range(1, int.MaxValue)] int Fust,
        [Range(0, int.MaxValue)] int Voorraad,
        [Range(0, 999_999_999)] decimal Startprijs,
        [Range(1, int.MaxValue)] int CategorieNr   // was [Required]
    );

    public record VeilingproductUpdateDto(
        [Required, MaxLength(200)] string Naam,
        [Required] DateTime GeplaatstDatum,
        [Range(1, int.MaxValue)] int Fust,
        [Range(0, int.MaxValue)] int Voorraad,
        [Range(0, 999_999_999)] decimal Startprijs,
        [Range(1, int.MaxValue)] int CategorieNr   // was [Required]
    );

    // Bieding DTOs
    public record BiedingCreateDto(
        [Range(0, 999_999_999)] decimal BedragPerFust,
        [Range(1, int.MaxValue)] int AantalStuks,
        [Range(1, int.MaxValue)] int GebruikerNr,  // was [Required]
        [Range(1, int.MaxValue)] int VeilingNr     // was [Required]
    );

    public record BiedingUpdateDto(
        [Range(0, 999_999_999)] decimal BedragPerFust,
        [Range(1, int.MaxValue)] int AantalStuks
    );
    
    public record GebruikerCreateDto(
        [Required, MaxLength(200)] string Naam,
        [Required, EmailAddress, MaxLength(200)] string Email,
        [Required, MaxLength(200)] string Wachtwoord, // verplicht in model
        [Required, MaxLength(50)] string Soort,
        [MaxLength(20)] string? Kvk,
        [MaxLength(200)] string? StraatAdres,
        [MaxLength(10)] string? Postcode,
        int Assortiment,                 // int in model (geen strengere limiet opgelegd)
        [MaxLength(50)] string? PersoneelsNr
    );

    public record GebruikerUpdateDto(
        [Required, MaxLength(200)] string Naam,
        [Required, EmailAddress, MaxLength(200)] string Email,
        [Required, MaxLength(50)] string Soort,
        [MaxLength(20)] string? Kvk,
        [MaxLength(200)] string? StraatAdres,
        [MaxLength(10)] string? Postcode,
        int Assortiment,
        [MaxLength(50)] string? PersoneelsNr
        // Wachtwoord niet hier tenzij je een aparte endpoint/DTO wilt voor password-change
    );
    
    public record VeilingCreateDto(
        DateTime? Begintijd,
        DateTime? Eindtijd,
        [Range(1, int.MaxValue)] int VeilingProduct   // was [Required]
    );

    public record VeilingUpdateDto(
        DateTime? Begintijd,
        DateTime? Eindtijd,
        [Range(1, int.MaxValue)] int VeilingProduct   // was [Required]
    );
}
