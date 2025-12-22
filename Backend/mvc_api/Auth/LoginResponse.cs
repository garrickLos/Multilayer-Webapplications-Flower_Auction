using mvc_api.Models.Dtos;

namespace mvc_api.DTOs.Auth;

public sealed record LoginResponse(bool Success, string? Token, string? RefreshToken, IReadOnlyList<string> Errors)
    : OperationResultDto(Success, Errors);
