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
                .UseInMemoryDatabase(databaseName: "TestDbGetAll")
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

        [Fact]
        public async Task GetAllById()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
       .UseInMemoryDatabase(databaseName: "TestDbGetById")
       .Options;

            using var context = new AppDbContext(options);

            context.Categorieen.AddRange(
                new Categorie { CategorieNr = 1, Naam = "Roos" },
                new Categorie { CategorieNr = 2, Naam = "Bloem" }
            );
            context.SaveChanges();

            var controller = new CategorieController(context);

            //haalt alle informatie over id 1 op 
            var resultaat = await controller.GetById(1);

            var ok = Assert.IsType<OkObjectResult>(resultaat.Result);
            var item = Assert.IsType<CDetail>(ok.Value);

            Assert.Equal(1, item.CategorieNr);
            Assert.Equal("Roos", item.Naam);
        }

        [Fact]
        public async Task GetAllByIdNotFound()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
       .UseInMemoryDatabase(databaseName: "TestDbGetByIdNotFound")
       .Options;

            using var context = new AppDbContext(options);

            context.Categorieen.AddRange(
                new Categorie { CategorieNr = 1, Naam = "Roos" },
                new Categorie { CategorieNr = 2, Naam = "Bloem" }
            );
            context.SaveChanges();

            var controller = new CategorieController(context);

            //haalt alles op van een id die niet bestaat dus krijgt hij foutmelding
            //"Niet gevonden", $"Geen categorie met ID {id}.", 404
            var resultaat = await controller.GetById(99);

            Assert.IsType<NotFoundObjectResult>(resultaat.Result);
        }

        [Fact]
        public async Task CategorieToevoegen()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
       .UseInMemoryDatabase(databaseName: "TestDbPost")
       .Options;

            using var context = new AppDbContext(options);
            var controller = new CategorieController(context);

            var dto = new CategorieCreateDto("BlauweBosRoos");

            var resultaat = await controller.Create(dto);


            var gemaakt = Assert.IsType<CreatedAtActionResult>(resultaat.Result);

            var item = Assert.IsType<CDetail>(gemaakt.Value);

            Assert.Equal("BlauweBosRoos", item.Naam);
            Assert.True(item.CategorieNr > 0);
        }

        [Fact]
        public async Task CategorieToevoegenZonderWaarde()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
       .UseInMemoryDatabase(databaseName: "TestDbPostZonderWaarde")
       .Options;

            using var context = new AppDbContext(options);
            var controller = new CategorieController(context);

            controller.ModelState.AddModelError("Naam", "Required");
            var dto = new CategorieCreateDto("");

            var resultaat = await controller.Create(dto);


            var foutePost = Assert.IsType<BadRequestObjectResult>(resultaat.Result);

            var details = Assert.IsType<ValidationProblemDetails>(foutePost.Value);

            Assert.Equal("Je hebt een lege of te lange categorie toegevoegd.", details.Detail);
        }

        [Fact]
        public async Task CategorieToevoegenMetTeVeelKarakters()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
       .UseInMemoryDatabase(databaseName: "TestDbPostMetTeVeelKarakters")
       .Options;

            using var context = new AppDbContext(options);
            var controller = new CategorieController(context);

            // Hier simuleren we een fout in de input, zodat ModelState.IsValid False is
            controller.ModelState.AddModelError("Naam", "te lang");

            var langeCategorieNaam = new String('A', 201);
            var dto = new CategorieCreateDto(langeCategorieNaam);

            var resultaat = await controller.Create(dto);


            var foutePost = Assert.IsType<BadRequestObjectResult>(resultaat.Result);

            var details = Assert.IsType<ValidationProblemDetails>(foutePost.Value);

            Assert.Equal("Je hebt een lege of te lange categorie toegevoegd.", details.Detail);
        }
    }
}