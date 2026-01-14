using System.ComponentModel.DataAnnotations;
using mvc_api.Models.Dtos;

//basis gegevens
public abstract record BaseVeiling_Dto {

    [Required]
    [StringLength(100)]
    public string? VeilingNaam { get; set; }
    
    [Required] 
    public DateTime Begintijd { get; set; }
    
    [Required] 
    public DateTime Eindtijd { get; set; }
    
}

//gegevens die gebruikers kunnen zien die niet ingelogd zijn
public record Anonymous_VeilingDto : BaseVeiling_Dto
{
    public int VeilingNr { get; set; }

    [StringLength(20)]
    public string? Status { get; set; }

    public IEnumerable<VeilingproductPublicListDto>? Producten { get; init; } = Enumerable.Empty<VeilingproductPublicListDto>();
}

//gegevens die een gebruiker mag krijgen/sturen
public record Klant_VeilingDto : BaseVeiling_Dto
{
    public int VeilingNr { get; set; }

    [StringLength(20)]
    public string? Status { get; set; }

    public DateTime? GeupdateBeginTijd { get; set; }

    public IEnumerable<VeilingproductKwekerListDto>? Producten { get; init; } = Enumerable.Empty<VeilingproductKwekerListDto>();
}

public record VeilingCreateDto : BaseVeiling_Dto
{

    [StringLength(20)] 
    public string? Status { get; set; }
}

public record VeilingUpdateDto : BaseVeiling_Dto
{
    [StringLength(20)] 
    public string? Status { get; set; }
}

public record VeilingUpdate_UpdateVeilingTijd
{   
    [Required]
    public DateTime? GeupdateBeginTijd { get; set; }
}

public record VeilingMeester_VeilingDto : BaseVeiling_Dto
{
    [StringLength(20)] 
    public string? Status { get; set; }
    public int VeilingNr { get; init; }
    public IEnumerable<VeilingproductVeilingmeesterListDto> Producten { get; init; } = Enumerable.Empty<VeilingproductVeilingmeesterListDto>();
    public IEnumerable<VeilingMeester_BiedingDto> Biedingen { get; init; } = Enumerable.Empty<VeilingMeester_BiedingDto>();
}