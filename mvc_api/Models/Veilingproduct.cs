using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

[Table("Veilingproduct")]
public class Veilingproduct
{
    [Key]
    public int VeilingProductNr { get; set; }

    [Required, StringLength(200)]
    public string Naam { get; set; } = string.Empty;

    public DateTime GeplaatstDatum { get; set; }

    [Range(1, int.MaxValue)]
    public int AantalFusten { get; set; }

    [Range(0, int.MaxValue)]
    public int VoorraadBloemen { get; set; }

    [Range(1, 999_999_999)]
    public int? Startprijs { get; set; }

    [ForeignKey(nameof(Categorie))]
    public int CategorieNr { get; set; }

    [ForeignKey(nameof(Veiling))]
    public int? VeilingNr { get; set; }

    [Required, StringLength(200)]
    public string Plaats { get; set; } = string.Empty;

    [Range(1, 999_999_999)]
    public int Minimumprijs { get; set; }

    public int Kwekernr { get; set; }

    [ForeignKey(nameof(Kwekernr))]
    public Gebruiker Gebruiker { get; set; } = null!;

    public DateOnly? BeginDatum { get; set; }

    public ModelStatus Status { get; set; } = ModelStatus.Active;

    [Required, StringLength(200)]
    public string ImagePath { get; set; } = string.Empty;

    public virtual Categorie? Categorie { get; set; }
    public virtual Veiling? Veiling { get; set; }
}