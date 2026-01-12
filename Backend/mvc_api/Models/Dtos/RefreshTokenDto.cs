namespace mvc_api.Models.Dtos;

public record RefreshRequest(
    string Token, 
    string RefreshToken
);