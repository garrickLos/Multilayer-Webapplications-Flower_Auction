using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using mvc_api.Controllers;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Models.Dtos;
using Xunit;

namespace mvc_api.Tests.Controllers;

public class BiedingControllerTests
{
    private const string rol_VeilingMeester = "VeilingMeester";
    private const string rol_Koper = "Koper";
    private const string rol_Bedrijf = "Bedrijf";

    private const string StatusActive = "Active";
    private const string StatusInactive = "Inactive";

    private static BiedingController BuildController(string dbName, ClaimsPrincipal? user = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var dbContext = new AppDbContext(options);

        if (!dbContext.Biedingen.Any())
        {
            // 1. Seed Gebruikers (Nodig voor Create checks)
            dbContext.Gebruikers.AddRange(
                new Gebruiker { GebruikerNr = 1, BedrijfsNaam = "Koper Een", Soort = rol_Koper },
                new Gebruiker { GebruikerNr = 2, BedrijfsNaam = "Koper Twee", Soort = rol_Koper },
                new Gebruiker { GebruikerNr = 3, BedrijfsNaam = "Bedrijf Drie", Soort = rol_Bedrijf },
                new Gebruiker { GebruikerNr = 4, BedrijfsNaam = "VeilingMeester", Soort = rol_VeilingMeester}
            );

            // 2. Seed Veilingen en Producten (Nodig voor Create checks en Includes)
            dbContext.Veilingen.AddRange(
                new Veiling { VeilingNr = 10, Status = StatusActive },
                new Veiling { VeilingNr = 20, Status = StatusInactive }
            );

            dbContext.Veilingproducten.AddRange(
                // Producten in actieve veiling
                new Veilingproduct { VeilingProductNr = 101, VeilingNr = 10, Naam = "Tulp Rood" },
                new Veilingproduct { VeilingProductNr = 102, VeilingNr = 10, Naam = "Tulp Geel" },
                new Veilingproduct { VeilingProductNr = 103, VeilingNr = 10, Naam = "Roos Wit" },
                new Veilingproduct { VeilingProductNr = 104, VeilingNr = 10, Naam = "Roos Rood" },
                // Product in inactieve veiling
                new Veilingproduct { VeilingProductNr = 105, VeilingNr = 20, Naam = "Oude Tulp" } 
            );

            // 3. Seed Biedingen (Jouw originele data)
            dbContext.Biedingen.AddRange(
                new Bieding { BiedNr = 1, BedragPerFust = 150, AantalStuks = 10, GebruikerNr = 1, VeilingproductNr = 101 },
                new Bieding { BiedNr = 2, BedragPerFust = 5000, AantalStuks = 1000, GebruikerNr = 1, VeilingproductNr = 101 },
                new Bieding { BiedNr = 3, BedragPerFust = 1, AantalStuks = 1, GebruikerNr = 2, VeilingproductNr = 102 },
                new Bieding { BiedNr = 4, BedragPerFust = 1250, AantalStuks = 50, GebruikerNr = 2, VeilingproductNr = 103 },
                new Bieding { BiedNr = 5, BedragPerFust = 300, AantalStuks = 20, GebruikerNr = 1, VeilingproductNr = 104 },
                new Bieding { BiedNr = 6, BedragPerFust = 999999, AantalStuks = 5, GebruikerNr = 3, VeilingproductNr = 101 },
                new Bieding { BiedNr = 7, BedragPerFust = 225, AantalStuks = 13, GebruikerNr = 3, VeilingproductNr = 102 },
                new Bieding { BiedNr = 8, BedragPerFust = 151, AantalStuks = 10, GebruikerNr = 2, VeilingproductNr = 101 },
                new Bieding { BiedNr = 9, BedragPerFust = 50, AantalStuks = 5000, GebruikerNr = 1, VeilingproductNr = 105 },
                new Bieding { BiedNr = 10, BedragPerFust = 750, AantalStuks = 100, GebruikerNr = 3, VeilingproductNr = 105 }
            );

            dbContext.SaveChanges();
        }

        return new BiedingController(dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user ?? new ClaimsPrincipal() }
            }
        };
    }

    [Fact(DisplayName = "Succes: Koper haalt eigen biedingen op")]
    public async Task GetBiedingKlant_WithValidUser_ReturnsList()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, rol_Koper)
        }, "mock"));

        var controller = BuildController(nameof(GetBiedingKlant_WithValidUser_ReturnsList), user);

        var response = await controller.GetKlantBiedingen(gebruikerNr: 1, veilingProductNr: null);

        var okResult = Assert.IsType<OkObjectResult>(response.Result);

        var items = Assert.IsAssignableFrom<IEnumerable<klantBiedingGet_dto>>(okResult.Value);

        Assert.NotEmpty(items);
        Assert.Equal(4, items.Count());
    }

    [Fact(DisplayName = "Success: Koper haalt een specifieke bieding op")]
    public async Task GetBiedingKlant_WithValidUser_ReturnSpecificItem()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, rol_VeilingMeester) 
        }, "Mock"));

        var controller = BuildController(nameof(GetBiedingKlant_WithValidUser_ReturnSpecificItem), user);
        var response = await controller.GetKlantBiedingen(gebruikerNr: 2, veilingProductNr: 103);

        var okResult = Assert.IsType<OkObjectResult>(response.Result);

        var items = Assert.IsAssignableFrom<IEnumerable<klantBiedingGet_dto>>(okResult.Value);

        Assert.NotEmpty(items);

        Assert.Single(items);
    }

    [Fact(DisplayName = "GetAll: Veilingmeester ziet gepagineerde lijst")]
    public async Task GetAll_AsVeilingMeester_ReturnsPagedList()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, rol_VeilingMeester) 
        }, "Mock"));
        
        var controller = BuildController(nameof(GetAll_AsVeilingMeester_ReturnsPagedList), user);

        // Vraag pagina 1, grootte 5
        var response = await controller.GetAll(null, null, 1, 5);

        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<VeilingMeester_BiedingDto>>(okResult.Value);
        
        Assert.Equal(5, items.Count()); // We hebben 10 items, vragen er 5
        Assert.True(controller.Response.Headers.ContainsKey("X-Total-Count"));
    }

    [Theory (DisplayName ="Haalt meerdere bestaande Id's op")]
    [InlineData(10, 10)]
    [InlineData(5, 5)]
    [InlineData(3, 3)]
    public async Task GetById_ExistingId_ReturnMultiple(int IngevoerdeBiedNr, int VerwachteBiedNr)
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, rol_VeilingMeester) 
        }, "Mock"));
        var controller = BuildController(nameof(GetById_ExistingId_ReturnMultiple), user);

        var response = await controller.GetById(IngevoerdeBiedNr); // Bieding 10 bestaat

        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var dto = Assert.IsType<VeilingMeester_BiedingDto>(okResult.Value);
        Assert.Equal(VerwachteBiedNr, dto.BiedingNr);
    }

    [Fact(DisplayName = "Post: Geldig bod wordt opgeslagen")]
    public async Task Create_ValidBieding_ReturnsCreated()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, rol_Koper)
        }, "Mock"));
        
        var controller = BuildController(nameof(Create_ValidBieding_ReturnsCreated), user);

        var input = new BiedingCreateDto
        {
            BiedingNr = 100,
            GebruikerNr = 1,
            VeilingproductNr = 101, 
            BedragPerFust = 500,
            AantalStuks = 20
        };

        var response = await controller.Create(input);

        var createdResult = Assert.IsType<CreatedAtActionResult>(response.Result);
                
        var dto = Assert.IsType<VeilingMeester_BiedingDto>(createdResult.Value);

        Assert.Equal(100, dto.BiedingNr);
    }

    [Fact(DisplayName = "Post: Bieden op inactieve veiling faalt")]
    public async Task Create_InactiveVeiling_ReturnsBadRequest()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, rol_Koper) 
        }, "Mock"));
        var controller = BuildController(nameof(Create_InactiveVeiling_ReturnsBadRequest), user);

        var input = new BiedingCreateDto
        {
            BiedingNr = 101,
            GebruikerNr = 1,
            VeilingproductNr = 105,
            BedragPerFust = 500,
            AantalStuks = 20
        };

        var response = await controller.Create(input);

        Assert.IsType<BadRequestObjectResult>(response.Result);
    }

    [Fact(DisplayName = "Delete: Veilingmeester verwijdert bod")]
    public async Task Delete_ExistingId_ReturnsNoContent()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, rol_VeilingMeester) 
        }, "Mock"));
        var controller = BuildController(nameof(Delete_ExistingId_ReturnsNoContent), user);

        var response = await controller.Delete(1);

        Assert.IsType<NoContentResult>(response);
        
        var check = await controller.GetById(1);
        Assert.IsType<NotFoundObjectResult>(check.Result);
    }
}