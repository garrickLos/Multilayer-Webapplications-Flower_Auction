using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace mvc_api.Models;

/// <summary>
/// Database entity voor een gebruiker.
/// Erft van IdentityUser<int> zodat ASP.NET Identity login/rollen/wachtwoorden regelt.
/// Bevat extra velden zoals bedrijfsnaam, soort en adresgegevens.
/// </summary>
[Table("Gebruiker")]
public class Gebruiker : IdentityUser<int>
{
    /// <summary>
    /// Eigen gebruikersnummer (los van Identity Id, afhankelijk van je mapping).
    /// </summary>
    public int GebruikerNr { get; set; }

    /// <summary>
    /// Bedrijfsnaam / weergavenaam van de gebruiker (verplicht).
    /// </summary>
    [Required, StringLength(200)]
    public string BedrijfsNaam { get; set; } = string.Empty;

    /// <summary>
    /// Emailadres van de gebruiker (verplicht en geldig email format).
    /// Overschrijft IdentityUser.Email zodat validatie attributes werken.
    /// </summary>
    [Required, StringLength(200), EmailAddress]
    public override string? Email { get; set; } = string.Empty;

    /// <summary>
    /// Laatste moment waarop de gebruiker succesvol heeft ingelogd (UTC).
    /// </summary>
    public DateTime? LaatstIngelogd { get; set; }

    /// <summary>
    /// Status van het account (bijv. Active/Inactive/Deleted).
    /// </summary>
    public ModelStatus Status { get; set; } = ModelStatus.Active;

    /// <summary>
    /// Type gebruiker (bijv. Koper, Bedrijf, VeilingMeester).
    /// </summary>
    [Required, StringLength(50)]
    public string Soort { get; set; } = string.Empty;

    /// <summary>
    /// Kamer van Koophandel nummer (optioneel).
    /// </summary>
    [StringLength(20)]
    public string? Kvk { get; set; }

    /// <summary>
    /// Straat + huisnummer (optioneel).
    /// </summary>
    [StringLength(200)]
    public string? StraatAdres { get; set; }

    /// <summary>
    /// Postcode (optioneel).
    /// </summary>
    [StringLength(10)]
    public string? Postcode { get; set; }

    /// <summary>
    /// Navigatie property: alle biedingen van deze gebruiker.
    /// </summary>
    public virtual ICollection<Bieding> Biedingen { get; set; } = new List<Bieding>();
}
