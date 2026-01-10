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

    public async Task<PagedResult<klantVeilingproductGet_dto>> GetKlantAsync(
        //int? vpNummer,
        string? q,
        int? categorieNr,
        int page,
        int pageSize,
        CancellationToken ct)
    {
        NormalizePaging(ref page, ref pageSize);

        var query = ApplySearchFilters(QueryWithCategorie(), null, q, categorieNr).OrderBy(vp => vp.Naam);
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

    public async Task<PagedResult<kwekerVeilingproductGet_dto>> GetKwekerAsync(
        int Nummer,
        string? q,
        int? categorieNr,
        int page,
        int pageSize,
        CancellationToken ct)
    {
        NormalizePaging(ref page, ref pageSize);

        var query = ApplySearchFilters(QueryWithCategorie(), Nummer,  q, categorieNr).OrderBy(vp => vp.Naam);
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

    public async Task<VeilingproductKwekerListDto> GetKwekerListByIdAsync(
        int veilingproductNr,
        int? kwekerNr,
        CancellationToken ct)
    {
        var query = QueryWithCategorie().Where(v => v.VeilingProductNr == veilingproductNr);

        if (kwekerNr.HasValue)
            query = query.Where(v => v.Kwekernr == kwekerNr.Value);

        return await query
            .Select(VeilingproductDtoSelectors.KwekerList)
            .SingleAsync(ct);
    }

    public Task<VeilingproductVeilingmeesterListDto> GetVeilingmeesterListByIdAsync(
        int veilingproductNr,
        CancellationToken ct)
        => QueryWithCategorie()
            .Where(v => v.VeilingProductNr == veilingproductNr)
            .Select(VeilingproductDtoSelectors.VeilingmeesterList)
            .SingleAsync(ct);

    private IQueryable<Veilingproduct> QueryWithCategorie() =>
        _db.Veilingproducten;

    private static IQueryable<Veilingproduct> ApplySearchFilters(
        IQueryable<Veilingproduct> query,
        int? Nummer,
        //int? vpNummer,
        string? q,
        int? categorieNr)
    {
        if (Nummer.HasValue)
        {
            query = query.Where(vp => vp.Kwekernr == Nummer);
        }

        // if (vpNummer.HasValue)
        // {
        //     query = query.Where(vp => vp.VeilingProductNr == vpNummer);
        // }
        
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(vp => vp.Naam.Contains(term));
        }

        if (categorieNr is int cnr)
            query = query.Where(vp => vp.CategorieNr == cnr);

        return query;
    }
    


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

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(v => v.Naam.Contains(term));
        }

        if (categorieNr is int cnr)
            query = query.Where(v => v.CategorieNr == cnr);

        if (status is ModelStatus st)
            query = query.Where(v => v.Status == st);

        if (minPrice is int min)
            query = query.Where(v => (v.Startprijs ?? v.Minimumprijs) >= min);

        if (maxPrice is int max)
            query = query.Where(v => (v.Startprijs ?? v.Minimumprijs) <= max);

        if (createdAfter is DateTime ca)
            query = query.Where(v => v.GeplaatstDatum >= ca);

        if (!string.IsNullOrWhiteSpace(title))
            query = query.Where(v => v.Naam.Contains(title));

        return query.OrderBy(v => v.Naam);
    }

    private static void NormalizePaging(ref int page, ref int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);
    }
}
