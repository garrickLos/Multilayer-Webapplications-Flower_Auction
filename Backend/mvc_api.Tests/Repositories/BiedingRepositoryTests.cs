using Xunit;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

using mvc_api.Tests.Mocks;

public class BiedingRepositoryTests
{
    /* 
    **************
    *   getklant *
    **************
    */ 
    [Fact
        (DisplayName = "Succes: Koper haalt eigen biedingen op")]
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

    [Fact
        (DisplayName = "Success: Koper haalt een specifieke bieding op")]
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
}