using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace mvc_api.Models
{
    public class Gebruiker
    {
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
        public string Kvk { get; set; } = string.Empty;

        [MaxLength(200)]
        public string StraatAdres { get; set; } = string.Empty;

        [MaxLength(10)]
        public string Postcode { get; set; } = string.Empty;

        public int Assortiment { get; set; }

        [MaxLength(50)]
        public string PersoneelsNr { get; set; } = string.Empty;

        public ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
    }

    public class Bieding
    {
        public int BiedNr { get; set; }
        [Range(0, 999_999_999)] [Precision(18, 2)]
        public decimal BedragPerFust { get; set; }
        [Range(1, int.MaxValue)]
        public int AantalStuks { get; set; }

        [Range(1, int.MaxValue)]
        public int GebruikerNr { get; set; }

        [Range(1, int.MaxValue)]
        public int VeilingNr { get; set; }

        public Gebruiker? Gebruiker { get; set; }
        public Veiling? Veiling { get; set; }
    }


    public class Veilingproduct
    {
        public int VeilingNr { get; set; }
        [Required, MaxLength(200)]
        public string Naam { get; set; } = string.Empty;
        public DateTime GeplaatstDatum { get; set; }
        [Range(1, int.MaxValue)]
        public int Fust { get; set; }
        [Range(0, int.MaxValue)]
        public int Voorraad { get; set; }
        [Range(0, 999_999_999)] [Precision(18, 2)]
        public decimal Startprijs { get; set; }
        [Range(1, int.MaxValue)]
        public int CategorieNr { get; set; }

        public Categorie? Categorie { get; set; }
        public ICollection<Veiling> Veilingen { get; set; } = new List<Veiling>();
    }


    public class Categorie
    {
        public int CategorieNr { get; set; }

        [Required, MaxLength(200)]
        public string Naam { get; set; } = string.Empty;

        public ICollection<Veilingproduct> Veilingproducten { get; set; } = new List<Veilingproduct>();
    }

    public class Veiling
    {
        public int VeilingNr { get; set; }
        public DateTime? Begintijd { get; set; }
        public DateTime? Eindtijd { get; set; }

        [Range(1, int.MaxValue)]
        [ForeignKey(nameof(Veilingproduct))]
        public int VeilingProduct { get; set; }
        public Veilingproduct? Veilingproduct { get; set; }

        public ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
    }
}
