namespace mvc_api.DTOs.Auth;

public class RegisterResponse
{
    public bool Success { get; set; }

    public IEnumerable<string> Errors { get; set; } = Enumerable.Empty<string>();
}