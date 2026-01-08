using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using mvc_api.Controllers;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Tests.Mocks;
using System.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http.HttpResults;
using Moq;
using ApiGetFilters;
using System.Security.Claims;

namespace mvc_api.Tests.Controllers
{
    public class VeilingControllerTest
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDbGetAnonymous")
            .Options;

        using var context = new AppDbContext(options);

        context.Veiling.AddRange(
        new Veiling
        {
            var controller = VeilingControllerMockFactory.CreateVeilingControllerWithInMemoryDb("TestDbGetAnonymous");
            var context = controller.HttpContext != null ? null : controller.HttpContext; // alleen om context type te hebben
            var db = (DbContext)controller.GetType()
                        .GetField("_db", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                        .GetValue(controller);

            // Voeg testdata toe
            db.Set<Veiling>().AddRange(
                new Veiling
                {
                    VeilingNr = 1,
                    VeilingNaam = "Rozenveiling",
                    Begintijd = DateTime.UtcNow.AddHours(-1),
                    Eindtijd = DateTime.UtcNow.AddHours(2),
                    Status = VeilingStatus.Active
                },
                new Veiling
                {
                    VeilingNr = 2,
                    VeilingNaam = "Tulpenveiling",
                    Begintijd = DateTime.UtcNow.AddHours(-2),
                    Eindtijd = DateTime.UtcNow.AddHours(-1),
                    Status = VeilingStatus.Inactive
                }
            );
            await db.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var resultaat = await controller.GetAnonymous(null, null, null, false);

            var ok = Assert.IsType<OkObjectResult>(resultaat.Result);
            var items = Assert.IsAssignableFrom<IEnumerable<Anonymous_VeilingDto>>(ok.Value).ToList();

            Assert.Equal(2, items.Count);
            Assert.Equal(1, items[1].VeilingNr);
            Assert.Equal("Rozenveiling", items[1].VeilingNaam);
            Assert.Equal("active", items[1].Status);
            Assert.Equal(2, items[0].VeilingNr);
            Assert.Equal("Tulpenveiling", items[0].VeilingNaam);
            Assert.Equal("inactive", items[0].Status);
        }

        [Fact]
        public async Task GetAnonymous_verschillendeScenarios()
        {
            var controller = VeilingControllerMockFactory.CreateVeilingControllerWithInMemoryDb("TestDbGetAnonymous_scenarios");
            var db = (DbContext)controller.GetType()
                        .GetField("_db", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                        .GetValue(controller);

            var nu = new DateTime(2026, 01, 05, 12, 0, 0, DateTimeKind.Utc);

            db.Set<Veiling>().AddRange(
                new Veiling { VeilingNr = 1, VeilingNaam = "scenarioA_True", Begintijd = nu.AddHours(-1), Eindtijd = nu.AddHours(2), Status = VeilingStatus.Inactive },
                new Veiling { VeilingNr = 2, VeilingNaam = "scenarioB_True", Begintijd = nu.AddHours(-2), Eindtijd = nu.AddHours(-1), Status = VeilingStatus.Active },
                new Veiling { VeilingNr = 3, VeilingNaam = "scenarioA_conditie2False", Begintijd = nu.AddHours(1), Eindtijd = nu.AddHours(3), Status = VeilingStatus.Inactive },
                new Veiling { VeilingNr = 4, VeilingNaam = "scenarioA_conditie3False", Begintijd = nu.AddHours(-1), Eindtijd = nu.AddHours(-1), Status = VeilingStatus.Inactive },
                new Veiling { VeilingNr = 5, VeilingNaam = "scenarioB_conditie2False", Begintijd = nu.AddHours(-1), Eindtijd = nu.AddHours(1), Status = VeilingStatus.Active }
            );
            await db.SaveChangesAsync();

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var resultaat = await controller.GetAnonymous(null, null, null, false, testNow: nu);

            var updatedVeilingen = db.Set<Veiling>().ToList();

            Assert.Equal("active", updatedVeilingen.First(v => v.VeilingNr == 1).Status);
            Assert.Equal("inactive", updatedVeilingen.First(v => v.VeilingNr == 2).Status);
            Assert.Equal("inactive", updatedVeilingen.First(v => v.VeilingNr == 3).Status);
            Assert.Equal("inactive", updatedVeilingen.First(v => v.VeilingNr == 4).Status);
            Assert.Equal("active", updatedVeilingen.First(v => v.VeilingNr == 5).Status);
        }

        [Fact]
        public async Task VeilingtoevoegenTest()
        {
            var controller = VeilingControllerMockFactory.CreateVeilingControllerWithInMemoryDb("TestVeilingToevoegen");

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

        context.Veiling.AddRange(
            // Scenario A alles true
            new Veiling
            {
                VeilingNr = 1,
                VeilingNaam = "OudeVeiling",
                Begintijd = now,
                Eindtijd = now.AddDays(1),
                Status = VeilingStatus.Inactive
            };
            context.Veilingen.Add(bestaandeVeiling);
            context.SaveChanges();

            // Controller aanmaken
            var controller = new VeilingController
            (
                context,
                new Mock<ProjectieVeilingController>().Object,
                new VeilingControllerFilter(context)
            );

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            // Nieuwe waardes die we willen hebben
            var updateDto = new VeilingUpdateDto
            {
                VeilingNaam = "GewijzigdeVeiling",
                Begintijd = now.AddMinutes(60),
                Eindtijd = now.AddMinutes(120)
            };

            //we veranderen de waardes van veilingnr 1
            var resultaat = await controller.Update(1, updateDto, testNow: now, ct: CancellationToken.None);

            var request = Assert.IsType<OkObjectResult>(resultaat.Result);

            var updated = Assert.IsType<VeilingUpdateDto>(request.Value);
            Assert.Equal("GewijzigdeVeiling", updated.VeilingNaam);
            Assert.Equal(now.AddMinutes(60), updated.Begintijd);
            Assert.Equal(now.AddMinutes(120), updated.Eindtijd);
        }

        [Fact]
        public async Task VeilingUpdateMetEntityNull()
        {
            var now = new DateTime(2026, 01, 06, 12, 0, 0, DateTimeKind.Utc);

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDbUpdateVeiling")
                .Options;

        var updatedVeilingen = context.Veiling.ToList();

            //Geen waardes toegevoegd aan db dus er is geen bestaande veiling
            // Controller aanmaken
            var controller = new VeilingController
            (
                context,
                new Mock<ProjectieVeilingController>().Object,
                new VeilingControllerFilter(context)
            );

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            // Nieuwe waardes die we willen hebben
            var updateDto = new VeilingUpdateDto
            {
                VeilingNaam = "GewijzigdeVeiling",
                Begintijd = now.AddMinutes(60),
                Eindtijd = now.AddMinutes(120)
            };
            var nepId = 99;

            //we veranderen de waardes van veilingnr 1
            var resultaat = await controller.Update(nepId, updateDto, testNow: now, ct: CancellationToken.None);

            var request = Assert.IsType<NotFoundObjectResult>(resultaat.Result);

            var tuple = Assert.IsType<(string Detail, int Status, string Title)>(request.Value);

            Assert.Equal($"Geen veiling met ID {nepId}.", tuple.Detail);
            Assert.Equal(404, tuple.Status);
            Assert.Equal("Niet gevonden", tuple.Title);

        }

        [Fact]
        public async Task VeilingPostExceptionError()
        {
            var controller = VeilingControllerMockFactory.CreateVeilingControllerException("VeilingExceptionError");

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            //De reden voor vaste date time is omdat je anders een badrequest krijgt door de if statement van validatetime
            //het zal altijd net onder de 60, 120 of 180 zijn als je utcnow gebruikt doordat het een miliseconde eerder is dan de eindtijd
            var tijd = new DateTime(2026, 01, 07, 12, 0, 0, DateTimeKind.Utc);

            var veiling =
            new VeilingCreateDto
            {
                VeilingNaam = "TestToevoegen",
                Begintijd = tijd.AddHours(1),
                Eindtijd = tijd.AddHours(2)
            };

            var resultaat = await controller.Create(veiling, tijd, CancellationToken.None);

            var errorCode = Assert.IsType<ObjectResult>(resultaat.Result);
            var errorDetail = Assert.IsType<ProblemDetails>(errorCode.Value);

            Assert.Equal(500, errorCode.StatusCode);
            Assert.Equal("Opslagfout", errorDetail.Title);
            Assert.Equal("Er is een fout opgetreden bij het opslaan van de Veiling.", errorDetail.Detail);
        }

        [Fact]
        public async Task GetVoorKoper()
        {
            var controller = VeilingControllerMockFactory.CreateVeilingControllerWithInMemoryDb("VeilingGetVoorKoper");
            var db = (DbContext)controller.GetType()
                        .GetField("_db", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                        .GetValue(controller);

            var tijd = new DateTime(2026, 01, 07, 12, 0, 0, DateTimeKind.Utc);

            db.Set<Veiling>().Add(new Veiling
            {
                VeilingNr = 1,
                VeilingNaam = "TestToevoegen",
                Begintijd = tijd.AddHours(-1),
                Eindtijd = tijd.AddHours(2),
                Status = VeilingStatus.Active
            });

            await db.SaveChangesAsync();

            //simuleert de ingelogde gebruiker
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "jeroen"),
                new Claim(ClaimTypes.Email, "jeroen@gmail.com"),
                new Claim(ClaimTypes.Role, "Koper")
            };
            var identiteit = new ClaimsIdentity(claims, "Test");
            var gebruiker = new ClaimsPrincipal(identiteit);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = gebruiker }
            };

            var resultaat = await controller.GetKlant(null, null, null, false, testNow: tijd);

            var request = Assert.IsType<OkObjectResult>(resultaat.Result);
            var items = Assert.IsAssignableFrom<IEnumerable<Klant_VeilingDto>>(request.Value);

            var waardes = items.First();

            Assert.Equal(1, waardes.VeilingNr);
            Assert.Equal("TestToevoegen", waardes.VeilingNaam);
            Assert.Equal("active", waardes.Status);
            Assert.Equal(tijd.AddHours(-1), waardes.Begintijd);
            Assert.Equal(tijd.AddHours(2), waardes.Eindtijd);
        }
        
        [Fact]
        public async Task GetVoorKoperStatusVeranderen()
        {
            var controller = VeilingControllerMockFactory.CreateVeilingControllerWithInMemoryDb("VeilingGetVoorKoperStatusVeranderen");
            var db = (DbContext)controller.GetType()
                        .GetField("_db", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                        .GetValue(controller);

            var tijd = new DateTime(2026, 01, 07, 12, 0, 0, DateTimeKind.Utc);

            db.Set<Veiling>().Add(new Veiling
            {
                VeilingNr = 1,
                VeilingNaam = "TestToevoegen",
                Begintijd = tijd.AddHours(-1),
                Eindtijd = tijd,
                Status = VeilingStatus.Active
            });

            await db.SaveChangesAsync();

            //simuleert de ingelogde gebruiker
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "jeroen"),
                new Claim(ClaimTypes.Email, "jeroen@gmail.com"),
                new Claim(ClaimTypes.Role, "Koper")
            };
            var identiteit = new ClaimsIdentity(claims, "Test");
            var gebruiker = new ClaimsPrincipal(identiteit);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = gebruiker }
            };

            var resultaat = await controller.GetKlant(null, null, null, false, testNow: tijd);

            var request = Assert.IsType<OkObjectResult>(resultaat.Result);
            var items = Assert.IsAssignableFrom<IEnumerable<Klant_VeilingDto>>(request.Value);

            var waardes = items.First();

            Assert.Equal(1, waardes.VeilingNr);
            Assert.Equal("TestToevoegen", waardes.VeilingNaam);
            Assert.Equal("inactive", waardes.Status);
            Assert.Equal(tijd.AddHours(-1), waardes.Begintijd);
            Assert.Equal(tijd, waardes.Eindtijd);
        }
    
    }
}
