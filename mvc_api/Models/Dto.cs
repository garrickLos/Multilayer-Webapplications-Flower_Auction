using System;
using System.ComponentModel.DataAnnotations;

namespace mvc_api.Models
{
    // Veilingproduct DTOs
    public record VeilingproductCreateDto(
        [Required, MaxLength(200)] string Naam,
        [Required] DateTime GeplaatstDatum,
        [Range(1, int.MaxValue)] int Fust,
        [Range(0, int.MaxValue)] int Voorraad,
        [Range(0, 999_999_999)] decimal Startprijs,
        [Required] int CategorieNr
    );

    public record VeilingproductUpdateDto(
        [Required, MaxLength(200)] string Naam,
        [Required] DateTime GeplaatstDatum,
        [Range(1, int.MaxValue)] int Fust,
        [Range(0, int.MaxValue)] int Voorraad,
        [Range(0, 999_999_999)] decimal Startprijs,
        [Required] int CategorieNr
    );

    // Bieding DTOs
    public record BiedingCreateDto(
        [Range(0, 999_999_999)] decimal BedragPerFust,
        [Range(1, int.MaxValue)] int AantalStuks,
        [Required] int GebruikerNr,
        [Required] int VeilingNr
    );

    public record BiedingUpdateDto(
        [Range(0, 999_999_999)] decimal BedragPerFust,
        [Range(1, int.MaxValue)] int AantalStuks
    );
}