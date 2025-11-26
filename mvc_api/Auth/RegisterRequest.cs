using System.ComponentModel.DataAnnotations;

namespace mvc_api.DTOs.Auth;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Compare(nameof(Password), ErrorMessage = "Wachtwoorden komen niet overeen.")]
    public string ConfirmPassword { get; set; } = string.Empty;

    // Komt overeen met Gebruiker.BedrijfsNaam
    [Required]
    [StringLength(200)]
    public string BedrijfsNaam { get; set; } = string.Empty;

    // Komt overeen met Gebruiker.Soort (Bedrijf/Koper)
    [Required]
    [StringLength(50)]
    public string Soort { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Kvk { get; set; }

    [StringLength(200)]
    public string? StraatAdres { get; set; }

    [StringLength(10)]
    public string? Postcode { get; set; }
}