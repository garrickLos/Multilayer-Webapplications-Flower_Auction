using System;
using mvc_api.Models;
using mvc_api.Models.Dtos;

namespace mvc_api.Controllers;

public static class VeilingStatus
{
    /// <summary>Veiling is bezig (starttijd is geweest en eindtijd nog niet).</summary>
    public const string Active = "active";

    /// <summary>Veiling is nog niet gestart.</summary>
    public const string Inactive = "inactive";

    /// <summary>Alle producten zijn uit voorraad (niets meer te kopen/bieden).</summary>
    public const string SoldOut = "uitverkocht";

    /// <summary>De eindtijd is voorbij, veiling is afgesloten.</summary>
    public const string Closed = "afgesloten";

    /// <summary>Veiling is geannuleerd.</summary>
    public const string Cancelled = "geannuleerd";
}

// Dit zijn DTO projecties voor verschillende gebruikersrollen:
// - anonymous: standaard / niet ingelogd
// - klant: ingelogde klant (iets meer info)
// - veilingmeester: uitgebreid (incl. biedingen)
public class ProjectieVeilingController
{
    /// <summary>
    /// Projecteert veilingen naar een DTO voor niet-ingelogde gebruikers.
    /// Bepaalt ook de status op basis van database status + voorraad + begin/eindtijd.
    /// </summary>
    /// <param name="query">De query met veilingen.</param>
    /// <param name="now">Huidige tijd om status (actief/inactief/afgesloten) te berekenen.</param>
    /// <returns>Een query met Anonymous_VeilingDto resultaten.</returns>
    public IQueryable<Anonymous_VeilingDto> ProjectToVeiling_anonymousDto(
        IQueryable<Veiling> query, DateTime now)
    {
        return query.Select(v => new Anonymous_VeilingDto
        {
            VeilingNr = v.VeilingNr,
            VeilingNaam = v.VeilingNaam,
            Begintijd = v.Begintijd,
            Eindtijd = v.Eindtijd,

            // Status volgorde:
            // 1) Cancelled (altijd prioriteit)
            // 2) SoldOut (alle producten voorraad <= 0)
            // 3) Closed (eindtijd voorbij)
            // 4) Active (begintijd voorbij, eindtijd nog niet)
            // 5) Inactive (nog niet gestart)
            Status = string.Equals(v.Status, VeilingStatus.Cancelled, StringComparison.OrdinalIgnoreCase)
                ? VeilingStatus.Cancelled
                : (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                    ? VeilingStatus.SoldOut
                    : (v.Eindtijd <= now
                        ? VeilingStatus.Closed
                        : (v.Begintijd <= now
                            ? VeilingStatus.Active
                            : VeilingStatus.Inactive)),

            // Publieke productlijst (beperkte velden)
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

    /// <summary>
    /// Projecteert veilingen naar een DTO voor klanten (ingelogd).
    /// Bevat extra product/voorraad informatie t.o.v. anonymous.
    /// </summary>
    /// <param name="query">De query met veilingen.</param>
    /// <param name="now">Huidige tijd om status te berekenen.</param>
    /// <returns>Een query met Klant_VeilingDto resultaten.</returns>
    public IQueryable<Klant_VeilingDto> ProjectToVeiling_klantDto(
        IQueryable<Veiling> query, DateTime now)
    {
        return query.Select(v => new Klant_VeilingDto
        {
            VeilingNr = v.VeilingNr,
            VeilingNaam = v.VeilingNaam,
            Begintijd = v.Begintijd,
            GeupdateBeginTijd = v.GeupdateBeginTijd == null ? null : v.GeupdateBeginTijd,
            Eindtijd = v.Eindtijd,

            // Zelfde statuslogica als anonymous
            Status = string.Equals(v.Status, VeilingStatus.Cancelled, StringComparison.OrdinalIgnoreCase)
                ? VeilingStatus.Cancelled
                : (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                    ? VeilingStatus.SoldOut
                    : (v.Eindtijd <= now
                        ? VeilingStatus.Closed
                        : (v.Begintijd <= now
                            ? VeilingStatus.Active
                            : VeilingStatus.Inactive)),

            // Productlijst met meer details (o.a. voorraad, categorie, minimumprijs)
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

    /// <summary>
    /// Projecteert veilingen naar een DTO voor veilingmeesters.
    /// Bevat uitgebreide productinfo én een lijst met alle biedingen binnen de veiling.
    /// </summary>
    /// <param name="query">De query met veilingen.</param>
    /// <param name="now">Huidige tijd om status te berekenen.</param>
    /// <returns>Een query met VeilingMeester_VeilingDto resultaten.</returns>
    public IQueryable<VeilingMeester_VeilingDto> ProjectToVeiling_VeilingMeesterDto(
        IQueryable<Veiling> query, DateTime now)
    {
        return query.Select(v => new VeilingMeester_VeilingDto
        {
            VeilingNr = v.VeilingNr,
            VeilingNaam = v.VeilingNaam,
            Begintijd = v.Begintijd,
            Eindtijd = v.Eindtijd,

            // Zelfde statuslogica als de andere projecties
            Status = string.Equals(v.Status, VeilingStatus.Cancelled, StringComparison.OrdinalIgnoreCase)
                ? VeilingStatus.Cancelled
                : (v.Veilingproducten.Any() && v.Veilingproducten.All(p => p.VoorraadBloemen <= 0))
                    ? VeilingStatus.SoldOut
                    : (v.Eindtijd <= now
                        ? VeilingStatus.Closed
                        : (v.Begintijd <= now
                            ? VeilingStatus.Active
                            : VeilingStatus.Inactive)),

            // Producten voor veilingmeester (uitgebreid) en direct als List
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

            // Alle biedingen over alle producten in de veiling (flatten via SelectMany)
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
