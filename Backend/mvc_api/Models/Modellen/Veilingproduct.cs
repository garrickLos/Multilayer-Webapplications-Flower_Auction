using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

/// <summary>
/// Database entity voor een veilingproduct (product dat door een kweker wordt aangeboden).
/// Kan los staan (nog niet ingepland) of gekoppeld zijn aan een veiling.
/// </summary>
[Table("Veilingproduct")]
public class Veilingproduct
{
    /// <summary>
    /// Primary key van het veilingproduct.
    /// </summary>
    [Key]
    public int VeilingProductNr { get; set; }

    /// <summary>
    /// Naam van het product (verplicht, max 200 tekens).
    /// </summary>
    [Required, StringLength(200)]
    public string Naam { get; set; } = string.Empty;

    /// <summary>
    /// Datum waarop het product is geplaatst/aangemaakt.
    /// </summary>
    public DateTime GeplaatstDatum { get; set; }

    /// <summary>
    /// Aantal fusten dat wordt aangeboden (minimaal 1).
    /// </summary>
    [Range(1, int.MaxValue)]
    public int AantalFusten { get; set; }

    /// <summary>
    /// Huidige voorraad bloemen (mag 0 zijn).
    /// </summary>
    [Range(0, int.MaxValue)]
    public int VoorraadBloemen { get; set; }

    /// <summary>
    /// Startprijs per fust (wordt meestal door de veilingmeester gezet bij koppelen aan een veiling).
    /// </summary>
    [Range(0, int.MaxValue)]
    public int? Startprijs { get; set; }

    /// <summary>
    /// Foreign key naar de categorie van dit product.
    /// </summary>
    [ForeignKey(nameof(Categorie))]
    public int CategorieNr { get; set; }

    /// <summary>
    /// Foreign key naar de veiling (null als nog niet gekoppeld/gepland).
    /// </summary>
    [ForeignKey(nameof(Veiling))]
    public int? VeilingNr { get; set; }

    /// <summary>
    /// Plaats/locatie van het product (verplicht).
    /// </summary>
    [Required, StringLength(200)]
    public string Plaats { get; set; } = string.Empty;

    /// <summary>
    /// Minimumprijs per fust (ondergrens voor verkoop/biedingen).
    /// </summary>
    [Range(1, 999_999_999)]
    public int Minimumprijs { get; set; }

    /// <summary>
    /// ID van de kweker (gebruiker) die dit product aanbiedt.
    /// </summary>
    public int Kwekernr { get; set; }

    /// <summary>
    /// Navigatie naar de kweker/gebruiker die dit product heeft aangemaakt.
    /// </summary>
    [ForeignKey(nameof(Kwekernr))]
    public Gebruiker Gebruiker { get; set; } = null!;

    /// <summary>
    /// Optionele begindatum (bijv. startdatum beschikbaarheid/veilingplanning).
    /// </summary>
    public DateOnly? BeginDatum { get; set; }

    /// <summary>
    /// Status van het product (bijv. Active/Inactive/Deleted/Archived).
    /// </summary>
    public ModelStatus Status { get; set; } = ModelStatus.Active;

    /// <summary>
    /// Pad/URL naar de productafbeelding (verplicht).
    /// </summary>
    [Required, StringLength(200)]
    public string ImagePath { get; set; } = string.Empty;

    /// <summary>
    /// Navigatie property naar categorie (kan null zijn als niet geladen).
    /// </summary>
    public virtual Categorie? Categorie { get; set; }

    /// <summary>
    /// Navigatie property naar veiling (kan null zijn als niet geladen of niet gekoppeld).
    /// </summary>
    public virtual Veiling? Veiling { get; set; }

    /// <summary>
    /// Navigatie property: alle biedingen die op dit product zijn geplaatst.
    /// </summary>
    public virtual ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
}
