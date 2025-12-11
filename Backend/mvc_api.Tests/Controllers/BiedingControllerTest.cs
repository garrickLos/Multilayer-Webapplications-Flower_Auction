using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using mvc_api.Tests.Mocks;
using Xunit;

namespace mvc_api.Tests.Controllers;

public class BiedingControllerTests: IStatic_Variable
{

    [Fact(DisplayName = "Succes: Koper haalt eigen biedingen op")]
    public async Task GetBiedingKlant_WithValidUser_ReturnsList()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_Koper)
        }, "mock"));

        var controller = BiedingMockData.BuildController(nameof(GetBiedingKlant_WithValidUser_ReturnsList), user);

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
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_VeilingMeester) 
        }, "Mock"));

        var controller = BiedingMockData.BuildController(nameof(GetBiedingKlant_WithValidUser_ReturnSpecificItem), user);
        var response = await controller.GetKlantBiedingen(gebruikerNr: 2, veilingProductNr: 103);

        var okResult = Assert.IsType<OkObjectResult>(response.Result);

        var items = Assert.IsAssignableFrom<IEnumerable<klantBiedingGet_dto>>(okResult.Value);

        Assert.NotEmpty(items);

        Assert.Single(items);
    }

    [Fact(DisplayName = "GetAll: Veilingmeester ziet lijst terug")]
    public async Task GetAll_AsVeilingMeester_ReturnsPagedList()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] 
        { 
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_VeilingMeester) 
        }, "Mock"));
        
        var controller = BiedingMockData.BuildController(nameof(GetAll_AsVeilingMeester_ReturnsPagedList), user);

        // Vraag pagina 1, grootte 5
        var response = await controller.GetVeilingMeester_Biedingen(1, null);

        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<VeilingMeester_BiedingDto>>(okResult.Value);
        
        Assert.Equal(4, items.Count()); // We hebben 10 items, vragen er 5
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
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_VeilingMeester) 
        }, "Mock"));
        var controller = BiedingMockData.BuildController(nameof(GetById_ExistingId_ReturnMultiple), user);

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
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_Koper)
        }, "Mock"));
        
        var controller = BiedingMockData.BuildController(nameof(Create_ValidBieding_ReturnsCreated), user);

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
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_Koper) 
        }, "Mock"));
        var controller = BiedingMockData.BuildController(nameof(Create_InactiveVeiling_ReturnsBadRequest), user);

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
            new Claim(ClaimTypes.Role, IStatic_Variable.rol_VeilingMeester) 
        }, "Mock"));
        var controller = BiedingMockData.BuildController(nameof(Delete_ExistingId_ReturnsNoContent), user);

        var response = await controller.Delete(1);

        Assert.IsType<NoContentResult>(response);
        
        var check = await controller.GetById(1);
        Assert.IsType<NotFoundObjectResult>(check.Result);
    }
}