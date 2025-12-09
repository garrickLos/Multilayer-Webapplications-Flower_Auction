using mvc_api.Models.Dtos;

namespace mvc_api.DTOs.Auth;

public sealed record RegisterResponse(bool Success, IReadOnlyList<string> Errors)
    : OperationResultDto(Success, Errors);
