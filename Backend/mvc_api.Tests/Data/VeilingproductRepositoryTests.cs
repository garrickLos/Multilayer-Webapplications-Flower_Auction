using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using mvc_api.Data;
using mvc_api.Models;
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
    public void Query_ReturnsAllItems()
    {
        var products = new List<Veilingproduct>
        {
            new() { VeilingProductNr = 1, Naam = "Roos" },
            new() { VeilingProductNr = 2, Naam = "Tulp" }
        };
        var productSet = CreateMockDbSet(products);
        var context = CreateContext(productSet.Object, new Mock<DbSet<Categorie>>().Object);
        var repository = new VeilingproductRepository(context.Object);

        var result = repository.Query().ToList();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void QueryWithCategorie_ReturnsAllItems()
    {
        var products = new List<Veilingproduct>
        {
            new() { VeilingProductNr = 3, Naam = "Lelie" }
        };
        var productSet = CreateMockDbSet(products);
        var context = CreateContext(productSet.Object, new Mock<DbSet<Categorie>>().Object);
        var repository = new VeilingproductRepository(context.Object);

        var result = repository.QueryWithCategorie().ToList();

        Assert.Single(result);
        Assert.Equal("Lelie", result[0].Naam);
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
