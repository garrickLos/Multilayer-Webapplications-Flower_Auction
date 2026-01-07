using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using mvc_api.Controllers;
using mvc_api.Data;

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

            var mockRepo = new Mock<IPrijsHistorieRepository>();
            var verwachteItems = new List<PrijsHistorieItem>
            {
                new PrijsHistorieItem
                {
                    BedrijfsNaam = "Bloemenhandel De Vrolijke Roos",
                    BeginDatum = new DateTime(2025, 10, 10),
                    BedragPerFust = 21
                },
                new PrijsHistorieItem
                {
                    BedrijfsNaam = "Bloemenhandel De Vrolijke Roos",
                    BeginDatum = new DateTime(2025, 10, 10),
                    BedragPerFust = 10
                }
            };

            mockRepo
                .Setup(repo => repo.GetPrijsHistorieAlleenKweker(nummer, naam, default))
                .Returns(new PrijsHistorieResultaat(verwachteItems, 15.5m));
            
            // Maak controller aan
            var controller = new PrijsHistorieController(mockRepo.Object);
            
            // Act: Roep endpoint aan
            var result = controller.GetPrijsHistorieAlleenKweker(nummer, bedrijfsNaam: naam);

            // Assert: Kijk of resultaat OkObjectResult is
            var okResult = Assert.IsType<OkObjectResult>(result);

            // Assert: Data is een lijst van PrijsHistorieItem
            var data = Assert.IsAssignableFrom<List<PrijsHistorieItem>>(okResult.Value);

            var verwachtItem1 = verwachteItems[0];
            var verwachtItem2 = verwachteItems[1];

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

            var mockRepo = new Mock<IPrijsHistorieRepository>();
            var verwachteItems = new List<PrijsHistorieItem>
            {
                new PrijsHistorieItem
                {
                    BedrijfsNaam = "Bloemenhandel De Vrolijke Roos",
                    BeginDatum = new DateTime(2025, 10, 10),
                    BedragPerFust = 21
                },
                new PrijsHistorieItem
                {
                    BedrijfsNaam = "Bloemenhandel De Vrolijke Roos",
                    BeginDatum = new DateTime(2025, 10, 10),
                    BedragPerFust = 10
                },
                new PrijsHistorieItem
                {
                    BedrijfsNaam = "Flora BV",
                    BeginDatum = new DateTime(2025, 10, 10),
                    BedragPerFust = 13
                }
            };

            mockRepo
                .Setup(repo => repo.GetPrijsHistorieIedereen(nummer, default))
                .Returns(new PrijsHistorieResultaat(verwachteItems, 14.7m));
            
            // Maak controller aan
            var controller = new PrijsHistorieController(mockRepo.Object);
            
            // Act: Roep endpoint aan
            var result = controller.GetPrijsHistorieIedereen(nummer);

            // Assert: Kijk of resultaat OkObjectResult is
            var okResult = Assert.IsType<OkObjectResult>(result);

            // Assert: Data is een lijst van PrijsHistorieItem
            var data = Assert.IsAssignableFrom<List<PrijsHistorieItem>>(okResult.Value);

            var verwachtItem1 = verwachteItems[0];
            var verwachtItem2 = verwachteItems[1];
            var verwachtItem3 = verwachteItems[2];

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
