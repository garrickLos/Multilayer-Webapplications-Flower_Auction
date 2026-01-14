using Microsoft.AspNetCore.Mvc.Razor;
using mvc_api.Models;

public static class BiedingExtensions
{
    /// <summary>
    /// Maakt van een biedingen-query een klant DTO.
    /// Bedoeld voor klant-weergave: alleen de basisvelden die de klant nodig heeft.
    /// </summary>
    /// <param name="query">De query met biedingen.</param>
    /// <returns>Een query met klantBiedingGet_dto resultaten.</returns>
    public static IQueryable<klantBiedingGet_dto> ProjectieToBieding_Klant(
        this IQueryable<Bieding> query)
    {
        return query.Select(b => new klantBiedingGet_dto
        {
            VeilingProductNr = b.VeilingproductNr,
            BedragPerFust = b.BedragPerFust,
            AantalStuks = b.AantalStuks,
            GebruikerNr = b.GebruikerNr
        });
    }

    /// <summary>
    /// Maakt van een biedingen-query een veilingmeester DTO.
    /// Bedoeld voor veilingmeester-weergave: bevat extra info zoals VeilingNr,
    /// zodat een bieding aan de juiste veiling en het juiste product gekoppeld kan worden.
    /// </summary>
    /// <param name="query">De query met biedingen.</param>
    /// <returns>Een query met VeilingMeester_BiedingDto resultaten.</returns>
    public static IQueryable<VeilingMeester_BiedingDto> ProjectToBieding_VeilingMeester(
        this IQueryable<Bieding> query)
    {
        return query.Select(b => new VeilingMeester_BiedingDto
        {
            BiedingNr = b.BiedNr,
            VeilingNr = b.Veilingproduct!.VeilingNr,
            VeilingProductNr = b.VeilingproductNr,
            BedragPerFust = b.BedragPerFust,
            AantalStuks = b.AantalStuks,
            GebruikerNr = b.GebruikerNr,
        });
    }
}