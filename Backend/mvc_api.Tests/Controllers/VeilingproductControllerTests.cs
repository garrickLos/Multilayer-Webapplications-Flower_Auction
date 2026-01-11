using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using mvc_api.Controllers;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Models.Dtos;
using Xunit;

namespace mvc_api.Tests.Controllers;

public class VeilingproductControllerTests
{
    private static VeilingproductController CreateController(
        IVeilingproductRepository repository,
        ClaimsPrincipal? user = null)
    {
        return new VeilingproductController(repository)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user ?? new ClaimsPrincipal() }
            }
        };
    }

    [Fact]
    // Tests that KlantGetAll returns filtered items with pagination headers for clients.
    public async Task KlantGetAll_WithFilters_ReturnsPagedResults()
    {
        var dtoItems = new List<klantVeilingproductGet_dto>
        {
            new(2, "Gele Tulp", "Tulpen", "tulp.png", "Lisse")
        };

        var repository = new Mock<IVeilingproductRepository>();
        repository
            .Setup(r => r.GetKlantAsync(0, "Tulp", 2, 1, 50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<klantVeilingproductGet_dto>(dtoItems, 1, 1, 50));

        var controller = CreateController(repository.Object);

        var response = await controller.KlantGetAll(vpNummer: 0, q: "Tulp", categorieNr: 2, page: 1, pageSize: 50, ct: CancellationToken.None);
        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var list = Assert.IsAssignableFrom<IEnumerable<klantVeilingproductGet_dto>>(ok.Value);
        var item = Assert.Single(list);
        Assert.Equal(2, item.VeilingProductNr);
        Assert.Equal("Tulpen", item.Categorie);
        Assert.Equal("tulp.png", item.ImagePath);
        Assert.Equal("Lisse", item.Plaats);
        Assert.Equal("1", controller.Response.Headers["X-Total-Count"]);
        Assert.Equal("1", controller.Response.Headers["X-Page"]);
        Assert.Equal("50", controller.Response.Headers["X-Page-Size"]);
        repository.Verify(
            r => r.GetKlantAsync(0, "Tulp", 2, 1, 50, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    // Tests that KwekerGetAll returns filtered items for a kweker with pagination headers.
    public async Task KwekerGetAll_WithFilters_ReturnsPagedResults()
    {
        var dtoItems = new List<kwekerVeilingproductGet_dto>
        {
            new(3, "Witte Lelie", new DateTime(2025, 2, 1), 2, 100, "Lelies", "lelie.png", "Naaldwijk")
        };

        var repository = new Mock<IVeilingproductRepository>();
        repository
            .Setup(r => r.GetKwekerAsync(0, "Lelie", 3, 1, 50, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<kwekerVeilingproductGet_dto>(dtoItems, 1, 1, 50));

        var controller = CreateController(repository.Object);

        var response = await controller.KwekerGetAll(Nummer: 0, q: "Lelie", categorieNr: 3, page: 1, pageSize: 50, ct: CancellationToken.None);
        
        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var list = Assert.IsAssignableFrom<IEnumerable<kwekerVeilingproductGet_dto>>(ok.Value);
        var item = Assert.Single(list);
        Assert.Equal(3, item.VeilingProductNr);
        Assert.Equal("Witte Lelie", item.Naam);
        Assert.Equal("Lelies", item.Categorie);
        Assert.Equal("lelie.png", item.ImagePath);
        Assert.Equal("Naaldwijk", item.Plaats);
        Assert.Equal("1", controller.Response.Headers["X-Total-Count"]);
        repository.Verify(
            r => r.GetKwekerAsync(0, "Lelie", 3, 1, 50, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    // Tests that veilingmeester filters are passed through and returned as expected.
    public async Task GetForVeilingmeester_WithFilters_ReturnsExpectedResult()
    {
        var expectedDtos = new List<VeilingproductVeilingmeesterListDto>
        {
            new(
                4,
                "Rode Roos Deluxe",
                "Rozen",
                ModelStatus.Active,
                null,
                7,
                2,
                60,
                "Aalsmeer",
                40,
                45,
                new DateTime(2025, 3, 1),
                "roos.png",
                new DateOnly(2025, 3, 1))
        };

        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.GetForVeilingmeesterAsync(
                "Roos",
                1,
                ModelStatus.Active,
                40,
                60,
                new DateTime(2025, 2, 1),
                "Deluxe",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDtos);

        var controller = CreateController(repository.Object);

        var response = await controller.GetForVeilingmeester(
            q: "Roos",
            categorieNr: 1,
            status: ModelStatus.Active,
            minPrice: 40,
            maxPrice: 60,
            createdAfter: new DateTime(2025, 2, 1),
            title: "Deluxe",
            ct: CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var list = Assert.IsAssignableFrom<IEnumerable<VeilingproductVeilingmeesterListDto>>(ok.Value);
        var item = Assert.Single(list);
        Assert.Equal(4, item.VeilingProductNr);
        Assert.Equal("Rozen", item.CategorieNaam);
        repository.Verify(r => r.GetForVeilingmeesterAsync(
                "Roos",
                1,
                ModelStatus.Active,
                40,
                60,
                new DateTime(2025, 2, 1),
                "Deluxe",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    // Tests that Create returns a validation problem when model state is invalid.
    public async Task Create_InvalidModel_ReturnsValidationProblem()
    {
        var repository = new Mock<IVeilingproductRepository>();
        var controller = CreateController(repository.Object);
        controller.ModelState.AddModelError("Naam", "Required");

        var response = await controller.Create(new VeilingproductCreateDto());

        Assert.IsType<ObjectResult>(response.Result);
        repository.Verify(r => r.Add(It.IsAny<Veilingproduct>()), Times.Never);
    }

    [Fact]
    // Tests that Create rejects an unknown category to prevent invalid references.
    public async Task Create_UnknownCategory_ReturnsValidationProblem()
    {
        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.CategorieExistsAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "Bedrijf")
        }, "mock"));

        var controller = CreateController(repository.Object, user);

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
        repository.Verify(r => r.Add(It.IsAny<Veilingproduct>()), Times.Never);
    }

    [Fact]
    // Tests that Create forbids when no authenticated user id is available.
    public async Task Create_NoUser_ReturnsForbid()
    {
        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.CategorieExistsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var controller = CreateController(repository.Object, new ClaimsPrincipal());

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
        repository.Verify(r => r.Add(It.IsAny<Veilingproduct>()), Times.Never);
    }

    [Fact]
    // Tests that Create persists and returns a kweker DTO for valid input.
    public async Task Create_Valid_ReturnsOkWithDto()
    {
        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.CategorieExistsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        repository.Setup(r => r.Add(It.IsAny<Veilingproduct>())).Callback<Veilingproduct>(entity =>
        {
            entity.VeilingProductNr = 123;
        });
        repository.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        repository.Setup(r => r.GetKwekerListByIdAsync(123, 42, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new VeilingproductKwekerListDto(
                123,
                "Nieuwe Roos",
                null,
                2,
                50,
                "Rozen",
                1,
                "image.png",
                "Aalsmeer",
                null,
                10,
                null,
                42));

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "Bedrijf")
        }, "mock"));

        var controller = CreateController(repository.Object, user);

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

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var result = Assert.IsType<VeilingproductKwekerListDto>(ok.Value);
        Assert.Equal(123, result.VeilingProductNr);
        Assert.Equal("Nieuwe Roos", result.Naam);
        Assert.Equal(2, result.AantalFusten);
        Assert.Equal(50, result.VoorraadBloemen);
        repository.Verify(r => r.Add(It.IsAny<Veilingproduct>()), Times.Once);
        repository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    // Tests that Update returns validation problem for invalid model state.
    public async Task Update_InvalidModel_ReturnsValidationProblem()
    {
        var repository = new Mock<IVeilingproductRepository>();
        var controller = CreateController(repository.Object);
        controller.ModelState.AddModelError("Naam", "Required");

        var response = await controller.Update(1, new VeilingproductUpdateDto());

        Assert.IsType<ObjectResult>(response.Result);
        repository.Verify(r => r.FindAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    // Tests that Update returns NotFound for unknown product ids.
    public async Task Update_WithUnknownProduct_ReturnsNotFound()
    {
        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.FindAsync(404, It.IsAny<CancellationToken>())).ReturnsAsync((Veilingproduct?)null);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "7"),
            new Claim(ClaimTypes.Role, "Bedrijf")
        }, "mock"));

        var controller = CreateController(repository.Object, user);

        var response = await controller.Update(404, new VeilingproductUpdateDto());

        Assert.IsType<NotFoundResult>(response.Result);
    }

    [Fact]
    // Tests that Update returns BadRequest when user id is missing from claims.
    public async Task Update_NoUser_ReturnsBadRequest()
    {
        var entity = new Veilingproduct { VeilingProductNr = 7, Naam = "Product" };
        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.FindAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var controller = CreateController(repository.Object, new ClaimsPrincipal());

        var response = await controller.Update(7, new VeilingproductUpdateDto { Naam = "Nieuw" });

        Assert.IsType<BadRequestObjectResult>(response.Result);
        repository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    // Tests that Update rejects invalid category updates.
    public async Task Update_InvalidCategory_ReturnsValidationProblem()
    {
        var entity = new Veilingproduct { VeilingProductNr = 7, Naam = "Product", CategorieNr = 1 };
        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.FindAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        repository.Setup(r => r.CategorieExistsAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "Bedrijf")
        }, "mock"));

        var controller = CreateController(repository.Object, user);

        var response = await controller.Update(7, new VeilingproductUpdateDto { CategorieNr = 99 });

        Assert.IsType<ObjectResult>(response.Result);
        Assert.True(controller.ModelState.ContainsKey(nameof(VeilingproductCreateDto.CategorieNr)));
    }

    [Fact]
    // Tests that Update returns the updated DTO for valid kweker updates.
    public async Task Update_Valid_ReturnsOkWithUpdatedDto()
    {
        var entity = new Veilingproduct
        {
            VeilingProductNr = 7,
            Naam = "Oude Naam",
            CategorieNr = 1,
            AantalFusten = 1,
            VoorraadBloemen = 10,
            Minimumprijs = 5,
            Plaats = "Aalsmeer",
            ImagePath = "old.png"
        };

        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.FindAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        repository.Setup(r => r.CategorieExistsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        repository.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        repository.Setup(r => r.GetKwekerListByIdAsync(7, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new VeilingproductKwekerListDto(
                7,
                "Nieuwe Naam",
                null,
                3,
                30,
                "Rozen",
                1,
                "new.png",
                "Lisse",
                null,
                20,
                null,
                42));
        
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Role, "Bedrijf")
        }, "mock"));

        var controller = CreateController(repository.Object, user);

        var dto = new VeilingproductUpdateDto
        {
            Naam = "Nieuwe Naam",
            AantalFusten = 3,
            VoorraadBloemen = 30,
            CategorieNr = 1,
            Minimumprijs = 20,
            Plaats = "Lisse",
            ImagePath = "new.png"
        };

        var response = await controller.Update(7, dto);

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var result = Assert.IsType<VeilingproductKwekerListDto>(ok.Value);
        Assert.Equal("Nieuwe Naam", result.Naam);
        Assert.Equal(3, result.AantalFusten);
        Assert.Equal(30, result.VoorraadBloemen);
        Assert.Equal("Lisse", result.Plaats);
        Assert.Equal("new.png", result.ImagePath);
        repository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    // Tests that UpdatePlanning returns validation problem for invalid model state.
    public async Task UpdatePlanning_InvalidModel_ReturnsValidationProblem()
    {
        var repository = new Mock<IVeilingproductRepository>();
        var controller = CreateController(repository.Object);
        controller.ModelState.AddModelError("Startprijs", "Required");

        var response = await controller.UpdatePlanning(1, new VeilingproductVeilingmeesterUpdateDto());

        Assert.IsType<ObjectResult>(response.Result);
        repository.Verify(r => r.FindAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    // Tests that UpdatePlanning returns NotFound for missing veilingproduct.
    public async Task UpdatePlanning_NotFound_ReturnsNotFound()
    {
        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.FindAsync(9, It.IsAny<CancellationToken>())).ReturnsAsync((Veilingproduct?)null);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "VeilingMeester")
        }, "mock"));

        var controller = CreateController(repository.Object, user);

        var response = await controller.UpdatePlanning(9, new VeilingproductVeilingmeesterUpdateDto());

        Assert.IsType<NotFoundResult>(response.Result);
    }

    [Fact]
    // Tests that UpdatePlanning updates planning fields and returns the veilingmeester DTO.
    public async Task UpdatePlanning_Valid_ReturnsOkWithUpdatedDto()
    {
        var entity = new Veilingproduct
        {
            VeilingProductNr = 10,
            Naam = "Planning",
            CategorieNr = 1,
            Categorie = new Categorie { Naam = "Tulpen" },
            Status = ModelStatus.Active,
            Minimumprijs = 30,
            GeplaatstDatum = DateTime.UtcNow,
            Kwekernr = 5,
            AantalFusten = 2,
            VoorraadBloemen = 40,
            Plaats = "Aalsmeer",
            ImagePath = "img.png",
            BeginDatum = new DateOnly(2025, 1, 1)
        };

        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.FindAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        repository.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        repository.Setup(r => r.GetVeilingmeesterListByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new VeilingproductVeilingmeesterListDto(
                10,
                "Planning",
                "Tulpen",
                ModelStatus.Active,
                3,
                5,
                2,
                40,
                "Aalsmeer",
                30,
                55,
                entity.GeplaatstDatum,
                "img.png",
                new DateOnly(2025, 1, 1)));

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "VeilingMeester")
        }, "mock"));

        var controller = CreateController(repository.Object, user);

        var response = await controller.UpdatePlanning(10, new VeilingproductVeilingmeesterUpdateDto
        {
            Startprijs = 55,
            VeilingNr = 3
        });

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var result = Assert.IsType<VeilingproductVeilingmeesterListDto>(ok.Value);
        Assert.Equal(55, result.Startprijs);
        Assert.Equal(3, result.VeilingNr);
        repository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

}
