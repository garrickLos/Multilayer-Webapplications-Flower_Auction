using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Models.Dtos;
using Xunit;

namespace mvc_api.Tests.Data;

public class VeilingproductRepositoryTests
{
    [Fact]
    public async Task FindAsync_WithExistingId_ReturnsEntity()
    {
        var entity = new Veilingproduct { VeilingProductNr = 1, Naam = "Roos" };
        var dbSet = new Mock<DbSet<Veilingproduct>>();
        dbSet.Setup(s => s.FindAsync(new object[] { 1 }, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var context = CreateContext(dbSet.Object, new Mock<DbSet<Categorie>>().Object);
        var repository = new VeilingproductRepository(context.Object);

        var result = await repository.FindAsync(1, CancellationToken.None);

        Assert.Same(entity, result);
    }

    [Fact]
    public void Add_CallsDbSetAdd()
    {
        var dbSet = new Mock<DbSet<Veilingproduct>>();
        var context = CreateContext(dbSet.Object, new Mock<DbSet<Categorie>>().Object);
        var repository = new VeilingproductRepository(context.Object);

        var entity = new Veilingproduct { VeilingProductNr = 2, Naam = "Tulp" };

        repository.Add(entity);

        dbSet.Verify(s => s.Add(entity), Times.Once);
    }

    [Fact]
    public async Task SaveChangesAsync_CallsContext()
    {
        var context = new Mock<AppDbContext>(new DbContextOptions<AppDbContext>()) { CallBase = true };
        context.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var repository = new VeilingproductRepository(context.Object);

        await repository.SaveChangesAsync(CancellationToken.None);

        context.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CategorieExistsAsync_WithMatch_ReturnsTrue()
    {
        var categorieen = new List<Categorie>
        {
            new() { CategorieNr = 1, Naam = "Rozen" },
            new() { CategorieNr = 2, Naam = "Tulpen" }
        };
        var categorieSet = CreateMockDbSet(categorieen);
        var context = CreateContext(new Mock<DbSet<Veilingproduct>>().Object, categorieSet.Object);
        var repository = new VeilingproductRepository(context.Object);

        var result = await repository.CategorieExistsAsync(2, CancellationToken.None);

        Assert.True(result);
    }

    [Fact]
    public async Task GetKlantAsync_WithFilters_ReturnsPagedResults()
    {
        var products = new List<Veilingproduct>
        {
            new()
            {
                VeilingProductNr = 1,
                Naam = "Rode Roos",
                CategorieNr = 1,
                Categorie = new Categorie { Naam = "Rozen" },
                ImagePath = "roos.png",
                Plaats = "Aalsmeer"
            },
            new()
            {
                VeilingProductNr = 2,
                Naam = "Gele Tulp",
                CategorieNr = 2,
                Categorie = new Categorie { Naam = "Tulpen" },
                ImagePath = "tulp.png",
                Plaats = "Lisse"
            }
        };
        var productSet = CreateMockDbSet(products);
        var context = CreateContext(productSet.Object, new Mock<DbSet<Categorie>>().Object);
        var repository = new VeilingproductRepository(context.Object);

        var result = await repository.GetKlantAsync("Tulp", 2, 1, 50, CancellationToken.None);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal(1, result.Items.Count);
        Assert.Equal(2, result.Items[0].VeilingProductNr);
        Assert.Equal("Tulpen", result.Items[0].Categorie);
    }

    [Fact]
    public async Task GetKwekerAsync_WithFilters_ReturnsPagedResults()
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
        var productSet = CreateMockDbSet(products);
        var context = CreateContext(productSet.Object, new Mock<DbSet<Categorie>>().Object);
        var repository = new VeilingproductRepository(context.Object);

        var result = await repository.GetKwekerAsync("Lelie", 3, 1, 50, CancellationToken.None);

        Assert.Equal(1, result.TotalCount);
        Assert.Equal(1, result.Items.Count);
        Assert.Equal(3, result.Items[0].VeilingProductNr);
        Assert.Equal("Lelies", result.Items[0].Categorie);
    }

    [Fact]
    public async Task GetForVeilingmeesterAsync_WithFilters_ReturnsExpectedItems()
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
        var productSet = CreateMockDbSet(products);
        var context = CreateContext(productSet.Object, new Mock<DbSet<Categorie>>().Object);
        var repository = new VeilingproductRepository(context.Object);

        var result = await repository.GetForVeilingmeesterAsync(
            "Roos",
            1,
            ModelStatus.Active,
            40,
            60,
            new DateTime(2025, 2, 1),
            "Deluxe",
            CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(4, result[0].VeilingProductNr);
        Assert.Equal("Rozen", result[0].CategorieNaam);
    }

    [Fact]
    public async Task GetKwekerListByIdAsync_ReturnsKwekerDto()
    {
        var products = new List<Veilingproduct>
        {
            new()
            {
                VeilingProductNr = 7,
                Naam = "Nieuwe Naam",
                CategorieNr = 1,
                Categorie = new Categorie { Naam = "Rozen" },
                AantalFusten = 3,
                VoorraadBloemen = 30,
                Minimumprijs = 20,
                Plaats = "Lisse",
                ImagePath = "new.png",
                Kwekernr = 42
            }
        };
        var productSet = CreateMockDbSet(products);
        var context = CreateContext(productSet.Object, new Mock<DbSet<Categorie>>().Object);
        var repository = new VeilingproductRepository(context.Object);

        var result = await repository.GetKwekerListByIdAsync(7, 42, CancellationToken.None);

        Assert.Equal(7, result.VeilingProductNr);
        Assert.Equal("Rozen", result.CategorieNaam);
        Assert.Equal("Lisse", result.Plaats);
    }

    [Fact]
    public async Task GetVeilingmeesterListByIdAsync_ReturnsVeilingmeesterDto()
    {
        var products = new List<Veilingproduct>
        {
            new()
            {
                VeilingProductNr = 10,
                Naam = "Planning",
                CategorieNr = 1,
                Categorie = new Categorie { Naam = "Tulpen" },
                Status = ModelStatus.Active,
                Minimumprijs = 30,
                GeplaatstDatum = new DateTime(2025, 1, 1),
                Kwekernr = 5,
                AantalFusten = 2,
                VoorraadBloemen = 40,
                Plaats = "Aalsmeer",
                ImagePath = "img.png",
                BeginDatum = new DateOnly(2025, 1, 1)
            }
        };
        var productSet = CreateMockDbSet(products);
        var context = CreateContext(productSet.Object, new Mock<DbSet<Categorie>>().Object);
        var repository = new VeilingproductRepository(context.Object);

        var result = await repository.GetVeilingmeesterListByIdAsync(10, CancellationToken.None);

        Assert.Equal(10, result.VeilingProductNr);
        Assert.Equal("Tulpen", result.CategorieNaam);
        Assert.Equal(ModelStatus.Active, result.Status);
    }

    private static Mock<AppDbContext> CreateContext(DbSet<Veilingproduct> productSet, DbSet<Categorie> categorieSet)
    {
        var context = new Mock<AppDbContext>(new DbContextOptions<AppDbContext>()) { CallBase = true };
        context.Setup(c => c.Set<Veilingproduct>()).Returns(productSet);
        context.Setup(c => c.Set<Categorie>()).Returns(categorieSet);
        return context;
    }

    private static Mock<DbSet<T>> CreateMockDbSet<T>(IEnumerable<T> data) where T : class
    {
        var queryable = data.AsQueryable();
        var dbSet = new Mock<DbSet<T>>();

        dbSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(new TestAsyncQueryProvider<T>(queryable.Provider));
        dbSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(queryable.Expression);
        dbSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
        dbSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(() => queryable.GetEnumerator());
        dbSet.As<IAsyncEnumerable<T>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<T>(queryable.GetEnumerator()));

        return dbSet;
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
