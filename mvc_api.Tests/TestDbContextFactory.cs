using Microsoft.EntityFrameworkCore;
using mvc_api.Data;

namespace mvc_api.Tests;

/// <summary>
/// Utility to spin up isolated in-memory contexts for unit tests so we never hit the
/// echte database.
/// </summary>
public static class TestDbContextFactory
{
    public static AppDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName)
            .EnableSensitiveDataLogging()
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
