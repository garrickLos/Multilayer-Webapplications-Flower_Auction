using Microsoft.AspNetCore.Identity;

namespace mvc_api.Models;

public class RefreshToken
{
    public int Id { get; set; }
    
    public string Token { get; set; }
    
    public int User_Id { get; set; }
    
    public string Email { get; set; }
    
    // public IdentityUser user { get; set; }
    
    public DateTime ExpiryDate { get; set; }
    
    public bool IsRevoked { get; set; }
}