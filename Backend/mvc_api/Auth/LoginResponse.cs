using mvc_api.Models.Dtos;

namespace mvc_api.DTOs.Auth;

/// <summary>
/// representeert de terugkeer response na een login optie.
/// bevat informatie over de succesvolle login: authenticatie token en mogelijke errors die zijn opgelegd

/// <param name="Success">Of de login successvol is geweest of niet</param>
/// <param name="Token">de jwt token die gegeven is aan de gebruiker wanneer het succesvol is geweest/lege token die gefaald is</param>
/// <param name="RefreshToken">De refresh token die is meegegeven bij een succesvolle login/leeg is bij een gefaalde login</param>
/// <param name="Errors">Een readonly lijst van error strings</param>
public sealed record LoginResponse(bool Success, string? Token, string? RefreshToken, IReadOnlyList<string> Errors)
    : OperationResultDto(Success, Errors);
