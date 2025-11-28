using System.ComponentModel.DataAnnotations;
using mvc_api.Models;

namespace mvc_api.Models.Dtos;

public abstract record GebruikerBaseDto
{
    [Required, StringLength(200)]
    public string BedrijfsNaam { get; init; } = string.Empty;

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(50)]
    public string Soort { get; init; } = string.Empty;

    [StringLength(20)]
    public string? Kvk { get; init; }

    [StringLength(200)]
    public string? StraatAdres { get; init; }

    [StringLength(10)]
    public string? Postcode { get; init; }
}

public record GebruikerCreateDto : GebruikerBaseDto;

public record GebruikerUpdateDto : GebruikerBaseDto;

public record GebruikerSelfUpdateDto(
    [property: Required, StringLength(200)] string BedrijfsNaam,
    [property: Required, EmailAddress, StringLength(200)] string Email,
    [property: StringLength(20)] string? Kvk,
    [property: StringLength(200)] string? StraatAdres,
    [property: StringLength(10)] string? Postcode
);

public record GebruikerStatusUpdateDto(
    [property: Required] ModelStatus Status
);

public record GebruikerAdminListDto(
    int GebruikerNr,
    string BedrijfsNaam,
    string Email,
    string Soort,
    ModelStatus Status
);

public record GebruikerAdminDetailDto(
    int GebruikerNr,
    string BedrijfsNaam,
    string Email,
    string Soort,
    string? Kvk,
    string? StraatAdres,
    string? Postcode,
    ModelStatus Status,
    DateTime? LaatstIngelogd
);

public record GebruikerSelfDto(
    int GebruikerNr,
    string BedrijfsNaam,
    string Email,
    string Soort,
    string? Kvk,
    string? StraatAdres,
    string? Postcode,
    DateTime? LaatstIngelogd,
    ModelStatus Status
);

public record GebruikerAuctionViewDto(
    int GebruikerNr,
    string BedrijfsNaam,
    string Email,
    string Soort,
    ModelStatus Status
);

public record GebruikerPublicDto(
    int GebruikerNr,
    string BedrijfsNaam,
    string Email,
    ModelStatus Status
);
