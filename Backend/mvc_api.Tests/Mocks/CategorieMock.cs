using Microsoft.EntityFrameworkCore;
using Moq;
using mvc_api.Models;

namespace mvc_api.Tests.Mocks;

public class CategorieMock
{
    public static Mock<DbSet<Categorie>> CreateMockSet(IEnumerable<Categorie> categorien)
    {
        var queryable = categorien.AsQueryable();
        var mockSet = new Mock<DbSet<Categorie>>();
        
        mockSet.As<IQueryable<Categorie>>().Setup(m => m.Provider).Returns(queryable.Provider);
        mockSet.As<IQueryable<Categorie>>().Setup(m => m.Expression).Returns(queryable.Expression);
        mockSet.As<IQueryable<Categorie>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
        mockSet.As<IQueryable<Categorie>>().Setup(m => m.GetEnumerator()).Returns(queryable.GetEnumerator());

        return mockSet;
    }
}