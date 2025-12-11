using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Controllers;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Models.Dtos;
using Xunit;

namespace mvc_api.Tests.Controllers;

public class GebruikerControllerTests
{
    // lokale memory DB + controller met fake user
    private static GebruikerController BuildController(string dbName, ClaimsPrincipal user)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName);
        var dbContext = new AppDbContext(options.Options);

        // seed gebruikers
        dbContext.Gebruikers.AddRange(
            new Gebruiker { GebruikerNr = 1, BedrijfsNaam = "Bloem BV", Email = "info@bloem.nl", Soort = "Bedrijf", Status = ModelStatus.Active },
            new Gebruiker { GebruikerNr = 2, BedrijfsNaam = "Roos BV", Email = "contact@roos.nl", Soort = "Koper", Status = ModelStatus.Inactive },
            new Gebruiker { GebruikerNr = 3, BedrijfsNaam = "Tulpen BV", Email = "sales@tulp.nl", Soort = "Bedrijf", Status = ModelStatus.Deleted }
        );
        dbContext.SaveChanges();

        // koppel fake user aan HttpContext
        return new GebruikerController(dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            }
        };
    }

    [Fact(DisplayName = "Succes: geautoriseerde gebruiker haalt eigen details op")]
    public void GetSelf_WithValidUser_ReturnsOwnDetails()
    {
        // arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "Bedrijf")
        }, "mock"));
        var controller = BuildController(nameof(GetSelf_WithValidUser_ReturnsOwnDetails), user);

        // act
        var response = controller.GetSelf();

        // assert
        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var dto = Assert.IsType<GebruikerDetailDto>(okResult.Value);
        Assert.Equal(1, dto.GebruikerNr);
    }

    [Fact(DisplayName = "Fout: onbekende identiteit leidt tot Unauthorized")]
    public void GetSelf_WithUnknownUser_ReturnsUnauthorized()
    {
        // arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "999")
        }, "mock"));
        var controller = BuildController(nameof(GetSelf_WithUnknownUser_ReturnsUnauthorized), user);

        // act
        var response = controller.GetSelf();

        // assert
        Assert.IsType<UnauthorizedResult>(response.Result);
    }

    [Fact(DisplayName = "Beslissingsdekking: filters op rol en status worden gecombineerd")]
    public void GetForAuctionTeam_AppliesRoleAndStatusFilters()
    {
        // arrange: veilingmeester
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "VeilingMeester")
        }, "mock"));
        var controller = BuildController(nameof(GetForAuctionTeam_AppliesRoleAndStatusFilters), user);

        // act: filters rol + status
        var response = controller.GetForAuctionTeam(role: "bedrijf", status: ModelStatus.Active);

        // assert
        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<GebruikerSummaryDto>>(okResult.Value);
        var single = Assert.Single(dtos);
        Assert.Equal("Bloem BV", single.BedrijfsNaam);
    }

    [Fact(DisplayName = "Fout: gedeactiveerde gebruiker kan zichzelf niet ophalen")]
    public void GetSelf_WithInactiveUser_ReturnsUnauthorized()
    {
        // arrange: inactive gebruiker
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "2"),
            new Claim(ClaimTypes.Role, "Koper")
        }, "mock"));
        var controller = BuildController(nameof(GetSelf_WithInactiveUser_ReturnsUnauthorized), user);

        // act
        var response = controller.GetSelf();

        // assert
        Assert.IsType<UnauthorizedResult>(response.Result);
    }

    [Fact(DisplayName = "Beslissingsdekking: verwijderde gebruikers worden uitgesloten in teamlijst")]
    public void GetForAuctionTeam_ExcludesDeletedUsers()
    {
        // arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "VeilingMeester")
        }, "mock"));
        var controller = BuildController(nameof(GetForAuctionTeam_ExcludesDeletedUsers), user);

        // act
        var response = controller.GetForAuctionTeam(role: null, status: null);

        // assert: geen Deleted in resultaat
        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<GebruikerSummaryDto>>(okResult.Value);
        Assert.DoesNotContain(dtos, d => d.Status == ModelStatus.Deleted);
    }
}
