using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using mvc_api.Tests.Mocks;
using Xunit;
using Moq;
using mvc_api.Repo.Interfaces;
using mvc_api.Controllers;
using mvc_api.Models;
using Microsoft.AspNetCore.Http; // Toegevoegd voor BiedingCreateDto

namespace mvc_api.Tests.Controllers;

public class BiedingControllerTests : IStatic_Variable
{
    /* *********************
    * getveilingMeester *
    *********************
    */ 

    [Fact(DisplayName = "GetAll: Veilingmeester ziet lijst terug")]
    public async Task GetAll_AsVeilingMeester_ReturnsPagedList()
    {
        // 1. Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_VeilingMeester) 
        }, "Mock"));
        
        var controller = BiedingMockData.BuildController(nameof(GetAll_AsVeilingMeester_ReturnsPagedList), user);

        // 2. Act
        // Vraag pagina 1, grootte 5. We gebruiken named arguments omdat de signatuur veel nullables heeft.
        var response = await controller.GetVeilingMeester_Biedingen(
            gebruikerNr: null, 
            veilingNr: null, 
            orderDescending: true, 
            page: 1, 
            pageSize: 5
        );

        // 3. Assert
        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<VeilingMeester_BiedingDto>>(okResult.Value);
        
        // In de MockData zitten 10 items. Pagina grootte is 5.
        Assert.Equal(5, items.Count()); 
        Assert.True(controller.Response.Headers.ContainsKey("X-Total-Count"));
    }

    [Theory(DisplayName = "Get certain: Veilingmeester ziet gefilterde lijst terug")]
    [InlineData (1, 10, 3)] // Gebruiker 1 in Veiling 10 heeft 2 biedingen (150 en 5000)
    [InlineData (4, 20, 0)] // Gebruiker 4 bestaat wel, maar heeft geen biedingen
    [InlineData (1, 20, 1)] // Gebruiker 1 heeft 1 bod in veiling 20 (bieding 9, veilingproduct 105)
    [InlineData (2, 20, 0)] // Gebruiker 2 heeft geen bod in veiling 20
    [InlineData (3, 20, 1)] // Gebruiker 3 heeft 1 bod in veiling 20 (bieding 10)
    public async Task GetAll_AsVeilingMeester_GetBiedingen_WithVeilingnr(int gebruikerNr, int veilingNr, int verwachteHoeveelheid)
    {
        // 1. Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_VeilingMeester) 
        }, "Mock"));
        
        var controller = BiedingMockData.BuildController(nameof(GetAll_AsVeilingMeester_GetBiedingen_WithVeilingnr) + gebruikerNr + veilingNr, user);

        // 2. Act
        var response = await controller.GetVeilingMeester_Biedingen(gebruikerNr, veilingNr);

        // 3. Assert
        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<VeilingMeester_BiedingDto>>(okResult.Value);
        
        Assert.Equal(verwachteHoeveelheid, items.Count());
    }

    /* ***********
    * getById *
    ***********
    */ 

    // moet gefixed worden

    // [Theory(DisplayName ="Haalt meerdere bestaande Id's op")]
    // [InlineData(10, 10)]
    // [InlineData(5, 5)]
    // [InlineData(3, 3)]
    // public async Task GetById_ExistingId_ReturnMultiple(int ingevoerdeBiedNr, int verwachteBiedNr)
    // {
    //     // 1. Arrange
    //     var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
    //     { 
    //         new Claim(ClaimTypes.Role, IStatic_Variable.rol_VeilingMeester) 
    //     }, "Mock"));
    //     var controller = BiedingMockData.BuildController(nameof(GetById_ExistingId_ReturnMultiple) + ingevoerdeBiedNr, user);

    //     // 2. Act
    //     var response = await controller.GetById(ingevoerdeBiedNr);

    //     // 3. Assert
    //     var okResult = Assert.IsType<OkObjectResult>(response.Result);
    //     var dto = Assert.IsType<VeilingMeester_BiedingDto>(BadRequestObjectResult);
    //     Assert.Equal(verwachteBiedNr, dto.BiedingNr);
    // }

    /* *******************
    * Create endpoint *
    *******************
    */ 

    [Fact(DisplayName = "Post: Geldig bod wordt opgeslagen")]
    public async Task Create_ValidBieding_ReturnsCreated()
    {
        // 1. Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_Koper)
        }, "Mock"));
        
        var controller = BiedingMockData.BuildController(nameof(Create_ValidBieding_ReturnsCreated), user);

        var input = new BiedingCreateDto
        {
            BiedingNr = 100,
            GebruikerNr = 1,     // Bestaande gebruiker
            VeilingproductNr = 101, // Bestaand product in Actieve veiling (10)
            BedragPerFust = 500,
            AantalStuks = 20
        };

        // 2. Act
        var response = await controller.Create(input);

        // 3. Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(response.Result);
        var dto = Assert.IsType<VeilingMeester_BiedingDto>(createdResult.Value);

        Assert.Equal(20, dto.AantalStuks);
    }

    [Fact(DisplayName = "Post: Bieden op inactieve veiling faalt")]
    public async Task Create_InactiveVeiling_ReturnsBadRequest()
    {
        // 1. Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_Koper) 
        }, "Mock"));
        var controller = BiedingMockData.BuildController(nameof(Create_InactiveVeiling_ReturnsBadRequest), user);

        var input = new BiedingCreateDto
        {
            BiedingNr = 101,
            GebruikerNr = 1,
            VeilingproductNr = 105, // VeilingProduct 105 zit in Veiling 20 (Inactive)
            BedragPerFust = 500,
            AantalStuks = 20
        };

        // 2. Act
        var response = await controller.Create(input);

        // 3. Assert
        Assert.IsType<BadRequestObjectResult>(response.Result);
    }

    [Theory(DisplayName = "Post: Bieden met ongeldige data geeft error 400")]
    [InlineData (101, 100, 105, 500, 20)] // error 400 voor gebruiker (100 bestaat niet)
    [InlineData (101, 1, 999, 500, 20)]   // error 400 voor veilingproduct (999 bestaat niet)
    [InlineData (101, 1, 105, 500, 20)]   // error 400 voor ongeldige status (105 is inactive)
    public async Task Create_InactiveVeiling_Returns400(int biedingNr, int gebruikerNr, int veilingProductNr, int bedragPerFust, int aantalStuks)
    {
        // 1. Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_Koper) 
        }, "Mock"));
        
        // Unieke naam per testcase om DB conflicten te voorkomen
        var controller = BiedingMockData.BuildController(nameof(Create_InactiveVeiling_Returns400) + gebruikerNr + veilingProductNr, user);

        var input = new BiedingCreateDto
        {
            BiedingNr = biedingNr,
            GebruikerNr = gebruikerNr,
            VeilingproductNr = veilingProductNr,
            BedragPerFust = bedragPerFust,
            AantalStuks = aantalStuks
        };

        // 2. Act
        var response = await controller.Create(input);

        // 3. Assert
        var objectResult = Assert.IsType<BadRequestObjectResult>(response.Result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    /* *******************
    * delete endpoint *
    *******************
    */

    [Fact(DisplayName = "Delete: Veilingmeester verwijdert bod")]
    public async Task Delete_ExistingId_ReturnsNoContent()
    {
        // 1. Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_VeilingMeester) 
        }, "Mock"));
        var controller = BiedingMockData.BuildController(nameof(Delete_ExistingId_ReturnsNoContent), user);

        // 2. Act
        var response = await controller.Delete(1); // Bieding 1 bestaat in de seed data

        // 3. Assert
        Assert.IsType<NoContentResult>(response);
        
        // Controle: het item mag niet meer gevonden worden
        var check = await controller.GetById(1);
        Assert.IsType<NotFoundObjectResult>(check.Result);
    }

    [Theory(DisplayName = "Delete: Bieding wordt verwijderd die niet bestaat")]
    [InlineData (50)]
    [InlineData (20)]
    [InlineData (24)]
    public async Task Delete_NonExistingId_ReturnsNotFound(int biedNr)
    {
        // 1. Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_VeilingMeester) 
        }, "Mock"));
        var controller = BiedingMockData.BuildController(nameof(Delete_NonExistingId_ReturnsNotFound) + biedNr, user);

        // 2. Act
        var response = await controller.Delete(biedNr);
        
        // 3. Assert
        Assert.IsType<NotFoundObjectResult>(response);
    }
}