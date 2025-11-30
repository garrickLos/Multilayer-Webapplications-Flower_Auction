using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace mvc_api.Models;

[Table("Gebruiker")]
public class Gebruiker : IdentityUser<int>
{
    // Domain-ID waarop je overal filtert (gewoon gemapt, dus bruikbaar in LINQ)
    public int GebruikerNr { get; set; }

    [Required, StringLength(200)]
    public string BedrijfsNaam { get; set; } = string.Empty;

    // Identity beheert Email + PasswordHash; we laten Email hier gewoon staan
    [Required, StringLength(200), EmailAddress]
    public override string? Email { get; set; } = string.Empty;

    public DateTime? LaatstIngelogd { get; set; }

    public ModelStatus Status { get; set; } = ModelStatus.Active;

    [Required, StringLength(50)]
    public string Soort { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Kvk { get; set; }

    [StringLength(200)]
    public string? StraatAdres { get; set; }

    [StringLength(10)]
    public string? Postcode { get; set; }

    public virtual ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
}