using System.ComponentModel.DataAnnotations;
using mvc_api.Models;

namespace mvc_api.Models.Dtos;

public static class GebruikerSoorten
{
    public static readonly string[] Allowed = { "Bedrijf", "Koper" };

    public static bool TryNormalize(string? value, out string normalized)
    {
        normalized = string.Empty;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        normalized = Allowed.FirstOrDefault(s => s.Equals(value.Trim(), StringComparison.OrdinalIgnoreCase)) ?? string.Empty;
        return normalized.Length > 0;
    }
}

public record GebruikerSelfUpdateDto(
    [property: Required, StringLength(200)] string BedrijfsNaam,
    [property: Required, EmailAddress, StringLength(200)] string Email,
    [property: StringLength(20), RegularExpression("^$|^\\d+$", ErrorMessage = "KVK moet alleen uit cijfers bestaan.")] string? Kvk,
    [property: StringLength(200)] string? StraatAdres,
    [property: StringLength(10), RegularExpression("^$|^[1-9][0-9]{3}\\s?[A-Za-z]{2}$", ErrorMessage = "Postcode moet het formaat 1234 AB hebben.")] string? Postcode
);

public record GebruikerSummaryDto(
    int GebruikerNr,
    string BedrijfsNaam,
    string Email,
    string Soort,
    string? Kvk,
    ModelStatus Status
);

public record GebruikerDetailDto(
    int GebruikerNr,
    string BedrijfsNaam,
    string Email,
    string Soort,
    string? Kvk,
    ModelStatus Status,
    string? StraatAdres,
    string? Postcode,
    DateTime? LaatstIngelogd
) : GebruikerSummaryDto(GebruikerNr, BedrijfsNaam, Email, Soort, Kvk, Status);
