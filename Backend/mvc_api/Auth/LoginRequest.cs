using System.ComponentModel.DataAnnotations;

namespace mvc_api.DTOs.Auth;

/// <summary>
/// ErrorMessages die terug worden gestuurd het moment dat er een fout inloggegevens worden gegeven.
/// </summary>
public sealed class LoginRequest
{
    // wanneer de email leeg is
    [Required(ErrorMessage = "Email is verplicht.")]
    [EmailAddress(ErrorMessage = "Voer een geldig e-mailadres in.")]
    public required string Email { get; init; }

    // Voor als het wachtwoord dat gegeven wordt minder is dan 6 tekens
    [Required(ErrorMessage = "Wachtwoord is verplicht.")]
    [MinLength(6, ErrorMessage = "Wachtwoord moet minimaal 6 tekens lang zijn.")]
    public required string Password { get; init; }
    
    public bool RememberMe { get; init; }
}