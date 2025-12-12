using mvc_api.Auth.GenereerBearerToken;
using mvc_api.Models;
using Xunit;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Castle.Core.Configuration;
using Microsoft.Extensions.Configuration;

namespace mvc_api.Tests.Services;

public class GenereerBearerTokenTest
{

    readonly GenereerBearerToken _token = new GenereerBearerToken();

    [Fact]
    public async Task GetJwtToken()
    {
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

        var response = _token.GenerateJwtToken(gebruiker);
        
        Assert.NotEmpty(response.ToString());
    }

    // [Fact]
    // public async Task ReadJwtToken()
    // {   
    //     var myTestSettings = new Dictionary<string, string>
    //     {
    //         {"Jwt:Key", "DitIsEenSuperGeheimWachtwoordVoorTesten123!"},
    //         {"Jwt:Issuer", "TestIssuer"},
    //         {"Jwt:Audience", "TestAudience"}
    //     };

    //     var configuration = new ConfigurationBuilder()
    //     .AddInMemoryCollection(myTestSettings!)
    //     .Build();

    //     // Arrange
    //     // maakt een simpele gebruiker aan
    //     var gebruiker = new Gebruiker{
    //         Id = 1,
    //         GebruikerNr = 1,
    //         BedrijfsNaam = "Flora BV",
    //         Email = "flora@gmail.com",
    //         Soort = "VeilingMeester"
    //     };

    //     // Act
    //     // Gebruik await om de string direct uit de Task te halen
    //     var tokenString = await _token.GenerateJwtToken(gebruiker);

    //     // Zet de string om naar een leesbaar token object
    //     var handler = new JwtSecurityTokenHandler();
    //     var jwtToken = handler.ReadJwtToken(tokenString);

    //     // 3. Assert
    //     // Haal de specifieke claim op uit de lijst
    //     // Let op: Soms wordt ClaimTypes.Email vertaald naar simpelweg "email" in de token
    //     var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email");

    //     // Controleer of de claim bestaat
    //     Assert.NotNull(emailClaim);
        
    //     // Controleer of de waarde klopt
    //     Assert.Equal("flora@gmail.com", emailClaim.Value);
    // }
}