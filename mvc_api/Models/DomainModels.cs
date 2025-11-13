using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace mvc_api.Models;

// Gebruiker
[Table("Gebruiker")]
public class Gebruiker
{
    [Key]
    public int GebruikerNr { get; set; }

    [Required, StringLength(200)]
    public string Naam { get; set; } = string.Empty;

    [Required, StringLength(200), EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string Wachtwoord { get; set; } = string.Empty;

    public DateTime? LaatstIngelogd { get; set; }

    [Required, StringLength(50)]
    public string Soort { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Kvk { get; set; }

    [StringLength(200)]
    public string? StraatAdres { get; set; }

    [StringLength(10)]
    public string? Postcode { get; set; }

    public int? Assortiment { get; set; }

    [StringLength(50)]
    public string? PersoneelsNr { get; set; }

    public virtual ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
}

// Bieding
[Table("Bieding")]
public class Bieding
{
    [Key]
    public int BiedNr { get; set; }

    [Precision(18, 2)]
    [Range(0.01, 999999999)]
    public decimal BedragPerFust { get; set; }

    [Range(1, int.MaxValue)]
    public int AantalStuks { get; set; }

    [ForeignKey(nameof(Gebruiker))]
    public int GebruikerNr { get; set; }

    [ForeignKey(nameof(Veiling))]
    public int VeilingNr { get; set; }

    public virtual Gebruiker? Gebruiker { get; set; }
    public virtual Veiling? Veiling { get; set; }
}

// Veilingproduct
[Table("Veilingproduct")]
public class Veilingproduct
{
    [Key]
    public int VeilingProductNr { get; set; }

    [Required, StringLength(200)]
    public string Naam { get; set; } = string.Empty;

    public DateTime GeplaatstDatum { get; set; } = DateTime.UtcNow;

    [Range(1, int.MaxValue)]
    public int Fust { get; set; }

    [Range(0, int.MaxValue)]
    public int Voorraad { get; set; }

    [Precision(18, 2)]
    [Range(0.01, 999999999)]
    public decimal Startprijs { get; set; }

    [ForeignKey(nameof(Categorie))]
    public int CategorieNr { get; set; }

    [ForeignKey(nameof(Veiling))]
    public int VeilingNr { get; set; }

    public virtual Categorie? Categorie { get; set; }
    public virtual Veiling? Veiling { get; set; }
    
}

//tijdelijk
[Table("Tijdelijk")]
public class TijdelijkProduct
{
    [Key]
    public string? Naam { get; set; }
    public string? Categorie { get; set; }
    public int? Voorraad { get; set; }
    public int? Fusten { get; set; }
    public string? Plaats { get; set; }
    public decimal? MinimalePrijs { get; set; }     
    public DateOnly? StartDatum { get; set; }
    public DateOnly? EindDatum { get; set; }
}


// Categorie
[Table("Categorie")]
public class Categorie
{
    [Key]
    public int CategorieNr { get; set; }

    [Required, StringLength(200)]
    public string Naam { get; set; } = string.Empty;

    public virtual ICollection<Veilingproduct> Veilingproducten { get; set; } = new List<Veilingproduct>();
}

// Veiling
[Table("Veiling")]
public class Veiling
{
    [Key]
    public int VeilingNr { get; set; }

    public DateTime Begintijd { get; set; }
    public DateTime Eindtijd { get; set; }

    // Status: "active", "inactive", "sold"
    [Required, StringLength(20)]
    public string Status { get; set; } = "inactive";

    public decimal Minimumprijs { get; set; }

    public virtual ICollection<Veilingproduct> Veilingproducten { get; set; } = new List<Veilingproduct>();
    public virtual ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
}
