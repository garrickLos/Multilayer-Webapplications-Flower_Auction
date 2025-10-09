using System;
using System.ComponentModel.DataAnnotations;

namespace mvc_api.Models
{
    // Veilingproduct DTOs
    public record VeilingproductCreateDto(
        [property: Required, MaxLength(200)] string Naam,
        [property: Required] DateTime GeplaatstDatum,
        [property: Range(1, int.MaxValue)] int Fust,
        [property: Range(0, int.MaxValue)] int Voorraad,
        [property: Range(0, 999999999)] decimal Startprijs,
        [property: Required] int CategorieNr
    );

    public record VeilingproductUpdateDto(
        [property: Required, MaxLength(200)] string Naam,
        [property: Required] DateTime GeplaatstDatum,
        [property: Range(1, int.MaxValue)] int Fust,
        [property: Range(0, int.MaxValue)] int Voorraad,
        [property: Range(0, 999999999)] decimal Startprijs,
        [property: Required] int CategorieNr
    );

    // Bieding DTOs
    public record BiedingCreateDto(
        [property: Range(0, 999999999)] decimal BedragPerFust,
        [property: Range(1, int.MaxValue)] int AantalStuks,
        [property: Required] int GebruikerNr,
        [property: Required] int VeilingNr
    );

    public record BiedingUpdateDto(
        [property: Range(0, 999999999)] decimal BedragPerFust,
        [property: Range(1, int.MaxValue)] int AantalStuks
    );
}
