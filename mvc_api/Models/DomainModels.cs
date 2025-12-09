using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

public enum ModelStatus
{
    Active,
    Inactive,
    Deleted,
    Archived
}

// Bieding
[Table("Bieding")]
public class Bieding
{
    [Key]
    public int BiedNr { get; set; }

    [Range(1, 999_999_999)]
    public int BedragPerFust { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Aantal stuks moet minimaal 1 zijn.")]
    public int AantalStuks { get; set; }

    [ForeignKey(nameof(Gebruiker))]
    public int GebruikerNr { get; set; }

    [ForeignKey(nameof(Veiling))]
    public int VeilingNr { get; set; }

    [ForeignKey(nameof(Veilingproduct))]
    public int VeilingproductNr { get; set; }

    public virtual Gebruiker? Gebruiker { get; set; }
    public virtual Veiling? Veiling { get; set; }
    public virtual Veilingproduct? Veilingproduct { get; set; }
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
    public string VeilingNaam { get; set; } = string.Empty;

    public DateTime Begintijd { get; set; }
    public DateTime Eindtijd { get; set; }

    // Status: "active", "inactive", "sold"
    [Required, StringLength(20)]
    public string Status { get; set; } = "inactive";

    public virtual ICollection<Veilingproduct> Veilingproducten { get; set; } = new List<Veilingproduct>();
    public virtual ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
}