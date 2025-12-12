using Moq;
using Microsoft.EntityFrameworkCore;
using mvc_api.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using mvc_api.Controllers;
using mvc_api.Data;

namespace mvc_api.Tests.Mocks;

public interface IStatic_Variable
{
    public const string rol_VeilingMeester = "VeilingMeester";
    public const string rol_Koper = "Koper";
    public const string rol_Bedrijf = "Bedrijf";

    public const string StatusActive = "Active";
    public const string StatusInactive = "Inactive";    
}

public class BiedingMockData : IStatic_Variable
{
    public static Mock CreateMock(ClaimsPrincipal user)
    {
        // Converteer de lijst naar een IQueryable zodat we de eigenschappen kunnen kopiëren
        var options = new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()) // Unieke naam om conflicten te voorkomen
        .Options;
        
        var mockSet = new Mock<AppDbContext>(options);
        
        mockSet.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ThrowsAsync(new DbUpdateException());

        return mockSet;
    }

    public static BiedingController BuildController(string dbName, ClaimsPrincipal? user = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var dbContext = new AppDbContext(options);

        // zorgt ervoor dat die leeg begint.
        dbContext.Database.EnsureCreated();

        if (!dbContext.Biedingen.Any())
        {
            // Genereert gebruikers voor de testen
            dbContext.Gebruikers.AddRange(
                new Gebruiker { GebruikerNr = 1, BedrijfsNaam = "Koper Een", Soort = IStatic_Variable.rol_Koper },
                new Gebruiker { GebruikerNr = 2, BedrijfsNaam = "Koper Twee", Soort = IStatic_Variable.rol_Koper },
                new Gebruiker { GebruikerNr = 3, BedrijfsNaam = "Bedrijf Drie", Soort = IStatic_Variable.rol_Koper },
                new Gebruiker { GebruikerNr = 4, BedrijfsNaam = "VeilingMeester", Soort = IStatic_Variable.rol_Koper}
            );

            // genereert veilingen die gebruikt kunnen worden
            // 1 actief en 1 inactief voor het testen van beide stellingen
            dbContext.Veilingen.AddRange(
                new Veiling { VeilingNr = 10, Status = IStatic_Variable.StatusActive },
                new Veiling { VeilingNr = 20, Status = IStatic_Variable.StatusInactive }
            );

            dbContext.Veilingproducten.AddRange(
                // Verschillende producten die gebruikt worden
                new Veilingproduct { VeilingProductNr = 101, VeilingNr = 10, Naam = "Tulp Rood" },
                new Veilingproduct { VeilingProductNr = 102, VeilingNr = 10, Naam = "Tulp Geel" },
                new Veilingproduct { VeilingProductNr = 103, VeilingNr = 10, Naam = "Roos Wit" },
                new Veilingproduct { VeilingProductNr = 104, VeilingNr = 10, Naam = "Roos Rood" },
                new Veilingproduct { VeilingProductNr = 105, VeilingNr = 20, Naam = "Oude Tulp" } 
            );

            // genereert biedingen met verschillende waardes voor de verschillende soorten routes
            dbContext.Biedingen.AddRange(
                new Bieding { BiedNr = 1, BedragPerFust = 150, AantalStuks = 10, GebruikerNr = 1, VeilingproductNr = 101 },
                new Bieding { BiedNr = 2, BedragPerFust = 5000, AantalStuks = 1000, GebruikerNr = 1, VeilingproductNr = 101 },
                new Bieding { BiedNr = 3, BedragPerFust = 1, AantalStuks = 1, GebruikerNr = 2, VeilingproductNr = 102 },
                new Bieding { BiedNr = 4, BedragPerFust = 1250, AantalStuks = 50, GebruikerNr = 2, VeilingproductNr = 103 },
                new Bieding { BiedNr = 5, BedragPerFust = 300, AantalStuks = 20, GebruikerNr = 1, VeilingproductNr = 104 },
                new Bieding { BiedNr = 6, BedragPerFust = 999999, AantalStuks = 5, GebruikerNr = 3, VeilingproductNr = 101 },
                new Bieding { BiedNr = 7, BedragPerFust = 225, AantalStuks = 13, GebruikerNr = 3, VeilingproductNr = 102 },
                new Bieding { BiedNr = 8, BedragPerFust = 151, AantalStuks = 10, GebruikerNr = 2, VeilingproductNr = 101 },
                new Bieding { BiedNr = 9, BedragPerFust = 50, AantalStuks = 5000, GebruikerNr = 1, VeilingproductNr = 105 },
                new Bieding { BiedNr = 10, BedragPerFust = 750, AantalStuks = 100, GebruikerNr = 3, VeilingproductNr = 105 }
            );

            dbContext.SaveChanges();
        }

        return new BiedingController(dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user ?? new ClaimsPrincipal() }
            }
        };
    }
}