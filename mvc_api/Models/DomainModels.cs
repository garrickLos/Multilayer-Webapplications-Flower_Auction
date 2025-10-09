namespace mvc_api.Models
{
    public class Gebruiker
    {
        public int GebruikerNr { get; set; }
        public string Naam { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Wachtwoord { get; set; } = string.Empty;
        public DateTime? LaatstIngelogd { get; set; }   // gebruik camel-case propertynaam
        public string Soort { get; set; } = string.Empty;
        public string Kvk { get; set; } = string.Empty;
        public string StraatAdres { get; set; } = string.Empty;
        public string Postcode { get; set; } = string.Empty;
        public int Assortiment { get; set; }
        public string PersoneelsNr { get; set; } = string.Empty;

        // Navigatie-eigenschap (handig voor EF Core later)
        public ICollection<Bieding>? Biedingen { get; set; }
    }
    
    public class Bieding
    {
        public int BiedNr { get; set; }
        public decimal BedragPerFust { get; set; }   // kolom in DB: bedragPE
        public int AantalStuks { get; set; }         // aantal fusten
        public int GebruikerNr { get; set; }         // FK → Gebruiker
        public int VeilingNr { get; set; }           // FK → Veilingproduct

        // Navigatie-eigenschappen
        public Gebruiker? Gebruiker { get; set; }
        public Veilingproduct? Veilingproduct { get; set; }
    }
    
    public class Veilingproduct
    {
        public int VeilingNr { get; set; }
        public string Naam { get; set; } = string.Empty;
        public DateTime GeplaatstDatum { get; set; } // duidelijkere naam, zonder underscore
        public int Fust { get; set; }                // 1 fust = 10 stuks (voorbeeld)
        public int Voorraad { get; set; }            // totaal stuks
        public int Startprijs { get; set; }
        public int CategorieNr { get; set; }         // FK → Categorie

        // Navigatie-eigenschappen
        public Categorie? Categorie { get; set; }
        public ICollection<Bieding>? Biedingen { get; set; }
        public ICollection<Veiling>? Veilingen { get; set; }
    }
    
    public class Categorie
    {
        public int CategorieNr { get; set; }
        public string Naam { get; set; } = string.Empty;

        // Navigatie-eigenschap
        public ICollection<Veilingproduct>? Veilingproducten { get; set; }
    }
    
    public class Veiling
    {
        public int VeilingNr { get; set; }
        public TimeSpan? Begintijd { get; set; }
        public TimeSpan? Eindtijd { get; set; }
        public int VeilingProduct { get; set; } // FK → Veilingproduct.VeilingNr

        // Navigatie-eigenschap
        public Veilingproduct? Veilingproduct { get; set; }
    }
}
