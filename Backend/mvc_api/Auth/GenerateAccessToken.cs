using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using mvc_api.Data;
using mvc_api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace mvc_api.Auth.GenereerAccessTokens;

public interface IGenereerAccessTokens
{
    Task<string> GenerateJwtToken(Gebruiker gebruiker); 

    Task<string> GenerateRefreshTokenAsync(Gebruiker user);

    Task<RefreshToken?> GetStoredRefreshToken(string token);
}

public class GenereerBearerToken : IGenereerAccessTokens
{
    private readonly IConfiguration _config;
    private readonly AppDbContext _dbContext;

    // SLECHTS ÉÉN CONSTRUCTOR
    public GenereerBearerToken(IConfiguration config, AppDbContext dbContext)
    {
        _config = config;
        _dbContext = dbContext;
    }

    public async Task<string> GenerateJwtToken(Gebruiker user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.GebruikerNr.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Role, user.Soort),
            new(JwtRegisteredClaimNames.Sub, user.GebruikerNr.ToString()),
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

    public async Task<string> GenerateRefreshTokenAsync(Gebruiker user)
    {
        // checked of de RefreshToken bestaat of niet op basis van gebruiker Id
        var existingToken = await _dbContext.RefreshTokens.SingleOrDefaultAsync(t => t.User_Id == user.Id);

        // maakt een nieuwe token waarde aan
        var NewToken_Waarde = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        // maakt een nieuwe verval datum aan
        var NewDate_expired = DateTime.UtcNow.AddDays(7);

        // checked of de token er is. Zo niet dan maakt die een nieuwe aan
        if (existingToken != null)
        {
            existingToken.Token = NewToken_Waarde;
            existingToken.ExpiryDate = NewDate_expired;
            existingToken.IsRevoked = false;

        } else
        {   
            // genereert een nieuwe refresh token
            var refreshToken = new RefreshToken
            {
                Token = NewToken_Waarde,
                User_Id = user.Id,
                Email = user.Email,
                ExpiryDate = NewDate_expired,
                IsRevoked = false
            };

            _dbContext.RefreshTokens.Add(refreshToken);   
        }

        // Zorgt ervoor dat er of een nieuwe item in de database staat of dat het veranderd is
        await _dbContext.SaveChangesAsync();

        return NewToken_Waarde;
    }

    public async Task<RefreshToken?> GetStoredRefreshToken(string token)
    {
        return await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == token && !t.IsRevoked);
    }
}