using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Controllers;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Models.Dtos;

namespace mvc_api.Tests.Controllers;

public class GebruikerControllerTests
{
    private static GebruikerController BuildController(string dbName, ClaimsPrincipal user)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var dbContext = new AppDbContext(options);

        dbContext.Gebruikers.AddRange(
            new Gebruiker { GebruikerNr = 1, BedrijfsNaam = "Bloem BV", Email = "info@bloem.nl", Soort = "Kweker", Status = ModelStatus.Active },
            new Gebruiker { GebruikerNr = 2, BedrijfsNaam = "Roos BV", Email = "contact@roos.nl", Soort = "Koper", Status = ModelStatus.Inactive },
            new Gebruiker { GebruikerNr = 3, BedrijfsNaam = "Tulpen BV", Email = "sales@tulp.nl", Soort = "Kweker", Status = ModelStatus.Deleted }
        );
        dbContext.SaveChanges();

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
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "Kweker")
        }, "mock"));
        var controller = BuildController(nameof(GetSelf_WithValidUser_ReturnsOwnDetails), user);

        var response = controller.GetSelf();

        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var dto = Assert.IsType<GebruikerDetailDto>(okResult.Value);
        Assert.Equal(1, dto.GebruikerNr);
    }

    [Fact(DisplayName = "Fout: onbekende identiteit leidt tot Unauthorized")]
    public void GetSelf_WithUnknownUser_ReturnsUnauthorized()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "999")
        }, "mock"));
        var controller = BuildController(nameof(GetSelf_WithUnknownUser_ReturnsUnauthorized), user);

        var response = controller.GetSelf();

        Assert.IsType<UnauthorizedResult>(response.Result);
    }

    [Fact(DisplayName = "Beslissingsdekking: filters op rol en status worden gecombineerd")]
    public void GetForAuctionTeam_AppliesRoleAndStatusFilters()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "VeilingMeester")
        }, "mock"));
        var controller = BuildController(nameof(GetForAuctionTeam_AppliesRoleAndStatusFilters), user);

        var response = controller.GetForAuctionTeam(role: "kweker", status: ModelStatus.Active);

        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<GebruikerSummaryDto>>(okResult.Value);
        var single = Assert.Single(dtos);
        Assert.Equal("Bloem BV", single.BedrijfsNaam);
    }

    [Fact(DisplayName = "Fout: gedeactiveerde gebruiker kan zichzelf niet ophalen")]
    public void GetSelf_WithInactiveUser_ReturnsUnauthorized()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "2"),
            new Claim(ClaimTypes.Role, "Koper")
        }, "mock"));
        var controller = BuildController(nameof(GetSelf_WithInactiveUser_ReturnsUnauthorized), user);

        var response = controller.GetSelf();

        Assert.IsType<UnauthorizedResult>(response.Result);
    }

    [Fact(DisplayName = "Beslissingsdekking: verwijderde gebruikers worden uitgesloten in teamlijst")]
    public void GetForAuctionTeam_ExcludesDeletedUsers()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "VeilingMeester")
        }, "mock"));
        var controller = BuildController(nameof(GetForAuctionTeam_ExcludesDeletedUsers), user);

        var response = controller.GetForAuctionTeam(role: null, status: null);

        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<GebruikerSummaryDto>>(okResult.Value);
        Assert.DoesNotContain(dtos, d => d.Status == ModelStatus.Deleted);
    }
}
