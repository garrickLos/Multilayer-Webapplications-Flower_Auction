using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace mvc_api.Models;

// Gebruiker
[Table("Gebruiker")]
public class Gebruiker : IdentityUser<int>
{
    [Key]
    [Column("GebruikerNr")]
    public override int Id { get; set; }

    [NotMapped]
    public int GebruikerNr
    {
        get => Id;
        set => Id = value;
    }

    [Required, StringLength(200)]
    public string BedrijfsNaam { get; set; } = string.Empty;

    // Identity beheert email + password hash. Geen custom wachtwoord kolom meer in de entity.
    [Required, StringLength(200), EmailAddress]
    public override string? Email { get; set; } = string.Empty;

    public DateTime? LaatstIngelogd { get; set; }

    [Required, StringLength(50)]
    public string Soort { get; set; } = string.Empty;

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

    [Range(1, 999999999)]
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

// Veilingproduct
[Table("Veilingproduct")]
public class Veilingproduct
{
    [Key]
    public int VeilingProductNr { get; set; }

    [Required, StringLength(200)]
    public string Naam { get; set; } = string.Empty;

    // Geen dynamische standaardwaarde zodat het EF-model deterministisch blijft.
    public DateTime GeplaatstDatum { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Aantal fusten moet minimaal 1 zijn.")]
    public int AantalFusten { get; set; }

    [Range(0, int.MaxValue)]
    public int VoorraadBloemen { get; set; }

    [Range(1, 999999999)]
    public int? Startprijs { get; set; }

    [ForeignKey(nameof(Categorie))]
    public int CategorieNr { get; set; }

    [ForeignKey(nameof(Veiling))]
    public int? VeilingNr { get; set; }

    [Required, StringLength(200)]
    public string Plaats { get; set; } = string.Empty;

    [Range(1, 999999999)]

    public int Minimumprijs { get; set; }

    public int Kwekernr { get; set; }

    [ForeignKey(nameof(Kwekernr))]
    public Gebruiker Gebruiker { get; set; } = null!;

    public DateOnly beginDatum { get; set; }

    public bool status { get; set; }

    [Required, StringLength(200)]
    public string ImagePath { get; set; } = string.Empty;

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
    public string VeilingNaam { get; set; } = string.Empty;

    public DateTime Begintijd { get; set; }
    public DateTime Eindtijd { get; set; }

    // Status: "active", "inactive", "sold"
    [Required, StringLength(20)]
    public string Status { get; set; } = "inactive";

    public virtual ICollection<Veilingproduct> Veilingproducten { get; set; } = new List<Veilingproduct>();
    public virtual ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
}
