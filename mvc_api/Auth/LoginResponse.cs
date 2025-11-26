namespace mvc_api.DTOs.Auth;

public sealed class LoginResponse
{
    public required bool Success { get; init; }

    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();
}