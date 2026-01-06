using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

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
}