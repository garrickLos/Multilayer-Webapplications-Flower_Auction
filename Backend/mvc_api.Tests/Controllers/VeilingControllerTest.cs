namespace mvc_api.Tests.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using mvc_api.Controllers;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Tests.Mocks;
using Microsoft.AspNetCore.Http;
using System.Runtime.CompilerServices;

public class VeilingControllerTest
{
    [Fact]
    public async Task GetAnonymous()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDbGetAnonymous")
            .Options;

        using var context = new AppDbContext(options);

        context.Veilingen.AddRange(
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
        context.SaveChanges();

        var controller = new VeilingController(context);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        //Alle waardes krijgen een null of false zo doorloopt het geen filter en direct de get
        var resultaat = await controller.GetAnonymous(null, null, null, false);

        var ok = Assert.IsType<OkObjectResult>(resultaat.Result);

        var items = Assert.IsAssignableFrom<IEnumerable<Anonymous_VeilingDto>>(ok.Value).ToList();
        Assert.Equal(2, items.Count);

        //Dit is [1] omdat de endpoint eerst soorteert op begintijd en daarna op veilingnr
        //Gekozen om tijd niet te testen want niet elke test gebeurt op dezelfde miliseconde
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
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDbGetAnonymous_scenarios")
            .Options;

        using var context = new AppDbContext(options);

        // Hardcoded tijd in UTC
        var nu = new DateTime(2026, 01, 05, 12, 0, 0, DateTimeKind.Utc);

        context.Veilingen.AddRange(
            // Scenario A alles true
            new Veiling
            {
                VeilingNr = 1,
                VeilingNaam = "scenarioA_True",
                Begintijd = nu.AddHours(-1),
                Eindtijd = nu.AddHours(2),
                Status = VeilingStatus.Inactive
            },
            // Scenario B alles true
            new Veiling
            {
                VeilingNr = 2,
                VeilingNaam = "scenarioB_True",
                Begintijd = nu.AddHours(-2),
                Eindtijd = nu.AddHours(-1),
                Status = VeilingStatus.Active
            },
            // Scenario A 2e conditie false rest true
            new Veiling
            {
                VeilingNr = 3,
                VeilingNaam = "scenarioA_conditie2False",
                Begintijd = nu.AddHours(1),
                Eindtijd = nu.AddHours(3),
                Status = VeilingStatus.Inactive
            },
            // Scenario A 3e conditie false rest true
            new Veiling
            {
                VeilingNr = 4,
                VeilingNaam = "scenarioA_conditie3False",
                Begintijd = nu.AddHours(-1),
                Eindtijd = nu.AddHours(-1),
                Status = VeilingStatus.Inactive
            },
            // Scenario B 2e conditie false rest true
            new Veiling
            {
                VeilingNr = 5,
                VeilingNaam = "scenarioB_conditie2False",
                Begintijd = nu.AddHours(-1),
                Eindtijd = nu.AddHours(1),
                Status = VeilingStatus.Active
            }
        );

        context.SaveChanges();

        var controller = new VeilingController(context);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        //testNow voor de forceerde tijd zo is er geen probleem met miliseconde etc
        var resultaat = await controller.GetAnonymous(null, null, null, false, testNow: nu);

        var updatedVeilingen = context.Veilingen.ToList();


        // Scenario A alles true 
        Assert.Equal("active", updatedVeilingen.First(v => v.VeilingNr == 1).Status);

        // Scenario B alles true
        Assert.Equal("inactive", updatedVeilingen.First(v => v.VeilingNr == 2).Status);

        // Scenario A 2e conditie false rest true
        Assert.Equal("inactive", updatedVeilingen.First(v => v.VeilingNr == 3).Status);

        // Scenario A 3e conditie false rest true
        Assert.Equal("inactive", updatedVeilingen.First(v => v.VeilingNr == 4).Status);

        // Scenario B 2e conditie false rest true
        Assert.Equal("active", updatedVeilingen.First(v => v.VeilingNr == 5).Status);
    }


    [Fact]
    public async Task VeilingPost()
    {
        
    }


}