using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace mvc_api.Models
{
    // Gebruiker
    public class Gebruiker
    {
        [Key]
        public int GebruikerNr { get; set; }

        [Required, MaxLength(200)]
        public string Naam { get; set; } = string.Empty;

        [Required, MaxLength(200), EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Wachtwoord { get; set; } = string.Empty;

        public DateTime? LaatstIngelogd { get; set; }

        [Required, MaxLength(50)]
        public string Soort { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Kvk { get; set; }

        [MaxLength(200)]
        public string? StraatAdres { get; set; }

        [MaxLength(10)]
        public string? Postcode { get; set; }

        public int? Assortiment { get; set; }

        [MaxLength(50)]
        public string? PersoneelsNr { get; set; }

        public ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
    }

    // Bieding
    public class Bieding
    {
        [Key]
        public int BiedNr { get; set; }

        [Range(0, 999_999_999)]
        [Precision(18, 2)]
        public decimal BedragPerFust { get; set; }

        [Range(1, int.MaxValue)]
        public int AantalStuks { get; set; }

        [ForeignKey(nameof(Gebruiker))]
        public int GebruikerNr { get; set; }

        [ForeignKey(nameof(Veiling))]
        public int VeilingNr { get; set; }

        public Gebruiker? Gebruiker { get; set; }
        public Veiling? Veiling { get; set; }
    }

    // Veilingproduct
    public class Veilingproduct
    {
        [Key]
        public int VeilingProductNr { get; set; }

        [Required, MaxLength(200)]
        public string Naam { get; set; } = string.Empty;

        // Default in C#; DB default kun je optioneel ook in OnModelCreating zetten
        public DateTime GeplaatstDatum { get; set; } = DateTime.UtcNow;

        [Range(1, int.MaxValue)]
        public int Fust { get; set; }

        [Range(0, int.MaxValue)]
        public int Voorraad { get; set; }

        [Range(0, 999_999_999)]
        [Precision(18, 2)]
        public decimal Startprijs { get; set; }

        [ForeignKey(nameof(Categorie))]
        public int CategorieNr { get; set; }

        public Categorie? Categorie { get; set; }
        public ICollection<Veiling> Veilingen { get; set; } = new List<Veiling>();
    }

    // Categorie
    public class Categorie
    {
        [Key]
        public int CategorieNr { get; set; }

        [Required, MaxLength(200)]
        public string Naam { get; set; } = string.Empty;

        public ICollection<Veilingproduct> Veilingproducten { get; set; } = new List<Veilingproduct>();
    }

    // Veiling
    public class Veiling
    {
        [Key]
        public int VeilingNr { get; set; }

        public DateTime? Begintijd { get; set; }
        public DateTime? Eindtijd { get; set; }

        [ForeignKey(nameof(Veilingproduct))]
        public int VeilingProductNr { get; set; }

        // Status van de veiling: "active", "inactive" of "sold"
        [Required, MaxLength(20)]
        public string Status { get; set; } = "inactive";

        public Veilingproduct? Veilingproduct { get; set; }
        public ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
    }
}
