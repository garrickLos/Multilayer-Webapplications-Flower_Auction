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

    [Required]
    public DateOnly BeginDatum { get; init; }

    [Required, StringLength(200)]
    public string ImagePath { get; init; } = default!;
}

public record VeilingproductUpdateDto
{
    // String is nu nullable (string?) en Required is weg.
    [StringLength(200)]
    public string? Naam { get; init; }

    public DateTime? GeplaatstDatum { get; init; }

    // Int is nu nullable (int?). Range werkt nog steeds als er wel een getal wordt ingevuld.
    [Range(0, int.MaxValue)]
    public int? AantalFusten { get; init; }

    [Range(0, int.MaxValue)]
    public int? VoorraadBloemen { get; init; }

    [Range(1, int.MaxValue)]
    public int? CategorieNr { get; init; }

    [StringLength(200)]
    public string? ImagePath { get; init; }

    [Range(1, 999_999_999)]
    public int? Minimumprijs { get; init; }

    public string? Plaats { get; init; }
}

// VEILINGMEESTER UPDATE
public record VeilingproductVeilingmeesterUpdateDto
{
    [Range(typeof(decimal), "0.01", "999999999")]
    public int? Startprijs { get; init; }

    [Range(1, int.MaxValue)]
    public int? VeilingNr { get; init; }
}

// public read
public record VeilingproductPublicListDto(
    int VeilingProductNr,
    string Naam,
    string ImagePath,
    int AantalFusten,
    int? VeilingNr,
    int? Startprijs,
    int? GebruikerNr
);

// kweker lijst
public record VeilingproductKwekerListDto(
    int? VeilingProductNr,
    string? Naam,
    DateTime? GeplaatstDatum,
    int? AantalFusten,
    int? VoorraadBloemen,
    string? CategorieNaam,
    string? ImagePath,
    string? Plaats,
    decimal? Startprijs,
    int? Minimumprijs,
    int? VeilingNr
);

// veilingmeester lijst
public record VeilingproductVeilingmeesterListDto(
    int VeilingProductNr,
    string Naam,
    string? CategorieNaam,
    ModelStatus Status,
    int? VeilingNr,
    int Kwekernr,
    int AantalFusten,
    int VoorraadBloemen,
    string Plaats,
    int Minimumprijs,
    decimal? Startprijs,
    DateTime GeplaatstDatum,
    string ImagePath,
    DateOnly? BeginDatum
);

//tijdelijke dtos
//kweker get dto
public sealed record kwekerVeilingproductGet_dto
(
    int VeilingProductNr,
    string Naam,
    DateTime GeplaatstDatum,
    int Fust,
    int Voorraad,
    string? Categorie,
    string ImagePath,
    string Plaats
);
//info voor klant
public sealed record klantVeilingproductGet_dto
(
    int VeilingProductNr,
    string Naam,
    string Categorie,
    string ImagePath,
    string Plaats
);

public static class VeilingproductDtoSelectors
{
    public static readonly Expression<Func<Veilingproduct, VeilingproductPublicListDto>> PublicList = v =>
        new(
            v.VeilingProductNr,
            v.Naam,
            v.ImagePath,
            v.VoorraadBloemen,
            v.VeilingNr,
            v.Startprijs,
            v.Kwekernr
        );

    public static readonly Expression<Func<Veilingproduct, VeilingproductKwekerListDto>> KwekerList = v =>
        new(
            v.VeilingProductNr,
            v.Naam,
            v.GeplaatstDatum,
            v.AantalFusten,
            v.VoorraadBloemen,
            v.Categorie == null ? null : v.Categorie.Naam,
            v.ImagePath,
            v.Plaats,
            v.Startprijs,
            v.Minimumprijs,
            v.VeilingNr
        );

    public static readonly Expression<Func<Veilingproduct, VeilingproductVeilingmeesterListDto>> VeilingmeesterList = v =>
        new(
            v.VeilingProductNr,
            v.Naam,
            v.Categorie == null ? null : v.Categorie.Naam,
            v.Status,
            v.VeilingNr,
            v.Kwekernr,
            v.AantalFusten,
            v.VoorraadBloemen,
            v.Plaats,
            v.Minimumprijs,
            v.Startprijs,
            v.GeplaatstDatum,
            v.ImagePath,
            v.BeginDatum
        );
}
