using mvc_api.Models.Dtos;

namespace mvc_api.DTOs.Auth;

/// <summary>
///     Geeft de waardes terug van een registratie of het goed is gegaan of fout is gegaan. 
///     Errorhandling strings die string meegeven wanneer het fout is gegaan
/// </summary>
/// <param name="Success">boolean waarde of de registratie succesvol is begaan</param>
/// <param name="Errors">Readonly waardes voor wanneer er errors zijn begaan in de registratie response</param>
public sealed record RegisterResponse(bool Success, IReadOnlyList<string> Errors)
    : OperationResultDto(Success, Errors);
