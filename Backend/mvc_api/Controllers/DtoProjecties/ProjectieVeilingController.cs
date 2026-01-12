using System;
using mvc_api.Models;
using mvc_api.Models.Dtos;

namespace mvc_api.Controllers;

public static class VeilingStatus
{
    public const string Active = "active";
    public const string Inactive = "inactive";
    public const string SoldOut = "uitverkocht";
    public const string Closed = "afgesloten";
    public const string Cancelled = "geannuleerd";
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

            Status = string.Equals(v.Status, VeilingStatus.Cancelled, StringComparison.OrdinalIgnoreCase)
                ? VeilingStatus.Cancelled
                : (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                    ? VeilingStatus.SoldOut
                    : (v.Eindtijd <= now 
                        ? VeilingStatus.Closed 
                        : (v.Begintijd <= now 
                            ? VeilingStatus.Active
                            : VeilingStatus.Inactive)),
            
            Producten = v.Veilingproducten.Select(p => new VeilingproductPublicListDto(
                p.VeilingProductNr,
                p.Naam,
                p.ImagePath,
                p.AantalFusten,
                p.VeilingNr,
                p.Startprijs,
                p.Kwekernr
            ))
        });
    }

    // Projectie voor Gasten
    public IQueryable<Klant_VeilingDto> ProjectToVeiling_klantDto(
        IQueryable<Veiling> query, DateTime now)
    {
        return query.Select(v => new Klant_VeilingDto
        {
            VeilingNr           = v.VeilingNr,
            VeilingNaam         = v.VeilingNaam,
            Begintijd           = v.Begintijd,
            GeupdateBeginTijd   = v.GeupdateBeginTijd == null ? null: v.GeupdateBeginTijd,
            Eindtijd            = v.Eindtijd,

            Status = string.Equals(v.Status, VeilingStatus.Cancelled, StringComparison.OrdinalIgnoreCase)
                ? VeilingStatus.Cancelled
                : (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                    ? VeilingStatus.SoldOut
                    : (v.Eindtijd <= now 
                        ? VeilingStatus.Closed 
                        : (v.Begintijd <= now 
                            ? VeilingStatus.Active
                            : VeilingStatus.Inactive)),
            
            Producten = v.Veilingproducten.Select(p => new VeilingproductKwekerListDto(
                p.VeilingProductNr,
                p.Naam,
                p.GeplaatstDatum,
                p.AantalFusten,
                p.VoorraadBloemen,
                p.Categorie == null ? null : p.Categorie.Naam,
                p.CategorieNr,
                p.ImagePath,
                p.Plaats,
                p.Startprijs,
                p.Minimumprijs,
                p.VeilingNr,
                p.Kwekernr
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

            Status = string.Equals(v.Status, VeilingStatus.Cancelled, StringComparison.OrdinalIgnoreCase)
                ? VeilingStatus.Cancelled
                : (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                    ? VeilingStatus.SoldOut
                    : (v.Eindtijd <= now 
                        ? VeilingStatus.Closed
                        : (v.Begintijd <= now 
                            ? VeilingStatus.Active
                            : VeilingStatus.Inactive)),

            Producten = v.Veilingproducten.Select(p => new VeilingproductVeilingmeesterListDto(
                p.VeilingProductNr,
                p.Naam,
                p.Categorie == null ? null : p.Categorie.Naam,
                p.Status,
                p.VeilingNr,
                p.Kwekernr,
                p.AantalFusten,
                p.VoorraadBloemen,
                p.Plaats,
                p.Minimumprijs,
                p.Startprijs,
                p.GeplaatstDatum,
                p.ImagePath,
                p.BeginDatum
            )).ToList(),
            
            Biedingen = v.Veilingproducten
                .SelectMany(p => p.Biedingen)
                .Select(b => new VeilingMeester_BiedingDto
                {
                    BiedingNr = b.BiedNr,
                    VeilingNr = b.Veilingproduct!.VeilingNr,
                    VeilingProductNr = b.VeilingproductNr,
                    AantalStuks = b.AantalStuks,
                    GebruikerNr = b.GebruikerNr,
                    BedragPerFust = b.BedragPerFust
                }).ToList(),
        });
    }
}