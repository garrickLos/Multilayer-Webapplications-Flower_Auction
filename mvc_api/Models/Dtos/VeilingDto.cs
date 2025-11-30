using System.ComponentModel.DataAnnotations;

// Veiling CRUD
public abstract record BaseVeiling_Dto {

    [Required]
    [StringLength(100)]
    public string VeilingNaam { get; set; }
    
    [Required] 
    public DateTime Begintijd { get; set; }
    
    [Required] 
    public DateTime Eindtijd { get; set; }
    
}

public record Anonymous_VeilingDto : BaseVeiling_Dto
{
    public int VeilingNr { get; set; }
    
    [StringLength(20)] 
    public string Status { get; set; }

    public IEnumerable<VeilingProductDto_anonymous>? Producten { get; init; } = Enumerable.Empty<VeilingProductDto_anonymous>();
}

public record Klant_VeilingDto : BaseVeiling_Dto
{
    public int VeilingNr { get; set; }
    
    [StringLength(20)] 
    public string Status { get; set; }

    public IEnumerable<VeilingProductDto>? Producten { get; init; } = Enumerable.Empty<VeilingProductDto>();
}

public record VeilingCreateDto : BaseVeiling_Dto
{

    [StringLength(20)] 
    public string Status { get; set; }
}

public record VeilingUpdateDto : BaseVeiling_Dto; 

public record VeilingMeester_VeilingDto : BaseVeiling_Dto
{
    [StringLength(20)] 
    public string Status { get; set; }
    public int VeilingNr { get; init; }
    public IEnumerable<VeilingProductDto> Producten { get; init; } = Enumerable.Empty<VeilingProductDto>();
    public IEnumerable<VeilingMeester_BiedingDto> Biedingen { get; init; } = Enumerable.Empty<VeilingMeester_BiedingDto>();
}

/* deze 2 is er om te zorgen dat er zeker een producten en biedingen gekozen zijn die getoond worden
    Mss handig deze te vervangen in de toekomst door een andere abstracte dto van de biedingen en producten zodat we niet teveel dubbel hebben
*/
public record VeilingProductDto(
    int VeilingProductNr,
    string Naam,
    decimal Startprijs,
    decimal Minimumprijs,
    string Plaats,
    int CategorieNr,
    int VoorraadBloemen,
    int AantalFusten,
    string ImagePath
);

public record VeilingProductDto_anonymous(
    int VeilingProductNr,
    string Naam,
    decimal Startprijs,
    int VoorraadBloemen,
    string ImagePath
);