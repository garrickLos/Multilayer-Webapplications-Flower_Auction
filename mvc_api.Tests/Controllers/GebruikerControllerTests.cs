using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using mvc_api.Controllers;
using mvc_api.Models;
using mvc_api.Models.Dtos;
using mvc_api.Tests;
using Xunit;

namespace mvc_api.Tests.Controllers;

/// <summary>
/// Unit tests for GebruikerController using an in-memory AppDbContext via the IAppDbContext
/// abstraction. Authentication is simulated with ClaimsPrincipal so no echte database or
/// identity server is needed.
/// </summary>
public class GebruikerControllerTests
{
    [Fact]
    public void GetSelf_WithValidAuthenticatedUser_ReturnsOwnDetails()
    {
        // Arrange
        var db = TestDbContextFactory.CreateContext(nameof(GetSelf_WithValidAuthenticatedUser_ReturnsOwnDetails));
        var gebruiker = new Gebruiker
        {
            Id            = 1,
            GebruikerNr   = 1,
            BedrijfsNaam  = "Tulip BV",
            Email         = "tulip@example.com",
            Soort         = "Kweker",
            Status        = ModelStatus.Active,
            Kvk           = "1234"
        };
        db.Gebruikers.Add(gebruiker);
        db.SaveChanges();

        var controller = new GebruikerController(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = BuildUserPrincipal("1")
                }
            }
        };

        // Act
        var result = controller.GetSelf();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto      = Assert.IsType<GebruikerDetailDto>(okResult.Value);
        Assert.Equal(gebruiker.GebruikerNr, dto.GebruikerNr);
        Assert.Equal(gebruiker.Email, dto.Email);
        Assert.Equal(gebruiker.StraatAdres, dto.StraatAdres);
    }

    [Fact]
    public void GetSelf_WithMissingClaim_ReturnsUnauthorized()
    {
        // Arrange
        var db          = TestDbContextFactory.CreateContext(nameof(GetSelf_WithMissingClaim_ReturnsUnauthorized));
        var controller  = new GebruikerController(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) }
            }
        };

        // Act
        var result = controller.GetSelf();

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public void GetSelf_WithInactiveUser_ReturnsUnauthorized()
    {
        // Arrange
        var db = TestDbContextFactory.CreateContext(nameof(GetSelf_WithInactiveUser_ReturnsUnauthorized));
        db.Gebruikers.Add(new Gebruiker
        {
            Id           = 2,
            GebruikerNr  = 2,
            BedrijfsNaam = "Slapende BV",
            Email        = "asleep@example.com",
            Soort        = "Koper",
            Status       = ModelStatus.Inactive
        });
        db.SaveChanges();

        var controller = new GebruikerController(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = BuildUserPrincipal("2") }
            }
        };

        // Act
        var result = controller.GetSelf();

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    private static ClaimsPrincipal BuildUserPrincipal(string id) =>
        new(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, id) }, "Test"));
}
