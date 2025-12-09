using mvc_api.Models.Dtos;

namespace mvc_api.DTOs.Auth;

public sealed record LoginResponse(bool Success, string? Token, IReadOnlyList<string> Errors)
    : OperationResultDto(Success, Errors);
