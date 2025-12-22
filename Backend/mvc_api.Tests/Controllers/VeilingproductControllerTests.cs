using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    public async Task KlantGetAll_WithFilters_ReturnsPagedResults()
    {
        var products = new List<Veilingproduct>
        {
            new() { VeilingProductNr = 1, Naam = "Rode Roos", CategorieNr = 1, Categorie = new Categorie { Naam = "Rozen" }, ImagePath = "roos.png", Plaats = "Aalsmeer" },
            new() { VeilingProductNr = 2, Naam = "Gele Tulp", CategorieNr = 2, Categorie = new Categorie { Naam = "Tulpen" }, ImagePath = "tulp.png", Plaats = "Lisse" }
        };

        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.Query()).Returns(BuildAsyncQueryable(products));

        var controller = CreateController(repository.Object);

        var response = await controller.KlantGetAll(q: "Tulp", categorieNr: 2, page: 1, pageSize: 50, ct: CancellationToken.None);

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
        repository.Verify(r => r.Query(), Times.Once);
    }

    [Fact]
    public async Task KwekerGetAll_WithFilters_ReturnsPagedResults()
    {
        var products = new List<Veilingproduct>
        {
            new()
            {
                VeilingProductNr = 3,
                Naam = "Witte Lelie",
                CategorieNr = 3,
                Categorie = new Categorie { Naam = "Lelies" },
                GeplaatstDatum = new DateTime(2025, 2, 1),
                AantalFusten = 2,
                VoorraadBloemen = 100,
                ImagePath = "lelie.png",
                Plaats = "Naaldwijk"
            }
        };

        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.Query()).Returns(BuildAsyncQueryable(products));

        var controller = CreateController(repository.Object);

        var response = await controller.KwekerGetAll(q: "Lelie", categorieNr: 3, page: 1, pageSize: 50, ct: CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var list = Assert.IsAssignableFrom<IEnumerable<kwekerVeilingproductGet_dto>>(ok.Value);
        var item = Assert.Single(list);
        Assert.Equal(3, item.VeilingProductNr);
        Assert.Equal("Witte Lelie", item.Naam);
        Assert.Equal("Lelies", item.Categorie);
        Assert.Equal("lelie.png", item.ImagePath);
        Assert.Equal("Naaldwijk", item.Plaats);
        Assert.Equal("1", controller.Response.Headers["X-Total-Count"]);
        repository.Verify(r => r.Query(), Times.Once);
    }

    [Fact]
    public async Task GetForVeilingmeester_WithFilters_ReturnsExpectedResult()
    {
        var products = new List<Veilingproduct>
        {
            new()
            {
                VeilingProductNr = 4,
                Naam = "Rode Roos Deluxe",
                CategorieNr = 1,
                Categorie = new Categorie { Naam = "Rozen" },
                Status = ModelStatus.Active,
                Minimumprijs = 40,
                Startprijs = 45,
                GeplaatstDatum = new DateTime(2025, 3, 1),
                Kwekernr = 7,
                AantalFusten = 2,
                VoorraadBloemen = 60,
                Plaats = "Aalsmeer",
                ImagePath = "roos.png",
                BeginDatum = new DateOnly(2025, 3, 1)
            },
            new()
            {
                VeilingProductNr = 5,
                Naam = "Gele Tulp",
                CategorieNr = 2,
                Categorie = new Categorie { Naam = "Tulpen" },
                Status = ModelStatus.Inactive,
                Minimumprijs = 20,
                Startprijs = 20,
                GeplaatstDatum = new DateTime(2025, 1, 1),
                Kwekernr = 9,
                AantalFusten = 1,
                VoorraadBloemen = 20,
                Plaats = "Lisse",
                ImagePath = "tulp.png",
                BeginDatum = new DateOnly(2025, 1, 1)
            }
        };

        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.QueryWithCategorie()).Returns(BuildAsyncQueryable(products));

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
        repository.Verify(r => r.QueryWithCategorie(), Times.Once);
    }

    [Fact]
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
    public async Task Create_Valid_ReturnsOkWithDto()
    {
        var products = new List<Veilingproduct>();
        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.CategorieExistsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        repository.Setup(r => r.QueryWithCategorie()).Returns(BuildAsyncQueryable(products));
        repository.Setup(r => r.Add(It.IsAny<Veilingproduct>())).Callback<Veilingproduct>(entity =>
        {
            entity.VeilingProductNr = 123;
            products.Add(entity);
        });
        repository.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

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

        var products = new List<Veilingproduct> { entity };

        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.FindAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        repository.Setup(r => r.CategorieExistsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        repository.Setup(r => r.QueryWithCategorie()).Returns(BuildAsyncQueryable(products));
        repository.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

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

        var products = new List<Veilingproduct> { entity };

        var repository = new Mock<IVeilingproductRepository>();
        repository.Setup(r => r.FindAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        repository.Setup(r => r.QueryWithCategorie()).Returns(BuildAsyncQueryable(products));
        repository.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

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

    private static IQueryable<T> BuildAsyncQueryable<T>(IEnumerable<T> source)
    {
        return new TestAsyncEnumerable<T>(source);
    }

    private sealed class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
    {
        public TestAsyncEnumerable(IEnumerable<T> enumerable)
            : base(enumerable)
        {
        }

        public TestAsyncEnumerable(Expression expression)
            : base(expression)
        {
        }

        public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
        {
            return new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
        }

        IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
    }

    private sealed class TestAsyncQueryProvider<TEntity> : IAsyncQueryProvider
    {
        private readonly IQueryProvider _inner;

        public TestAsyncQueryProvider(IQueryProvider inner)
        {
            _inner = inner;
        }

        public IQueryable CreateQuery(Expression expression)
        {
            return new TestAsyncEnumerable<TEntity>(expression);
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        {
            return new TestAsyncEnumerable<TElement>(expression);
        }

        public object? Execute(Expression expression)
        {
            return _inner.Execute(expression);
        }

        public TResult Execute<TResult>(Expression expression)
        {
            return _inner.Execute<TResult>(expression);
        }

        public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
        {
            return Execute<TResult>(expression);
        }

        public IAsyncEnumerable<TResult> ExecuteAsync<TResult>(Expression expression)
        {
            return new TestAsyncEnumerable<TResult>(expression);
        }
    }

    private sealed class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
    {
        private readonly IEnumerator<T> _inner;

        public TestAsyncEnumerator(IEnumerator<T> inner)
        {
            _inner = inner;
        }

        public ValueTask DisposeAsync()
        {
            _inner.Dispose();
            return ValueTask.CompletedTask;
        }

        public ValueTask<bool> MoveNextAsync()
        {
            return ValueTask.FromResult(_inner.MoveNext());
        }

        public T Current => _inner.Current;
    }
}
