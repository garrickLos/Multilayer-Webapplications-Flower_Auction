using Microsoft.AspNetCore.Identity;

namespace mvc_api.Models;

/// <summary>
/// klas representatie van de refreshToken die gebruikt wordt.
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }
    
    public string? Token { get; set; }
    
    public int User_Id { get; set; }
    
    public string? Email { get; set; }
    
    public DateTime ExpiryDate { get; set; }
    
    public bool IsRevoked { get; set; }
}