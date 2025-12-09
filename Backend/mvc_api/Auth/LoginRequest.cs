using System.ComponentModel.DataAnnotations;

namespace mvc_api.DTOs.Auth;

public sealed class LoginRequest
{
    [Required(ErrorMessage = "Email is verplicht.")]
    [EmailAddress(ErrorMessage = "Voer een geldig e-mailadres in.")]
    public required string Email { get; init; }

    [Required(ErrorMessage = "Wachtwoord is verplicht.")]
    [MinLength(6, ErrorMessage = "Wachtwoord moet minimaal 6 tekens lang zijn.")]
    public required string Password { get; init; }
    
    public bool RememberMe { get; init; }
}