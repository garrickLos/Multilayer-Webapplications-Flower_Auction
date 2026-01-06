using mvc_api.Auth.GenereerAccessTokens;
using mvc_api.Models;
using Xunit;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;

namespace mvc_api.Tests.Services;

public class GenereerBearerTokenTest
{

    [Fact]
    public async Task GetJwtToken()
    {
        var myTestSettings = new Dictionary<string, string>
        {
            {"Jwt:Key", "DitIsEenSuperGeheimWachtwoordVoorTesten123!"},
            {"Jwt:Issuer", "TestIssuer"},
            {"Jwt:Audience", "TestAudience"}
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(myTestSettings!)
            .Build();

        // 2. Arrange Database (De FIX)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // Unieke naam per test
            .Options;
        
        using var dbContext = new AppDbContext(options);

        var gebruiker = new Gebruiker{
                    Id = 1,
                    GebruikerNr = 1,
                    BedrijfsNaam = "Flora BV",
                    Email = "flora@gmail.com",
                    UserName = "flora@gmail.com",
                    LaatstIngelogd = new DateTime(2025, 10, 08, 12, 0, 0, DateTimeKind.Utc),
                    Soort = "VeilingMeester",
                    Kvk = "12345678",
                    StraatAdres = "Bloemig 10",
                    Postcode = "1234AB"
                };
        
        IGenereerAccessTokens _token = new GenereerBearerToken(configuration, dbContext);

        var response = _token.GenerateJwtToken(gebruiker);
        
        Assert.NotEmpty(response.ToString());
    }

    [Fact]
    public async Task ReadJwtToken()
    {   
        // Arrange
        var myTestSettings = new Dictionary<string, string>
        {
            {"Jwt:Key", "DitIsEenSuperGeheimWachtwoordVoorTesten123!"},
            {"Jwt:Issuer", "TestIssuer"},
            {"Jwt:Audience", "TestAudience"}
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(myTestSettings!)
            .Build();

        // 2. Arrange Database (De FIX)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // Unieke naam per test
            .Options;
        
        using var dbContext = new AppDbContext(options);

        // maakt een simpele gebruiker aan
        var gebruiker = new Gebruiker{
            Id = 1,
            GebruikerNr = 1,
            BedrijfsNaam = "Flora BV",
            Email = "flora@gmail.com",
            Soort = "VeilingMeester"
        };

        IGenereerAccessTokens _token = new GenereerBearerToken(configuration, dbContext);

        // Act
        // Gebruik await om de string direct uit de Task te halen
        var tokenString = await _token.GenerateJwtToken(gebruiker);

        // Zet de string om naar een leesbaar token object
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(tokenString);

        // Assert
        // Haal de specifieke claim op uit de lijst
        var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email");

        // Controleer of de claim bestaat
        Assert.NotNull(emailClaim);
        
        // Controleer of de waarde klopt
        Assert.Equal("flora@gmail.com", emailClaim.Value);
    }
}