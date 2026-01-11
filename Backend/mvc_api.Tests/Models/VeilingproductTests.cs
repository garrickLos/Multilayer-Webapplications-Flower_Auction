using System;
using System.Collections.Generic;
using mvc_api.Models;
using Xunit;

namespace mvc_api.Tests.Models;

public class VeilingproductTests
{
    [Fact]
    // Tests that default values are initialized to avoid null-related issues.
    public void Defaults_AreInitialized()
    {
        var product = new Veilingproduct();

        Assert.Equal(string.Empty, product.Naam);
        Assert.Equal(string.Empty, product.Plaats);
        Assert.Equal(string.Empty, product.ImagePath);
        Assert.Equal(ModelStatus.Active, product.Status);
        Assert.NotNull(product.Biedingen);
        Assert.Empty(product.Biedingen);
    }

    [Fact]
    // Tests that all properties can be set and read for full model coverage.
    public void Properties_CanBeAssignedAndRead()
    {
        var biedingen = new List<Bieding> { new() { BiedNr = 1 } };
        var gebruiker = new Gebruiker { GebruikerNr = 5, BedrijfsNaam = "Kweker BV" };
        var categorie = new Categorie { CategorieNr = 2, Naam = "Tulpen" };
        var veiling = new Veiling { VeilingNr = 3 };

        var product = new Veilingproduct
        {
            VeilingProductNr = 10,
            Naam = "Test",
            GeplaatstDatum = new DateTime(2025, 1, 1),
            AantalFusten = 2,
            VoorraadBloemen = 50,
            Startprijs = 20,
            CategorieNr = 2,
            VeilingNr = 3,
            Plaats = "Aalsmeer",
            Minimumprijs = 5,
            Kwekernr = 5,
            Gebruiker = gebruiker,
            BeginDatum = new DateOnly(2025, 1, 1),
            Status = ModelStatus.Inactive,
            ImagePath = "img.png",
            Categorie = categorie,
            Veiling = veiling,
            Biedingen = biedingen
        };

        Assert.Equal(10, product.VeilingProductNr);
        Assert.Equal("Test", product.Naam);
        Assert.Equal(new DateTime(2025, 1, 1), product.GeplaatstDatum);
        Assert.Equal(2, product.AantalFusten);
        Assert.Equal(50, product.VoorraadBloemen);
        Assert.Equal(20, product.Startprijs);
        Assert.Equal(2, product.CategorieNr);
        Assert.Equal(3, product.VeilingNr);
        Assert.Equal("Aalsmeer", product.Plaats);
        Assert.Equal(5, product.Minimumprijs);
        Assert.Equal(5, product.Kwekernr);
        Assert.Same(gebruiker, product.Gebruiker);
        Assert.Equal(new DateOnly(2025, 1, 1), product.BeginDatum);
        Assert.Equal(ModelStatus.Inactive, product.Status);
        Assert.Equal("img.png", product.ImagePath);
        Assert.Same(categorie, product.Categorie);
        Assert.Same(veiling, product.Veiling);
        Assert.Same(biedingen, product.Biedingen);
    }
}