using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace mvc_api.Models;

// Categorie DTO's
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

public sealed class CategorieListDto
{
    public int CategorieNr { get; init; }
    public string Naam { get; init; } = string.Empty;
}

public sealed class CategorieDetailDto
{
    public int CategorieNr { get; init; }
    public string Naam { get; init; } = string.Empty;
}

// Bieding DTO's
public abstract class BiedingBaseAmountDto
{
    [Range(typeof(decimal), "0.01", "9999999")]
    public decimal BedragPerFust { get; init; }

    [Range(1, int.MaxValue)]
    public int AantalStuks { get; init; }
}

public sealed class BiedingCreateDto : BiedingBaseAmountDto
{
    public int BiedingNr { get; init; }

    [Range(1, int.MaxValue)]
    public int GebruikerNr { get; init; }

    [Range(1, int.MaxValue)]
    public int VeilingNr { get; init; }

    [Range(1, int.MaxValue)]
    public int VeilingproductNr { get; init; }
}

public sealed class BiedingUpdateDto : BiedingBaseAmountDto
{
}

public sealed class VeilingMeester_BiedingDto : BiedingBaseAmountDto
{
    public int BiedingNr { get; init; }

    public int GebruikerNr { get; init; }

    public int VeilingNr { get; init; }

    public int VeilingProductNr { get; init; }
}

// Gebruiker DTO's
public abstract class BaseGebruiker
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

public sealed class GebruikerCreateDto : BaseGebruiker
{
}

public sealed class GebruikerUpdateDto : BaseGebruiker
{
}

public sealed class Klant_GebruikerDto : BaseGebruiker
{
    public int GebruikerNr { get; init; }

    public IEnumerable<VeilingMeester_BiedingDto> Biedingen { get; init; } = new List<VeilingMeester_BiedingDto>();
}

// Veiling DTO's
public abstract class BaseVeilingDto
{
    [Required]
    [StringLength(100)]
    public string VeilingNaam { get; init; } = string.Empty;

    [Required]
    public DateTime Begintijd { get; init; }

    [Required]
    public DateTime Eindtijd { get; init; }
}

public sealed class Klant_VeilingDto : BaseVeilingDto
{
    public int VeilingNr { get; init; }

    [StringLength(20)]
    public string Status { get; init; } = string.Empty;

    public IEnumerable<VeilingProductDto> Producten { get; init; } = new List<VeilingProductDto>();
}

public sealed class VeilingCreateDto : BaseVeilingDto
{
    [StringLength(20)]
    public string Status { get; init; } = string.Empty;
}

public sealed class VeilingUpdateDto : BaseVeilingDto
{
}

public sealed class VeilingMeester_VeilingDto : BaseVeilingDto
{
    [StringLength(20)]
    public string Status { get; init; } = string.Empty;

    public int VeilingNr { get; init; }

    public IEnumerable<VeilingProductDto> Producten { get; init; } = new List<VeilingProductDto>();

    public IEnumerable<VeilingMeester_BiedingDto> Biedingen { get; init; } = new List<VeilingMeester_BiedingDto>();
}

public sealed class VeilingProductDto
{
    public int VeilingProductNr { get; init; }
    public string Naam { get; init; } = string.Empty;
    public decimal Startprijs { get; init; }
    public int Voorraad { get; init; }
    public string ImagePath { get; init; } = string.Empty;
}

// Veilingproduct DTO's
public sealed class VeilingproductCreateDto
{
    [Required, StringLength(200)]
    public string Naam { get; init; } = string.Empty;

    public DateTime? GeplaatstDatum { get; init; }

    [Range(1, int.MaxValue)]
    public int Fust { get; init; }

    [Range(0, int.MaxValue)]
    public int Voorraad { get; init; }

    [Range(typeof(decimal), "0.01", "999999999")]
    public decimal Startprijs { get; init; }

    [Range(1, int.MaxValue)]
    public int CategorieNr { get; init; }

    [Range(1, int.MaxValue)]
    public int VeilingNr { get; init; }

    [Required, StringLength(200)]
    public string Plaats { get; init; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Minimumprijs { get; init; }

    [Range(1, int.MaxValue)]
    public int Kwekernr { get; init; }

    public DateOnly BeginDatum { get; init; }

    public bool Status { get; init; }

    [Required, StringLength(200)]
    public string ImagePath { get; init; } = string.Empty;
}

public sealed class VeilingproductUpdateDto
{
    [Required, StringLength(200)]
    public string Naam { get; init; } = string.Empty;

    public DateTime? GeplaatstDatum { get; init; }

    [Range(1, int.MaxValue)]
    public int Fust { get; init; }

    [Range(0, int.MaxValue)]
    public int Voorraad { get; init; }

    [Range(typeof(decimal), "0.01", "999999999")]
    public decimal Startprijs { get; init; }

    [Range(1, int.MaxValue)]
    public int CategorieNr { get; init; }

    [Range(1, int.MaxValue)]
    public int VeilingNr { get; init; }

    [Range(1, int.MaxValue)]
    public int Kwekernr { get; init; }

    [Required, StringLength(200)]
    public string Plaats { get; init; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Minimumprijs { get; init; }

    public DateOnly BeginDatum { get; init; }

    public bool Status { get; init; }

    [Required, StringLength(200)]
    public string ImagePath { get; init; } = string.Empty;
}

public sealed class VeilingproductListDto
{
    public int VeilingProductNr { get; init; }
    public string Naam { get; init; } = string.Empty;
    public DateTime GeplaatstDatum { get; init; }
    public int Fust { get; init; }
    public int Voorraad { get; init; }
    public decimal Startprijs { get; init; }
    public int Minimumprijs { get; init; }
    public string Plaats { get; init; } = string.Empty;
    public string? Categorie { get; init; }
    public int VeilingNr { get; init; }
    public int Kwekernr { get; init; }
    public DateOnly BeginDatum { get; init; }
    public bool Status { get; init; }
    public string ImagePath { get; init; } = string.Empty;
}

public sealed class VeilingproductBidListItem
{
    public int BiedNr { get; init; }
    public decimal BedragPerFust { get; init; }
    public int AantalStuks { get; init; }
    public int GebruikerNr { get; init; }
}

public sealed class VeilingproductDetailDto
{
    public int VeilingProductNr { get; init; }
    public string Naam { get; init; } = string.Empty;
    public DateTime GeplaatstDatum { get; init; }
    public int Fust { get; init; }
    public int Voorraad { get; init; }
    public decimal Startprijs { get; init; }
    public int Minimumprijs { get; init; }
    public string Plaats { get; init; } = string.Empty;
    public string? Categorie { get; init; }
    public int VeilingNr { get; init; }
    public int Kwekernr { get; init; }
    public DateOnly BeginDatum { get; init; }
    public bool Status { get; init; }
    public string ImagePath { get; init; } = string.Empty;
    public IEnumerable<VeilingproductBidListItem> Biedingen { get; init; } = new List<VeilingproductBidListItem>();
}
