using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

/// <summary>
/// Database entity voor een veiling.
/// Bevat basisgegevens (naam, begin/eindtijd, status) en een lijst met gekoppelde veilingproducten.
/// </summary>
[Table("Veiling")]
public class Veiling
{
    /// <summary>
    /// Primary key van de veiling.
    /// </summary>
    [Key]
    public int VeilingNr { get; set; }

    /// <summary>
    /// Naam/titel van de veiling (verplicht, max 100 tekens).
    /// </summary>
    [Required, StringLength(100)]
    public string VeilingNaam { get; set; } = string.Empty;

    /// <summary>
    /// Geplande starttijd van de veiling.
    /// </summary>
    public DateTime Begintijd { get; set; }

    /// <summary>
    /// Optionele aangepaste starttijd (bijv. als de start wordt verplaatst).
    /// </summary>
    public DateTime? GeupdateBeginTijd { get; set; }

    /// <summary>
    /// Eindtijd van de veiling.
    /// </summary>
    public DateTime Eindtijd { get; set; }

    /// <summary>
    /// Status van de veiling als string (bijv. active/inactive/uitverkocht/afgesloten/geannuleerd).
    /// </summary>
    [Required, StringLength(20)]
    public string Status { get; set; } = "inactive";

    /// <summary>
    /// Navigatie property: alle veilingproducten die aan deze veiling gekoppeld zijn.
    /// </summary>
    public virtual ICollection<Veilingproduct> Veilingproducten { get; set; } = new List<Veilingproduct>();
}