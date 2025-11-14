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
    public string? BedrijfsNaam { get; set; }

    [Required, StringLength(200), EmailAddress]
    public string? Email { get; set; }

    [Required, StringLength(200)]
    public string? Wachtwoord { get; set; }

    public DateTime? LaatstIngelogd { get; set; }

    [Required, StringLength(50)]
    public string? Soort { get; set; }

    [StringLength(20)]
    public string? Kvk { get; set; }

    [StringLength(200)]
    public string? StraatAdres { get; set; }

    [StringLength(10)]
    public string? Postcode { get; set; }

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
    public string Naam { get; set; }

    public DateTime GeplaatstDatum { get; set; } = DateTime.UtcNow;

    [Range(1, int.MaxValue)]
    public int AantalFusten { get; set; }

    [Range(0, int.MaxValue)]
    public int VoorraadBloemen { get; set; }

    [Precision(18, 2)]
    [Range(0.01, 999999999)]
    public decimal Startprijs { get; set; }

    [ForeignKey(nameof(Categorie))]
    public int CategorieNr { get; set; }

    [ForeignKey(nameof(Veiling))]
    public int VeilingNr { get; set; }

    public string Plaats { get; set; }

    public decimal Minimumprijs { get; set; }

    public int Kwekernr { get; set; } // foreign key

    [ForeignKey(nameof(Kwekernr))]
    public Gebruiker Gebruiker { get; set; }

    public DateTime beginDatum { get; set; }

    public bool status { get; set; }

    [StringLength(200)]
    public string ImagePath { get; set; }

    public virtual Categorie? Categorie { get; set; }
    public virtual Veiling? Veiling { get; set; }
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

    [Required, StringLength(100)]
    public string? VeilingNaam {get; set;}

    public DateTime Begintijd { get; set; }
    public DateTime Eindtijd { get; set; }

    // Status: "active", "inactive", "sold"
    [Required, StringLength(20)]
    public string Status { get; set; } = "inactive";

    public virtual ICollection<Veilingproduct> Veilingproducten { get; set; } = new List<Veilingproduct>();
    public virtual ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
}
