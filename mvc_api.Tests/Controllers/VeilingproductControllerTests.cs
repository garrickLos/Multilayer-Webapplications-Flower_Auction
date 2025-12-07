using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;
using mvc_api.Controllers;
using mvc_api.Models;
using mvc_api.Models.Dtos;
using mvc_api.Tests;
using Xunit;

namespace mvc_api.Tests.Controllers;

/// <summary>
/// Tests for VeilingproductController. Interactions with the database are simulated via
/// EF Core's in-memory provider to keep the tests deterministic and isolated.
/// </summary>
public class VeilingproductControllerTests
{
    [Fact]
    public async Task Create_WithValidPayloadAndUser_ReturnsCreatedProduct()
    {
        // Arrange
        var db = TestDbContextFactory.CreateContext(nameof(Create_WithValidPayloadAndUser_ReturnsCreatedProduct));
        db.Categorieen.Add(new Categorie { CategorieNr = 5, Naam = "Chrysant" });
        db.SaveChanges();

        var controller = BuildController(db, userId: 10);
        var dto = new VeilingproductCreateDto
        {
            Naam            = "Nieuwe Bos",
            GeplaatstDatum  = DateTime.UtcNow,
            AantalFusten    = 12,
            VoorraadBloemen = 100,
            CategorieNr     = 5,
            Plaats          = "Aalsmeer",
            Minimumprijs    = 50,
            BeginDatum      = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(1)),
            ImagePath       = "image.png"
        };

        // Act
        var result = await controller.Create(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var created  = Assert.IsType<VeilingproductKwekerListDto>(okResult.Value);
        Assert.Equal(dto.Naam.Trim(), created.Naam);
        Assert.Equal(dto.Minimumprijs, created.Minimumprijs);
        Assert.Equal(dto.VoorraadBloemen, created.VoorraadBloemen);
    }

    [Fact]
    public async Task Create_WithUnknownCategory_ReturnsValidationProblem()
    {
        // Arrange
        var db         = TestDbContextFactory.CreateContext(nameof(Create_WithUnknownCategory_ReturnsValidationProblem));
        var controller = BuildController(db, userId: 11);
        var dto = new VeilingproductCreateDto
        {
            Naam            = "ZonderCategorie",
            GeplaatstDatum  = DateTime.UtcNow,
            AantalFusten    = 4,
            VoorraadBloemen = 30,
            CategorieNr     = 999,
            Plaats          = "Naaldwijk",
            Minimumprijs    = 10,
            BeginDatum      = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(1)),
            ImagePath       = "image.png"
        };

        // Act
        var result = await controller.Create(dto);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
        Assert.IsType<ValidationProblemDetails>(objectResult.Value);
    }

    [Fact]
    public async Task Update_WithDifferentKweker_ReturnsForbid()
    {
        // Arrange
        var db = TestDbContextFactory.CreateContext(nameof(Update_WithDifferentKweker_ReturnsForbid));
        db.Categorieen.Add(new Categorie { CategorieNr = 7, Naam = "Tulpen" });
        db.Veilingproducten.Add(new Veilingproduct
        {
            VeilingProductNr = 44,
            Naam             = "Product",
            GeplaatstDatum   = DateTime.UtcNow,
            AantalFusten     = 2,
            VoorraadBloemen  = 5,
            CategorieNr      = 7,
            Plaats           = "Amsterdam",
            Minimumprijs     = 20,
            Kwekernr         = 99,
            BeginDatum       = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(2)),
            ImagePath        = "a.png",
            Status           = ModelStatus.Active
        });
        db.SaveChanges();

        var controller = BuildController(db, userId: 10);
        var updateDto  = new VeilingproductUpdateDto
        {
            Naam            = "Gewijzigd",
            GeplaatstDatum  = DateTime.UtcNow,
            AantalFusten    = 2,
            VoorraadBloemen = 6,
            CategorieNr     = 7,
            ImagePath       = "nieuw.png",
            Minimumprijs    = 30,
            Plaats          = "Rotterdam"
        };

        // Act
        var result = await controller.Update(44, updateDto);

        // Assert
        Assert.IsType<ForbidResult>(result.Result);
    }

    private static VeilingproductController BuildController(AppDbContext db, int? userId)
    {
        var controller = new VeilingproductController(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = userId.HasValue
                        ? new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()) }, "Test"))
                        : new ClaimsPrincipal(new ClaimsIdentity())
                }
            }
        };

        return controller;
    }
}
