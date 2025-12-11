using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using mvc_api.Controllers;
using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Tests.Controllers
{
    public class CategorieControllerTest
    {
        [Fact]
        public async Task GetAll_ReturnsCorrectCategories()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb")
                .Options;

            using var context = new AppDbContext(options);

            context.Categorieen.AddRange(
                new Categorie { CategorieNr = 1, Naam = "Roos" },
                new Categorie { CategorieNr = 2, Naam = "Bloem" }
            );
            context.SaveChanges();

            var controller = new CategorieController(context);

            var resultaat = await controller.GetAll();

            var ok = Assert.IsType<OkObjectResult>(resultaat.Result);
            var items = Assert.IsAssignableFrom<IEnumerable<CList>>(ok.Value).ToList();

            Assert.Equal(2, items.Count);
            
            //Geordend op naam
            Assert.Equal("Bloem", items[0].Naam);
            Assert.Equal("Roos", items[1].Naam);
        }
    }
}