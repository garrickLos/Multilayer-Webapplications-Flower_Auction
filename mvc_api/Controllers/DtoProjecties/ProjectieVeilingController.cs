using mvc_api.Models;

namespace mvc_api.Controllers;

public static class VeilingStatus
{
    public const string Active = "active";
    public const string Inactive = "inactive";
    public const string Sold = "sold";
}

// dit zijn de Dto projecties die worden opgehaald voor de data die nodig is. 
// de ProjectToReadDto is voor de standaard en niet ingelogde gebruiker
// de projectToMeesterDto is voor het ophalen van meerdere gegevens voor de veilingsMeester
public class ProjectieVeilingController
{
    public IQueryable<Anonymous_VeilingDto> ProjectToVeiling_anonymousDto(
        IQueryable<Veiling> query, DateTime now)
    {
        return query.Select(v => new Anonymous_VeilingDto
        {
            VeilingNr = v.VeilingNr,
            VeilingNaam = v.VeilingNaam,
            Begintijd = v.Begintijd,
            Eindtijd = v.Eindtijd,

            Status = (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                ? VeilingStatus.Sold
                : (v.Eindtijd <= now 
                    ? VeilingStatus.Inactive 
                    : (v.Begintijd <= now 
                        ? VeilingStatus.Active
                        : VeilingStatus.Inactive)),
            
            Producten = v.Veilingproducten.Select(p => new VeilingProductDto_anonymous(
                p.VeilingProductNr,
                p.Naam,
                p.Startprijs,
                p.VoorraadBloemen,
                p.ImagePath
            ))
        });
    }

    // Projectie voor Gasten
    public IQueryable<Klant_VeilingDto> ProjectToVeiling_klantDto(
        IQueryable<Veiling> query, DateTime now)
    {
        return query.Select(v => new Klant_VeilingDto
        {
            VeilingNr = v.VeilingNr,
            VeilingNaam = v.VeilingNaam,
            Begintijd = v.Begintijd,
            Eindtijd = v.Eindtijd,

            Status = (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                ? VeilingStatus.Sold
                : (v.Eindtijd <= now 
                    ? VeilingStatus.Inactive 
                    : (v.Begintijd <= now 
                        ? VeilingStatus.Active
                        : VeilingStatus.Inactive)),
            
            Producten = v.Veilingproducten.Select(p => new VeilingProductDto(
                p.VeilingProductNr,
                p.Naam,
                p.Startprijs,
                p.Minimumprijs,
                p.Plaats,
                p.CategorieNr,
                p.VoorraadBloemen,
                p.AantalFusten,
                p.ImagePath
            ))
        });
    }

    // Projectie voor Veilingmeesters
    public IQueryable<VeilingMeester_VeilingDto> ProjectToVeiling_VeilingMeesterDto(
        IQueryable<Veiling> query, DateTime now)
    {
        return query.Select(v => new VeilingMeester_VeilingDto
        {
            VeilingNr       = v.VeilingNr,
            VeilingNaam     = v.VeilingNaam,
            Begintijd       = v.Begintijd,
            Eindtijd        = v.Eindtijd,

            Status = (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                ? VeilingStatus.Sold
                : (v.Eindtijd <= now 
                    ? VeilingStatus.Inactive
                    : (v.Begintijd <= now 
                        ? VeilingStatus.Active
                        : VeilingStatus.Inactive)),

            Producten = v.Veilingproducten.Select(p => new VeilingProductDto(
                p.VeilingProductNr,
                p.Naam,
                p.Startprijs,
                p.Minimumprijs,
                p.Plaats,
                p.CategorieNr,
                p.VoorraadBloemen,
                p.AantalFusten,
                p.ImagePath
            )).ToList(),

            Biedingen = v.Biedingen.Select(b => new VeilingMeester_BiedingDto
            {
                // Eigen properties van VeilingMeester_BiedingDto
                BiedingNr = b.BiedNr,
                VeilingNr = b.VeilingNr, // Of v.VeilingNr, afhankelijk van je database relatie
                VeilingProductNr = b.VeilingproductNr,

                // Properties geërfd van BaseBieding_Dto
                AantalStuks = b.AantalStuks,
                GebruikerNr = b.GebruikerNr,
                BedragPerFust = b.BedragPerFust
            }).ToList(),
        });
    }
}