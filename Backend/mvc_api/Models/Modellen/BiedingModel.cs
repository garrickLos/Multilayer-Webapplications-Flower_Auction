using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

/// <summary>
/// Database entity voor een bieding op een veilingproduct.
/// Bevat het bod (prijs), hoeveelheid en de koppeling naar gebruiker en veilingproduct.
/// </summary>
[Table("Bieding")]
public class Bieding
{
    /// <summary>
    /// Primary key van de bieding.
    /// </summary>
    [Key]
    public int BiedNr { get; set; }

    /// <summary>
    /// Het geboden bedrag per fust (moet binnen een geldig bereik vallen).
    /// </summary>
    [Range(1, 999_999_999)]
    public int BedragPerFust { get; set; }

    /// <summary>
    /// Hoeveel stuks/fusten er geboden wordt (minimaal 1).
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "Aantal stuks moet minimaal 1 zijn.")]
    public int AantalStuks { get; set; }

    /// <summary>
    /// Foreign key naar de gebruiker die de bieding plaatst.
    /// </summary>
    [ForeignKey(nameof(Gebruiker))]
    public int GebruikerNr { get; set; }

    /// <summary>
    /// Foreign key naar het veilingproduct waarop geboden wordt.
    /// </summary>
    [ForeignKey(nameof(Veilingproduct))]
    public int VeilingproductNr { get; set; }

    /// <summary>
    /// Navigatie property naar de gebruiker (kan null zijn als niet geladen).
    /// </summary>
    public virtual Gebruiker? Gebruiker { get; set; }

    /// <summary>
    /// Navigatie property naar het veilingproduct (kan null zijn als niet geladen).
    /// </summary>
    public virtual Veilingproduct? Veilingproduct { get; set; }
}