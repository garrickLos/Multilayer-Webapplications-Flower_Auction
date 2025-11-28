using System.ComponentModel.DataAnnotations;
using mvc_api.Models;

namespace mvc_api.Models.Dtos;

public record VeilingproductCreateDto(
    [property: Required, StringLength(200)] string Naam,
    DateTime? GeplaatstDatum,
    [property: Range(1, int.MaxValue)] int AantalFusten,
    [property: Range(0, int.MaxValue)] int VoorraadBloemen,
    [property: Range(1, int.MaxValue)] int? Startprijs,
    [property: Range(1, int.MaxValue)] int CategorieNr,
    [property: StringLength(200)] string Plaats,
    [property: Range(1, 999999999)] int Minimumprijs,
    [property: Range(1, int.MaxValue)] int Kwekernr,
    DateOnly beginDatum,
    [property: Required, StringLength(200)] string ImagePath
);

public record VeilingproductUpdateDto(
    [property: Required, StringLength(200)] string Naam,
    DateTime? GeplaatstDatum,
    [property: Range(1, int.MaxValue)] int AantalFusten,
    [property: Range(0, int.MaxValue)] int VoorraadBloemen,
    [property: Range(1, int.MaxValue)] int? Startprijs,
    [property: Range(1, int.MaxValue)] int CategorieNr,
    [property: Range(1, int.MaxValue)] int? VeilingNr,
    [property: Range(1, int.MaxValue)] int Kwekernr,
    [property: Required, StringLength(200)] string ImagePath,
    [property: Range(1, 999999999)] int Minimumprijs,
    [property: StringLength(200)] string Plaats
);

public record VeilingproductStatusUpdateDto(
    [property: Required] ModelStatus Status
);

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

public record VeilingproductPublicDetailDto(
    int VeilingProductNr,
    string Naam,
    string? CategorieNaam,
    string ImagePath,
    string Plaats,
    int VoorraadBloemen,
    int AantalFusten,
    int? Startprijs,
    int Minimumprijs,
    DateTime GeplaatstDatum,
    string VerkoperNaam
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

public record VeilingproductKwekerDetailDto(
    int VeilingProductNr,
    string Naam,
    string? CategorieNaam,
    ModelStatus Status,
    int? Startprijs,
    int Minimumprijs,
    int AantalFusten,
    int VoorraadBloemen,
    string Plaats,
    DateTime GeplaatstDatum,
    int? VeilingNr,
    string ImagePath,
    DateOnly beginDatum
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

public record VeilingproductVeilingmeesterDetailDto(
    int VeilingProductNr,
    string Naam,
    string? CategorieNaam,
    ModelStatus Status,
    int? VeilingNr,
    int? Startprijs,
    int Minimumprijs,
    int AantalFusten,
    int VoorraadBloemen,
    string Plaats,
    DateTime GeplaatstDatum,
    string ImagePath,
    int Kwekernr,
    string VerkoperNaam
);

public record VeilingproductAdminListDto(
    int VeilingProductNr,
    string Naam,
    string? CategorieNaam,
    ModelStatus Status,
    int? VeilingNr,
    int? Startprijs,
    int Minimumprijs,
    string Plaats,
    int Kwekernr,
    string VerkoperNaam
);

public record VeilingproductAdminDetailDto(
    int VeilingProductNr,
    string Naam,
    string? CategorieNaam,
    int? VeilingNr,
    ModelStatus Status,
    int? Startprijs,
    int Minimumprijs,
    int AantalFusten,
    int VoorraadBloemen,
    string Plaats,
    DateTime GeplaatstDatum,
    string ImagePath,
    int Kwekernr,
    string VerkoperNaam,
    string VerkoperEmail
);
