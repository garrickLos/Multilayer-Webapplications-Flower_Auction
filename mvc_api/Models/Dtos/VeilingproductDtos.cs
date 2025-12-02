using System;
using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using mvc_api.Models;

namespace mvc_api.Models.Dtos;

public record VeilingproductCreateDto
{
    [Required, StringLength(200)]
    public string Naam { get; init; } = default!;

    public DateTime? GeplaatstDatum { get; init; }

    [Range(1, int.MaxValue)]
    public int AantalFusten { get; init; }

    [Range(0, int.MaxValue)]
    public int VoorraadBloemen { get; init; }

    [Range(1, int.MaxValue)]
    public int CategorieNr { get; init; }

    [StringLength(200)]
    public string Plaats { get; init; } = string.Empty;

    [Range(1, 999_999_999)]
    public int Minimumprijs { get; init; }

    [Range(1, int.MaxValue)]
    public int Kwekernr { get; init; }

    [Required]
    public DateOnly BeginDatum { get; init; }

    [Required]
    public DateOnly EindDatum { get; init; }

    [Required, StringLength(200)]
    public string ImagePath { get; init; } = default!;
}

public record VeilingproductUpdateDto
{
    [Required, StringLength(200)]
    public string Naam { get; init; } = default!;

    public DateTime? GeplaatstDatum { get; init; }

    [Range(1, int.MaxValue)]
    public int AantalFusten { get; init; }

    [Range(0, int.MaxValue)]
    public int VoorraadBloemen { get; init; }

    [Range(1, int.MaxValue)]
    public int CategorieNr { get; init; }

    [Range(1, int.MaxValue)]
    public int? VeilingNr { get; init; }

    [Range(1, int.MaxValue)]
    public int Kwekernr { get; init; }

    [Required, StringLength(200)]
    public string ImagePath { get; init; } = default!;

    [Range(1, 999_999_999)]
    public int Minimumprijs { get; init; }

    public string Plaats { get; init; } = string.Empty;
}

public record VeilingproductVeilingmeesterUpdateDto
{
    [Range(1, 999_999_999)]
    public int? Startprijs { get; init; }

    [Range(1, int.MaxValue)]
    public int? VeilingNr { get; init; }
}

// READ DTOs
public record VeilingproductPublicListDto(
    int VeilingProductNr,
    string Naam,
    string? CategorieNaam,
    string ImagePath,
    string Plaats,
    int VoorraadBloemen,
    int AantalFusten,
    int? Startprijs
);

public record VeilingproductKwekerListDto(
    int VeilingProductNr,
    string Naam,
    ModelStatus Status,
    int? Startprijs,
    int Minimumprijs,
    int AantalFusten,
    int VoorraadBloemen,
    int? VeilingNr
);

public record VeilingproductVeilingmeesterListDto(
    int VeilingProductNr,
    string Naam,
    string? CategorieNaam,
    ModelStatus Status,
    int? VeilingNr,
    int Kwekernr,
    string VerkoperNaam,
    int? Startprijs,
    int Minimumprijs
);

// SELECTORS
public static class VeilingproductDtoSelectors
{
    public static readonly Expression<Func<Veilingproduct, VeilingproductPublicListDto>> PublicList = v => new(
        v.VeilingProductNr,
        v.Naam,
        v.Categorie == null ? null : v.Categorie.Naam,
        v.ImagePath,
        v.Plaats,
        v.VoorraadBloemen,
        v.AantalFusten,
        v.Startprijs
    );

    public static readonly Expression<Func<Veilingproduct, VeilingproductKwekerListDto>> KwekerList = v => new(
        v.VeilingProductNr,
        v.Naam,
        v.Status,
        v.Startprijs,
        v.Minimumprijs,
        v.AantalFusten,
        v.VoorraadBloemen,
        v.VeilingNr
    );

    public static readonly Expression<Func<Veilingproduct, VeilingproductVeilingmeesterListDto>> VeilingmeesterList = v => new(
        v.VeilingProductNr,
        v.Naam,
        v.Categorie == null ? null : v.Categorie.Naam,
        v.Status,
        v.VeilingNr,
        v.Kwekernr,
        v.Gebruiker.BedrijfsNaam,
        v.Startprijs,
        v.Minimumprijs
    );
}
