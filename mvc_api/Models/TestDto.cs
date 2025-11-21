using System.ComponentModel.DataAnnotations;

namespace mvc_api.Models;

// De basis DTO met gedeelde velden
public abstract record VeilingproductBaseDto
{
    public int VeilingProductNr { get; init; } // Toegevoegd omdat dit essentieel is

    [Required, StringLength(200)] public string Naam { get; init; } = string.Empty;
    public DateTime? GeplaatstDatum { get; init; }
    [Range(1, int.MaxValue)] public int AantalFusten { get; init; }
    [Range(0, int.MaxValue)] public int VoorraadBloemen { get; init; }
    public decimal Startprijs { get; init; }
    [Range(1, int.MaxValue)] public int CategorieNr { get; init; }
    public string? CategorieNaam { get; init; } // Handig voor output
    [Required, StringLength(200)] public string ImagePath { get; init; } = string.Empty;
    [Range(1, int.MaxValue)] public int VeilingNr { get; init; }
}

// Concrete klasse voor de 'gewone' gebruiker
public record VeilingProductPublicDto : VeilingproductBaseDto;

// Uitgebreide klasse voor de Kweker
public record VeilingProductKwekerDto : VeilingproductBaseDto
{
    public string Plaats { get; init; } = string.Empty;
    public int Minimumprijs { get; init; }
    public DateTime? BeginDatum { get; init; } // Nullable gemaakt voor veiligheid
    public bool Status { get; init; }
}