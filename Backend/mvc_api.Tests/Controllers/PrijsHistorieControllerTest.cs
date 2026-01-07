using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Xunit;
using mvc_api.Controllers;

namespace mvc_api.Tests.Controllers
{
    public class PrijsHistorieControllerTest
    {
        [Fact]
        public void GetPrijsHistorie_ReturnsAlleenKweker()
        {
            // Arrange: nummer van de categorie en bedrijfsnaam
            var nummer = 2;
            var naam = "Bloemenhandel De Vrolijke Roos";

            // Simuleer IConfiguration
            var configBuilder = new ConfigurationBuilder();
            configBuilder.AddInMemoryCollection(new Dictionary<string, string>
            {
                {
                    //Hier hoort de connection string met de sql
                }
            });

            IConfiguration config = configBuilder.Build();

            // Maak controller aan
            var controller = new PrijsHistorieController(config);

            // Act: Roep endpoint aan
            var result = controller.GetPrijsHistorieAlleenKweker(nummer, bedrijfsNaam: naam);

            // Assert: Kijk of resultaat OkObjectResult is
            var okResult = Assert.IsType<OkObjectResult>(result);

            // Assert: Data is een lijst van PrijsHistorieItem
            var data = Assert.IsAssignableFrom<List<PrijsHistorieItem>>(okResult.Value);

            // Verwachte waarden per regel
            var verwachtItem1 = new PrijsHistorieItem
            {
                BedrijfsNaam = "Bloemenhandel De Vrolijke Roos",
                BeginDatum = new DateTime(2025, 10, 10),
                BedragPerFust = 21
            };

            var verwachtItem2 = new PrijsHistorieItem
            {
                BedrijfsNaam = "Bloemenhandel De Vrolijke Roos",
                BeginDatum = new DateTime(2025, 10, 10),
                BedragPerFust = 10
            };

            // Controleer elk item
            Assert.Equal(verwachtItem1.BedrijfsNaam, data[0].BedrijfsNaam);
            Assert.Equal(verwachtItem1.BeginDatum, data[0].BeginDatum);
            Assert.Equal(verwachtItem1.BedragPerFust, data[0].BedragPerFust);

            Assert.Equal(verwachtItem2.BedrijfsNaam, data[1].BedrijfsNaam);
            Assert.Equal(verwachtItem2.BeginDatum, data[1].BeginDatum);
            Assert.Equal(verwachtItem2.BedragPerFust, data[1].BedragPerFust);

            // Optioneel: controleer aantal items
            Assert.Equal(2, data.Count);
        }
        
        [Fact]
        public void GetPrijsHistorie_ReturnsAlles()
        {
            // Arrange: nummer van de categorie en bedrijfsnaam
            var nummer = 2;

            // Simuleer IConfiguration
            var configBuilder = new ConfigurationBuilder();
            configBuilder.AddInMemoryCollection(new Dictionary<string, string>
            {
                {
                    //Hier hoort de connection string met de sql

                }
            });

            IConfiguration config = configBuilder.Build();

            // Maak controller aan
            var controller = new PrijsHistorieController(config);

            // Act: Roep endpoint aan
            var result = controller.GetPrijsHistorieIedereen(nummer);

            // Assert: Kijk of resultaat OkObjectResult is
            var okResult = Assert.IsType<OkObjectResult>(result);

            // Assert: Data is een lijst van PrijsHistorieItem
            var data = Assert.IsAssignableFrom<List<PrijsHistorieItem>>(okResult.Value);

            // Verwachte waarden per regel
            var verwachtItem1 = new PrijsHistorieItem
            {
                BedrijfsNaam = "Bloemenhandel De Vrolijke Roos",
                BeginDatum = new DateTime(2025, 10, 10),
                BedragPerFust = 21
            };

            var verwachtItem2 = new PrijsHistorieItem
            {
                BedrijfsNaam = "Bloemenhandel De Vrolijke Roos",
                BeginDatum = new DateTime(2025, 10, 10),
                BedragPerFust = 10
            };

            var verwachtItem3 = new PrijsHistorieItem
            {
                BedrijfsNaam = "Flora BV",
                BeginDatum = new DateTime(2025, 10, 10),
                BedragPerFust = 13
            };

            // Controleer elk item
            Assert.Equal(verwachtItem1.BedrijfsNaam, data[0].BedrijfsNaam);
            Assert.Equal(verwachtItem1.BeginDatum, data[0].BeginDatum);
            Assert.Equal(verwachtItem1.BedragPerFust, data[0].BedragPerFust);

            Assert.Equal(verwachtItem2.BedrijfsNaam, data[1].BedrijfsNaam);
            Assert.Equal(verwachtItem2.BeginDatum, data[1].BeginDatum);
            Assert.Equal(verwachtItem2.BedragPerFust, data[1].BedragPerFust);

            Assert.Equal(verwachtItem3.BedrijfsNaam, data[2].BedrijfsNaam);
            Assert.Equal(verwachtItem3.BeginDatum, data[2].BeginDatum);
            Assert.Equal(verwachtItem3.BedragPerFust, data[2].BedragPerFust);

            Assert.Equal(3, data.Count);
        }
    }
}
