using System.ComponentModel.DataAnnotations;

namespace mvc_api.DTOs.Auth;

public sealed record RegisterRequest
{
    [Required, EmailAddress, StringLength(200)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(6), DataType(DataType.Password)]
    public string Password { get; init; } = string.Empty;

    [Required, DataType(DataType.Password)]
    [Compare(nameof(Password), ErrorMessage = "Wachtwoorden komen niet overeen.")]
    public string ConfirmPassword { get; init; } = string.Empty;

    [Required, StringLength(200)]
    public string BedrijfsNaam { get; init; } = string.Empty;

    [Required, StringLength(50)]
    [RegularExpression("^(Bedrijf|Koper)$", ErrorMessage = "Soort moet Kweker of Koper zijn.")]
    public string Soort { get; init; } = string.Empty;

    [StringLength(20)]
    [RegularExpression("^$|^\\d+$", ErrorMessage = "KVK moet alleen uit cijfers bestaan.")]
    public string? Kvk { get; init; }

    [StringLength(200)]
    public string? StraatAdres { get; init; }

    [StringLength(10)]
    [RegularExpression("^$|^[1-9][0-9]{3}\\s?[A-Za-z]{2}$", ErrorMessage = "Postcode moet het formaat 1234 AB hebben.")]
    public string? Postcode { get; init; }

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
