/*
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

public class VeilingproductControllerTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new AppDbContext(options);
        return context;
    }

    private static VeilingproductController CreateController(AppDbContext context, ClaimsPrincipal? user = null)
    {
        var controller = new VeilingproductController(context)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user ?? new ClaimsPrincipal() }
            }
        };
        return controller;
    }

    [Fact(DisplayName = "Succes: veilingmeester ziet gefilterde lijst op q/status/min/max/titel")]
    public async Task GetForVeilingmeester_ComposesAllFilters()
    {
        var context = CreateContext(nameof(GetForVeilingmeester_ComposesAllFilters));
        context.Categorieen.AddRange(
            new Categorie { CategorieNr = 1, Naam = "Tulpen" },
            new Categorie { CategorieNr = 2, Naam = "Rozen" }
        );
        context.Veilingproducten.AddRange(
            new Veilingproduct
            {
                VeilingProductNr = 1,
                Naam = "Rode Roos Feest",
                CategorieNr = 2,
                Status = ModelStatus.Active,
                Startprijs = 30,
                Minimumprijs = 30,
                GeplaatstDatum = new DateTime(2025, 1, 1)
            },
            new Veilingproduct
            {
                VeilingProductNr = 2,
                Naam = "Gele Tulp Voorjaars",
                CategorieNr = 1,
                Status = ModelStatus.Inactive,
                Startprijs = 50,
                Minimumprijs = 50,
                GeplaatstDatum = new DateTime(2025, 2, 1)
            },
            new Veilingproduct
            {
                VeilingProductNr = 3,
                Naam = "Gele Tulp Deluxe Voorjaars",
                CategorieNr = 1,
                Status = ModelStatus.Active,
                Startprijs = 75,
                Minimumprijs = 75,
                GeplaatstDatum = new DateTime(2025, 3, 1)
            }
        );
        await context.SaveChangesAsync();

        var controller = CreateController(context);

        var response = await controller.GetForVeilingmeester(
            q: "Tulp",
            categorieNr: 1,
            status: ModelStatus.Active,
            minPrice: 60,
            maxPrice: 100,
            createdAfter: new DateTime(2025, 2, 1),
            title: "Voorjaars");

        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<VeilingproductVeilingmeesterListDto>>(okResult.Value);
        var single = Assert.Single(dtos);
        Assert.Equal(3, single.VeilingProductNr);
    }

    [Fact(DisplayName = "Fout: onbekende categorie resulteert in validatiefout bij aanmaak")]
    public async Task Create_UnknownCategory_ReturnsValidationProblem()
    {
        var context = CreateContext(nameof(Create_UnknownCategory_ReturnsValidationProblem));
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "Bedrijf")
        }, "mock"));
        var controller = CreateController(context, user);

        var dto = new VeilingproductCreateDto
        {
            Naam = "Nieuwe Roos",
            AantalFusten = 2,
            VoorraadBloemen = 50,
            CategorieNr = 99,
            Plaats = "Aalsmeer",
            Minimumprijs = 10,
            BeginDatum = new DateOnly(2025, 1, 1),
            ImagePath = "image.png"
        };

        var response = await controller.Create(dto);

        Assert.IsType<ObjectResult>(response.Result);
        Assert.True(controller.ModelState.ContainsKey(nameof(VeilingproductCreateDto.CategorieNr)));
    }

    [Fact(DisplayName = "Fout: ontbrekende gebruiker resulteert in Forbid bij aanmaak")]
    public async Task Create_WithoutUser_ReturnsForbid()
    {
        var context = CreateContext(nameof(Create_WithoutUser_ReturnsForbid));
        context.Categorieen.Add(new Categorie { CategorieNr = 1, Naam = "Tulpen" });
        await context.SaveChangesAsync();

        var controller = CreateController(context, user: new ClaimsPrincipal());

        var dto = new VeilingproductCreateDto
        {
            Naam = "Nieuwe Roos",
            AantalFusten = 2,
            VoorraadBloemen = 50,
            CategorieNr = 1,
            Plaats = "Aalsmeer",
            Minimumprijs = 10,
            BeginDatum = new DateOnly(2025, 1, 1),
            ImagePath = "image.png"
        };

        var response = await controller.Create(dto);

        Assert.IsType<ForbidResult>(response.Result);
    }

    [Fact(DisplayName = "Autorisatie: bedrijf kan product van ander niet aanpassen")]
    public async Task Update_WhenUserIsNotOwner_ReturnsForbid()
    {
        var context = CreateContext(nameof(Update_WhenUserIsNotOwner_ReturnsForbid));
        context.Categorieen.Add(new Categorie { CategorieNr = 1, Naam = "Tulpen" });
        context.Veilingproducten.Add(new Veilingproduct
        {
            VeilingProductNr = 7,
            Naam = "Andermans Tulp",
            GeplaatstDatum = DateTime.UtcNow,
            AantalFusten = 3,
            VoorraadBloemen = 30,
            CategorieNr = 1,
            Plaats = "Aalsmeer",
            Minimumprijs = 5,
            ImagePath = "pad",
            Kwekernr = 777
        });
        await context.SaveChangesAsync();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "Bedrijf")
        }, "mock"));
        var controller = CreateController(context, user);

        var dto = new VeilingproductUpdateDto
        {
            Naam = "Nieuwe Naam",
            GeplaatstDatum = DateTime.UtcNow,
            AantalFusten = 1,
            VoorraadBloemen = 10,
            CategorieNr = 1,
            ImagePath = "image.png",
            Minimumprijs = 1,
            Plaats = "Aalsmeer"
        };

        var response = await controller.Update(7, dto);

        Assert.IsType<ForbidResult>(response.Result);
    }

    [Fact(DisplayName = "Fout: bijwerken van ontbrekend product geeft NotFound")]
    public async Task Update_WithUnknownProduct_ReturnsNotFound()
    {
        var context = CreateContext(nameof(Update_WithUnknownProduct_ReturnsNotFound));
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "7"),
            new Claim(ClaimTypes.Role, "Bedrijf")
        }, "mock"));
        var controller = CreateController(context, user);

        var dto = new VeilingproductUpdateDto
        {
            Naam = "Bestaat Niet",
            GeplaatstDatum = DateTime.UtcNow,
            AantalFusten = 1,
            VoorraadBloemen = 10,
            CategorieNr = 1,
            ImagePath = "image.png",
            Minimumprijs = 1,
            Plaats = "Aalsmeer"
        };

        var response = await controller.Update(404, dto);

        Assert.IsType<NotFoundResult>(response.Result);
    }
}
*/
