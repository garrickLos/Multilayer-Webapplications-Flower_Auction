using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

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