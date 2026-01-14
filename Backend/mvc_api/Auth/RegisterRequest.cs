using System.ComponentModel.DataAnnotations;

namespace mvc_api.DTOs.Auth;

/// <summary>
/// Dit record definieert het gegevensmodel voor een registratieverzoek in de applicatie.
/// Het bevat alle benodigde velden voor het registreren van een nieuw account, inclusief validatie-attributen.
/// Bevat errorhandling wanneer er fouten zijn begaan.
/// </summary>
public sealed record RegisterRequest
{
    /// <summary>Emailadres van de gebruiker.</summary>
    [Required, EmailAddress, StringLength(200)]
    public string Email { get; init; } = string.Empty;

    /// <summary> Wachtwoordn van de gebruiker</summary>
    [Required, MinLength(6), DataType(DataType.Password)]
    public string Password { get; init; } = string.Empty;

    /// <summary>2e soort wachtwoord om het ingevoerde wachtwoord te veriferen </summary>
    [Required, DataType(DataType.Password)]
    [Compare(nameof(Password), ErrorMessage = "Wachtwoorden komen niet overeen.")]
    public string ConfirmPassword { get; init; } = string.Empty;

    /// <summary>bedrijfsnaam van de gebruiker </summary>
    [Required, StringLength(200)]
    public string BedrijfsNaam { get; init; } = string.Empty;

    /// <summary>Wat voor een soort gebruiker het is (kweker, koper etc...) </summary>
    [Required, StringLength(50)]
    [RegularExpression("^(Bedrijf|Koper)$", ErrorMessage = "Soort moet Kweker of Koper zijn.")]
    public string Soort { get; init; } = string.Empty;

    /// <summary>KVK element die de gebruiker meegeeft </summary>
    [StringLength(20)]
    [RegularExpression("^$|^\\d+$", ErrorMessage = "KVK moet alleen uit cijfers bestaan.")]
    public string? Kvk { get; init; }

    /// <summary>Adres dat de gebruiker meegeeft </summary>
    [StringLength(200)]
    public string? StraatAdres { get; init; }

    /// <summary>Postcode van de gebruiker </summary>
    [StringLength(10)]
    [RegularExpression("^$|^[1-9][0-9]{3}\\s?[A-Za-z]{2}$", ErrorMessage = "Postcode moet het formaat 1234 AB hebben.")]
    public string? Postcode { get; init; }

    /// <summary>
    /// Retourneert een nieuwe instantie van <see cref="RegisterRequest"/> waarbij alle stringvelden getrimd zijn.
    /// </summary>
    public RegisterRequest Trimmed() => this with
    {
        Email       = Email.Trim(),
        BedrijfsNaam = BedrijfsNaam.Trim(),
        Soort        = Soort.Trim(),
        Kvk          = Kvk?.Trim(),
        StraatAdres  = StraatAdres?.Trim(),
        Postcode     = Postcode?.Trim().ToUpperInvariant()
    };
}
