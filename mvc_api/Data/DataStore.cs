using mvc_api.Models;

namespace mvc_api.Data;

/* Nepdata voor demo en ontwikkeling zonder database.
 Thomas verander deze met data van database */
public static class DataStore
{
    public static List<Gebruiker> Gebruikers { get; } = new()
    {
        new Gebruiker { GebruikerNr = 1, Naam = "Flora BV", Email = "flora@example.nl", Wachtwoord="***", Laatst_Ingelogd = DateTime.Now.AddDays(-1),
            SOORT="Bedrijf", KVK="12345678", StraatAdres="Bloemweg 10", Postcode="1234AB", Assortiment=12, PersoneelsNr="P1001" },
        new Gebruiker { GebruikerNr = 2, Naam = "Jan Jansen", Email = "jan@example.nl", Wachtwoord="***", Laatst_Ingelogd = DateTime.Now.AddDays(-2),
            SOORT="Koper", KVK="00000000", StraatAdres="Laan 5", Postcode="2345BC", Assortiment=0, PersoneelsNr="P0000" }
    };

    public static List<Categorie> Categorieen { get; } = new()
    {
        new Categorie { CategorieNr = 1, Naam = "Tulpen" },
        new Categorie { CategorieNr = 2, Naam = "Rozen" }
    };

    public static List<Veilingproduct> Veilingproducten { get; } = new()
    {
        new Veilingproduct { VeilingNr = 101, Naam = "Tulp Mix", Geplaatst_Datum = DateTime.Today, Fust = 10, Voorraad = 500, Startprijs = 12, CategorieNr = 1 },
        new Veilingproduct { VeilingNr = 102, Naam = "Rode Roos", Geplaatst_Datum = DateTime.Today, Fust = 10, Voorraad = 300, Startprijs = 20, CategorieNr = 2 }
    };

    public static List<Veiling> Veilingen { get; } = new()
    {
        new Veiling { VeilingNr = 201, Begintijd = new TimeSpan(9, 0, 0),  Eindtijd = new TimeSpan(10, 0, 0), VeilingProduct = 101 },
        new Veiling { VeilingNr = 202, Begintijd = new TimeSpan(10, 0, 0), Eindtijd = new TimeSpan(11, 0, 0), VeilingProduct = 102 }
    };

    public static List<Bieding> Biedingen { get; } = new()
    {
        new Bieding { BiedNr = 1001, BedragPerFust = 13.50m, AantalStuks = 5,  GebruikerNr = 2, VeilingNr = 101 },
        new Bieding { BiedNr = 1002, BedragPerFust = 21.00m, AantalStuks = 3,  GebruikerNr = 2, VeilingNr = 102 }
    };
}