using System.ComponentModel.DataAnnotations;
using mvc_api.Models;

namespace mvc_api.Models.Dtos;

public record GebruikerSelfUpdateDto(
    [property: Required, StringLength(200)] string BedrijfsNaam,
    [property: Required, EmailAddress, StringLength(200)] string Email,
    [property: StringLength(20)] string? Kvk,
    [property: StringLength(200)] string? StraatAdres,
    [property: StringLength(10)] string? Postcode
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
    string? Kvk,
    ModelStatus Status
);