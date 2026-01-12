using Microsoft.AspNetCore.Mvc.Razor;
using mvc_api.Models;

// dit zijn de Dto projecties die worden opgehaald voor de data die nodig is. 
// de projectToMeesterDto is voor het ophalen van meerdere gegevens voor de veilingsMeester
public static class BiedingExtensions
{
    // projectie voor KlantBiedingGet
    public static IQueryable<klantBiedingGet_dto> ProjectieToBieding_Klant(
        this IQueryable<Bieding> query)
    {
        return query.Select(b => new klantBiedingGet_dto
        {
            VeilingProductNr    = b.VeilingproductNr,
            BedragPerFust       = b.BedragPerFust,
            AantalStuks         =  b.AantalStuks,
            GebruikerNr         = b.GebruikerNr
        });
    }

    // Projectie voor Veilingmeesters
    public static IQueryable<VeilingMeester_BiedingDto> ProjectToBieding_VeilingMeester(
        this IQueryable<Bieding> query)
    {
        return query.Select(b => new VeilingMeester_BiedingDto
        {   // Eigen properties van VeilingMeester_BiedingDto
            BiedingNr = b.BiedNr,
            VeilingNr = b.Veilingproduct!.VeilingNr,
            VeilingProductNr = b.VeilingproductNr,

            // Properties geërfd van BaseBieding_Dto
            BedragPerFust = b.BedragPerFust,
            AantalStuks = b.AantalStuks,
            GebruikerNr = b.GebruikerNr,
        });
    }
}