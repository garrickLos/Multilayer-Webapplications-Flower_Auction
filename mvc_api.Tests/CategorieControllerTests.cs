using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Controllers;
using mvc_api.Data;
using mvc_api.Models;
using Xunit;

namespace mvc_api.Tests;

public class CategorieControllerTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    [Fact]
    public async Task GetAll_ReturnsSeededCategories()
    {
        await using var context = CreateContext();
        var controller = new CategorieController(context);

        var result = await controller.GetAll(null, 1, 50, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var categories = Assert.IsAssignableFrom<IEnumerable<CategorieListDto>>(ok.Value);
        Assert.True(categories.Any(), "Expected seeded categories to be returned");
        Assert.Contains(categories, c => c.Naam == "Tulpen");
    }
}
