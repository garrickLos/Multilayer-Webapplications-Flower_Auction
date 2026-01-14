using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

/// <summary>
/// Database entity voor een categorie (bijv. rozen, tulpen).
/// Wordt gebruikt om veilingproducten te groeperen.
/// </summary>
[Table("Categorie")]
public class Categorie
{
    /// <summary>
    /// Primary key van de categorie.
    /// </summary>
    [Key]
    public int CategorieNr { get; set; }

    /// <summary>
    /// Naam van de categorie (verplicht, max 200 tekens).
    /// </summary>
    [Required, StringLength(200)]
    public string Naam { get; set; } = string.Empty;

    /// <summary>
    /// Navigatie property: alle veilingproducten die binnen deze categorie vallen.
    /// </summary>
    public virtual ICollection<Veilingproduct> Veilingproducten { get; set; } = new List<Veilingproduct>();
}