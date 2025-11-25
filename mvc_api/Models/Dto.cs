using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace mvc_api.Models;

// Categorie CRUD
public sealed class CategorieCreateDto
{
    [Required, StringLength(200)]
    public string Naam { get; init; } = string.Empty;
}

public sealed class CategorieUpdateDto
{
    [Required, StringLength(200)]
    public string Naam { get; init; } = string.Empty;
}

// Bieding CRUD
public abstract record BaseBiedingDto
{
    [Range(typeof(decimal), "0.01", "9999999")]
    public decimal BedragPerFust { get; init; }

    [Range(1, int.MaxValue)]
    public int AantalStuks { get; init; }

    [Range(1, int.MaxValue)]
    public int GebruikerNr { get; init; }
}

public sealed record VeilingMeester_BiedingDto : BaseBiedingDto
{
    public int BiedingNr { get; init; }

    [Range(1, int.MaxValue)]
    [Required]
    public int VeilingNr { get; init; }

    [Required]
    public int VeilingProductNr { get; init; }
}

public sealed record BiedingCreateDto : BaseBiedingDto
{
    public int BiedingNr { get; init; }

    public int VeilingNr { get; init; }
    public int VeilingproductNr { get; init; }
}

public sealed record BiedingUpdateDto : BaseBiedingDto;

// Gebruiker CRUD
public abstract record BaseGebruiker
{
    [Required, StringLength(200)]
    public string BedrijfsNaam { get; init; } = string.Empty;

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(200)]
    public string Wachtwoord { get; init; } = string.Empty;

    public DateTime? LaatstIngelogd { get; init; }

    [Required, StringLength(50)]
    public string Soort { get; init; } = string.Empty;

    [StringLength(20)]
    public string? Kvk { get; init; }

    [StringLength(200)]
    public string? StraatAdres { get; init; }

    [StringLength(10)]
    public string? Postcode { get; init; }
}

public sealed record GebruikerCreateDto : BaseGebruiker;

public sealed record GebruikerUpdateDto : BaseGebruiker;

public sealed record Klant_GebruikerDto : BaseGebruiker
{
    public int GebruikerNr { get; init; }

    public IEnumerable<VeilingMeester_BiedingDto> Biedingen { get; init; } = Enumerable.Empty<VeilingMeester_BiedingDto>();
}

// Veiling CRUD
public abstract record BaseVeilingDto
{
    [Required]
    [StringLength(100)]
    public string VeilingNaam { get; init; } = string.Empty;

    [Required]
    public DateTime Begintijd { get; init; }

    [Required]
    public DateTime Eindtijd { get; init; }
}

public sealed record Klant_VeilingDto : BaseVeilingDto
{
    public int VeilingNr { get; init; }

    [StringLength(20)]
    public string Status { get; init; } = string.Empty;

    public IEnumerable<VeilingProductDto>? Producten { get; init; } = Enumerable.Empty<VeilingProductDto>();
}

public sealed record VeilingCreateDto : BaseVeilingDto
{
    [StringLength(20)]
    public string Status { get; init; } = string.Empty;
}

public sealed record VeilingUpdateDto : BaseVeilingDto;

public sealed record VeilingMeester_VeilingDto : BaseVeilingDto
{
    [StringLength(20)]
    public string Status { get; init; } = string.Empty;
    public int VeilingNr { get; init; }
    public IEnumerable<VeilingProductDto> Producten { get; init; } = Enumerable.Empty<VeilingProductDto>();
    public IEnumerable<VeilingMeester_BiedingDto> Biedingen { get; init; } = Enumerable.Empty<VeilingMeester_BiedingDto>();
}

public sealed record VeilingProductDto(
    int VeilingProductNr,
    string Naam,
    decimal Startprijs,
    int Voorraad,
    string ImagePath
);
