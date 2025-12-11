using Microsoft.EntityFrameworkCore;
using Moq;
using mvc_api.Models;

namespace mvc_api.Tests.Mocks;

public class BiedingMockData
{
    public static Mock<DbSet<Bieding>> CreateMock(IEnumerable<Bieding> biedingen)
    {
        var queryable = biedingen.AsQueryable();
        var mockset = new Mock<DbSet<Bieding>>();

        mockset.As<IQueryable<Bieding>>().Setup(m => m.Provider).Returns(queryable.Provider);

        return mockset;
    }
}