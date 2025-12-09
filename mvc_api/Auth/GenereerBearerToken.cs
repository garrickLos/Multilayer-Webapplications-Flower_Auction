using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using mvc_api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace mvc_api.Auth.GenereerBearerToken;

public class GenereerBearerToken
{

    private readonly UserManager<Gebruiker> _userManager;
    private readonly IConfiguration _config;

    public GenereerBearerToken(UserManager<Gebruiker> userManager, IConfiguration config)
    {
        _userManager = userManager;
        _config = config; 
    }

    public async Task<string> GenerateJwtToken(Gebruiker user)
    {
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Role, user.Soort),
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        
        var token = new JwtSecurityToken(
            issuer:   _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims:   claims,
            expires:  DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}