using System;

namespace mvc_api.Models
{
    // Wordt gebruikt bij POST (aanmaken van een nieuw veilingproduct).
    public record VeilingproductCreateDto(
        string Naam,
        DateTime GeplaatstDatum,
        int Fust,
        int Voorraad,
        int Startprijs,
        int CategorieNr
    );

    // Wordt gebruikt bij PUT (volledige update van een bestaand veilingproduct).
    public record VeilingproductUpdateDto(
        string Naam,
        DateTime GeplaatstDatum,
        int Fust,
        int Voorraad,
        int Startprijs,
        int CategorieNr
    );

    
    // DTO's voor Bieding

    // Wordt gebruikt bij POST (aanmaken van een nieuwe bieding).
    public record BiedingCreateDto(
        decimal BedragPerFust,
        int AantalStuks,
        int GebruikerNr,
        int VeilingNr
    );

    // Wordt gebruikt bij PUT (aanpassen van een bestaande bieding).
    public record BiedingUpdateDto(
        decimal BedragPerFust,
        int AantalStuks
    );
}