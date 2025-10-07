namespace mvc_api.Models;

// Tabel: Gebruiker
public class Gebruiker
{
    public int GebruikerNr { get; set; }
    public string Naam { get; set; } = "";
    public string Email { get; set; } = "";
    public string Wachtwoord { get; set; } = "";
    public DateTime? Laatst_Ingelogd { get; set; }
    public string SOORT { get; set; } = "";
    public string KVK { get; set; } = "";
    public string StraatAdres { get; set; } = "";
    public string Postcode { get; set; } = "";
    public int Assortiment { get; set; }
    public string PersoneelsNr { get; set; } = "";
}

// Tabel: Bieding
public class Bieding
{
    public int BiedNr { get; set; }
    public decimal BedragPerFust { get; set; } // DB-kolom: bedragPE
    public int AantalStuks { get; set; }       // aantal fusten
    public int GebruikerNr { get; set; }       // FK -> Gebruiker
    public int VeilingNr { get; set; }         // FK -> Veilingproduct
}

// Tabel: Veilingproduct
public class Veilingproduct
{
    public int VeilingNr { get; set; }
    public string Naam { get; set; } = "";
    public DateTime Geplaatst_Datum { get; set; }
    public int Fust { get; set; }      // 1 fust = 10 stuks (voorbeeld)
    public int Voorraad { get; set; }  // totaal stuks
    public int Startprijs { get; set; }
    public int CategorieNr { get; set; } // FK -> Categorie
}

// Tabel: Categorie
public class Categorie
{
    public int CategorieNr { get; set; }
    public string Naam { get; set; } = "";
}

// Tabel: Veiling
public class Veiling
{
    public int VeilingNr { get; set; }
    public TimeSpan? Begintijd { get; set; }
    public TimeSpan? Eindtijd { get; set; }
    public int VeilingProduct { get; set; } // FK -> Veilingproduct.VeilingNr
}
