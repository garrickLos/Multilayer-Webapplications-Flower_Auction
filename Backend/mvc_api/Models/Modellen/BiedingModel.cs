using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mvc_api.Models;

// Bieding
[Table("Bieding")]
public class Bieding
{
    [Key]
    public int BiedNr { get; set; }

    [Range(1, 999_999_999)]
    public int BedragPerFust { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Aantal stuks moet minimaal 1 zijn.")]
    public int AantalStuks { get; set; }

    [ForeignKey(nameof(Gebruiker))]
    public int GebruikerNr { get; set; }

    [ForeignKey(nameof(Veilingproduct))]
    public int VeilingproductNr { get; set; }

    public virtual Gebruiker? Gebruiker { get; set; }
    public virtual Veilingproduct? Veilingproduct { get; set; }
}