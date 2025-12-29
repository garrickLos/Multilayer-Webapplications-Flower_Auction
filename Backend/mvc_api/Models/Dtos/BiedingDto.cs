using System.ComponentModel.DataAnnotations;

// Bieding CRUD

public abstract record BaseBieding_Dto
{
    [Range(1, int.MaxValue)]
    public int BedragPerFust { get; set; }
    
    [Range(1, int.MaxValue)] 
    public int AantalStuks { get; set; }
    
    [Range(1, int.MaxValue)] 
    public int GebruikerNr { get; set; }
}

public record VeilingMeester_BiedingDto : BaseBieding_Dto
{
    public int BiedingNr { get; set; }

    public int? VeilingNr { get; set; }
    
    [Required]
    public int VeilingProductNr { get; set; }
}

public record BiedingCreateDto : BaseBieding_Dto
{
    public int? BiedingNr { get; set; }
    
    public int VeilingproductNr { get; set; }
}

public sealed record klantBiedingGet_dto
(
    int VeilingProductNr,
    int BedragPerFust,
    int AantalStuks,
    int GebruikerNr
);

public record BiedingUpdateDto : BaseBieding_Dto;

public record KlantBiedingGet_dto : BaseBieding_Dto
{
    public int VeilingProductNr { get; set; }
}
