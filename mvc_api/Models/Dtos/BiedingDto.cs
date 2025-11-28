using System.ComponentModel.DataAnnotations;

// Bieding CRUD

public abstract record BaseBieding_Dto
{

    [Range(typeof(int), "1", "9999999")] 
    public int BedragPerFust { get; set; }
    
    [Range(1, int.MaxValue)] 
    public int AantalStuks { get; set; }
    
    [Range(1, int.MaxValue)] 
    public int GebruikerNr { get; set; }
}

public record VeilingMeester_BiedingDto : BaseBieding_Dto
{
    public int BiedingNr { get; set; }

    [Range(1, int.MaxValue)]
    [Required] 
    public int VeilingNr { get; set; }
    
    [Required]
    public int VeilingProductNr { get; set; }
}

public record BiedingCreateDto : BaseBieding_Dto
{
    public int BiedingNr { get; set; }
    
    public int VeilingNr { get; set; } 
    public int VeilingproductNr { get; set; }
}

public record BiedingUpdateDto : BaseBieding_Dto;

// public record BiedingUpdateDto(
//     [Range(typeof(int), "1", "9999999")] int BedragPerFust,
//     [Range(1, int.MaxValue)] int AantalStuks
// );