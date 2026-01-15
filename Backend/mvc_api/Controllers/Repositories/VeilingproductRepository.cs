using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using mvc_api.Models;
using mvc_api.Models.Dtos;

namespace mvc_api.Data;

public class VeilingproductRepository : IVeilingproductRepository
{
    private readonly AppDbContext _db;

    public VeilingproductRepository(AppDbContext db) => _db = db;

    public async Task<Veilingproduct?> FindAsync(int veilingproductNr, CancellationToken ct) =>
        await _db.Veilingproducten.FindAsync(new object[] { veilingproductNr }, ct);

    public async Task<Veiling?> GetVeilingAsync(int veilingNr, CancellationToken ct) =>
        await _db.Veiling.FindAsync(new object[] { veilingNr }, ct);

    public Task<bool> CategorieExistsAsync(int categorieNr, CancellationToken ct) =>
        _db.Categorieen.AnyAsync(c => c.CategorieNr == categorieNr, ct);
    
    public void Add(Veilingproduct entity) => _db.Veilingproducten.Add(entity);

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);

    /// <summary>
    /// haalt veilingproducten op voor klanten met optionele filtermogelijkheden
    /// de resultaten worden gesorteerd op naam en paginagegeven teruggegeven
    /// </summary>
    /// <param name="q">optionele zoekterm om veilngproducten te filteren</param>
    /// <param name="categorieNr">optionele categorienummer om op te filterer</param>
    /// <param name="page">paginanummer dat opgehaald moet worden</param>
    /// <param name="pageSize">aantal resultaten per pagina</param>
    /// <param name="ct">cancelation token</param>
    /// <returns>veilingproducten voor de opgegeven pagina, inclusief totaal aantal resultaten</returns>
    public async Task<PagedResult<klantVeilingproductGet_dto>> GetKlantAsync(
        string? q,
        int? categorieNr,
        int page,
        int pageSize,
        CancellationToken ct)
    {
        NormalizePaging(ref page, ref pageSize);

        //roept de functie applyfilters op en ordend het op veilingproduct naam
        var query = ApplySearchFilters(QueryWithCategorie(), null, q, categorieNr)
            .OrderBy(vp => vp.Naam);
        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new klantVeilingproductGet_dto(
                v.VeilingProductNr,
                v.Naam,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.ImagePath,
                v.Plaats))
            .ToListAsync(ct);

        return new PagedResult<klantVeilingproductGet_dto>(items, total, page, pageSize);
    }

    /// <summary>
    /// haalt veilingproducten op voor kwekers aan de hand van een meegegeven nummer (kwekernummer).  met optionele filtermogelijkheden
    /// optioneel kunnen de resultaten nog worden gesorteerd op naam en paginagegeven teruggegeven
    /// </summary>
    /// <param name="Nummer">kwekernummer die meegegeven wordt om informatie van specifieke producten te filteren</param>
    /// <param name="q">Optionele zoekterm om veilngproducten te filteren</param>
    /// <param name="categorieNr">optionele categorienummer om op te filterer</param>
    /// <param name="page">paginanummer dat opgehaald moet worden</param>
    /// <param name="pageSize">aantal resultaten per pagina</param>
    /// <param name="ct">cancelation token</param>
    /// <returns>veilingproducten van een specifieke kweker voor de opgegeven pagina, inclusief totaal aantal resultaten</returns>
    public async Task<PagedResult<kwekerVeilingproductGet_dto>> GetKwekerAsync(
        int Nummer,
        string? q,
        int? categorieNr,
        int page,
        int pageSize,
        CancellationToken ct)
    {
        NormalizePaging(ref page, ref pageSize);

        var query = ApplySearchFilters(QueryWithCategorie(), null, q, categorieNr)
            .OrderBy(vp => vp.Naam);
        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new kwekerVeilingproductGet_dto(
                v.VeilingProductNr,
                v.Naam,
                v.GeplaatstDatum,
                v.AantalFusten,
                v.VoorraadBloemen,
                v.Categorie == null ? null : v.Categorie.Naam,
                v.ImagePath,
                v.Plaats))
            .ToListAsync(ct);

        return new PagedResult<kwekerVeilingproductGet_dto>(items, total, page, pageSize);
    }


    /// <summary>
    /// haalt een lijst van producten op voor de veilingmeester met verschilllende filters
    /// </summary>
    /// <param name="q"> optionele zoekter om te filteren op naam</param>
    /// <param name="categorieNr">optionele meegegeven categorienummer</param>
    /// <param name="status">optionele meegegeven status</param>
    /// <param name="minPrice">optionele meegeveven minimumprijs</param>
    /// <param name="maxPrice">optionele meegegeven maximumprijs</param>
    /// <param name="createdAfter">optionele meegegeven datum om te filteren op producten die geplaatst zijn na deze datum</param>
    /// <param name="title">optionele naam van veilingproducten</param>
    /// <param name="ct">cancelation token</param>
    /// <returns>een lijst van VeilingproductVeilingmeesterListDto die voldoen aan de opgegeven filtercriteria</returns>
    public async Task<IReadOnlyList<VeilingproductVeilingmeesterListDto>> GetForVeilingmeesterAsync(
        string? q,
        int? categorieNr,
        ModelStatus? status,
        int? minPrice,
        int? maxPrice,
        DateTime? createdAfter,
        string? title,
        CancellationToken ct)
    {
        var query = BuildFilteredQuery(
            q,
            categorieNr,
            status,
            minPrice,
            maxPrice,
            createdAfter,
            title);

        return await query
            .Select(VeilingproductDtoSelectors.VeilingmeesterList)
            .ToListAsync(ct);
    }

    /// <summary>
    /// deze functie zoekt een specifieke veilingproduct op die gelijk is aan de meegegeven veilingproductnummer
    /// en met een kwekernummer als die meegegeven is
    /// </summary>
    /// <param name="veilingproductNr">meegegeven veilingproductnummer</param>
    /// <param name="kwekerNr">optionele meegegeven kwekernummer</param>
    /// <param name="ct">cancelationtoken</param>
    /// <returns>geeft de resultaten terug als dto</returns>
    public async Task<VeilingproductKwekerListDto> GetKwekerListByIdAsync(
        int veilingproductNr,
        int? kwekerNr,
        CancellationToken ct)
    {
        var query = QueryWithCategorie().Where(v => v.VeilingProductNr == veilingproductNr);

        //filtert op kwekernummer als kwekernummer een waarde heeft
        if (kwekerNr.HasValue)
            query = query.Where(v => v.Kwekernr == kwekerNr.Value);

        return await query
            .Select(VeilingproductDtoSelectors.KwekerList)
            .SingleAsync(ct);
    }

    /// <summary>
    /// deze functie zoekt het veilingproduct dat exact overeenkomt met de meegegeven veilingproductnummer
    /// </summary>
    /// <param name="veilingproductNr">meegegeven veilinproductnummer</param>
    /// <param name="ct">cancelation token</param>
    /// <returns>dto van een specifieke veilingproductnummer</returns>
    public Task<VeilingproductVeilingmeesterListDto> GetVeilingmeesterListByIdAsync(
        int veilingproductNr,
        CancellationToken ct)
        => QueryWithCategorie()
            .Where(v => v.VeilingProductNr == veilingproductNr)
            .Select(VeilingproductDtoSelectors.VeilingmeesterList)
            .SingleAsync(ct);

    private IQueryable<Veilingproduct> QueryWithCategorie() =>
        _db.Veilingproducten;

    /// <summary>
    /// deze functie past filters toe aan de hand van de meegegeven waarden
    /// </summary>
    /// <param name="query">meegegeven IQueryable query</param>
    /// <param name="Nummer">optionele meegegeven kwekernummer</param>
    /// <param name="q">optionele meegegeven productnaam</param>
    /// <param name="categorieNr">optionele meegegeven categorienummer</param>
    /// <returns>gefilterde query</returns>
    private static IQueryable<Veilingproduct> ApplySearchFilters(
        IQueryable<Veilingproduct> query,
        int? Nummer,
        string? q,
        int? categorieNr)
    {
        //als Nummer een waarde heeft en die groter is dan 0
        //wordt er gefilterd op kwekernummer
        if (Nummer.HasValue && Nummer.Value > 0)
        {
            query = query.Where(vp => vp.Kwekernr == Nummer);
        }

        //als q niet leeg, null of leeg met spaties is
        //dan wordt er gefilterd op naam
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(vp => vp.Naam.Contains(term));
        }

        //als categorienummer niet null is, wordt er daarop gefilterd
        if (categorieNr is int cnr)
            query = query.Where(vp => vp.CategorieNr == cnr);

        return query;
    }


    /// <summary>
    /// bouwt een query voor veilingproducten met optionele filters. Die resultaten worden gesorteerd op naam
    /// </summary>
    /// <param name="q">Optionele zoekterm om veilingproducten op naam te filteren</param>
    /// <param name="categorieNr">optionele meegegeven categorienummer voor het filteren</param>
    /// <param name="status">optionele status om mee te filteren</param>
    /// <param name="minPrice">meegegeven minimumprijs</param>
    /// <param name="maxPrice">meegegeven maximumprijs</param>
    /// <param name="createdAfter">optionele datum om alleen producten te tonen die na deze datum zijn geplaatst</param>
    /// <param name="title">optionele filter op de naam van het product</param>
    /// <returns>geordende query op naam</returns>
    private IQueryable<Veilingproduct> BuildFilteredQuery(
        string? q,
        int? categorieNr,
        ModelStatus? status,
        int? minPrice,
        int? maxPrice,
        DateTime? createdAfter,
        string? title)
    {
        var query = QueryWithCategorie();

        //filtert op naam als q niet null, leeg of leeg met spaties is
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(v => v.Naam.Contains(term));
        }
        //filtert op categorienummer als het er is
        if (categorieNr is int cnr)
            query = query.Where(v => v.CategorieNr == cnr);

        //filtert op status
        if (status is ModelStatus st)
            query = query.Where(v => v.Status == st);

        //filtert producten waarvan de startprijs of, als die null is, de minimumprijs gelijk aan of hoger is 
        //dan min als minPrice niet null is 
        if (minPrice is int min)
            query = query.Where(v => (v.Startprijs ?? v.Minimumprijs) >= min);

        //filtert producten waarvan de startprijs of minimumprijs kleiner is dan of gelijk aan max
        //als maxPrice niet null is
        if (maxPrice is int max)
            query = query.Where(v => (v.Startprijs ?? v.Minimumprijs) <= max);

        //als createdAfter niet null is dan wordt er gefilterd op producten
        //waarvan de GeplaatstDatum gelijk aan of na de opgegeven datum is
        if (createdAfter is DateTime ca)
            query = query.Where(v => v.GeplaatstDatum >= ca);

        //als title niet null, leeg of leeg met spaties is dan wordt er gefiltert op naam
        if (!string.IsNullOrWhiteSpace(title))
            query = query.Where(v => v.Naam.Contains(title));

        return query.OrderBy(v => v.Naam);
    }

    /// <summary>
    /// normaliseert waarden voor paginering zodat ze binnen geldige grenzen vallen.
    /// page moet minimaal 1 zijn en pagesize tussen de 1 en 200 
    /// </summary>
    /// <param name="page">het pagina nummer dat wordt gecorigeerd</param>
    /// <param name="pageSize">het aantal items per pagina</param>
    private static void NormalizePaging(ref int page, ref int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);
    }
}
