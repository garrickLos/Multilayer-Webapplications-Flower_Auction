// using Microsoft.AspNetCore.Http.HttpResults;
// using Microsoft.EntityFrameworkCore;
// using mvc_api.Data;
// using mvc_api.Models;

// namespace mvc_api.Repo.BiedingRepo;

// interface IBiedingRepo
// {
//     public Task<Bieding?> GetBieding(int? gebruikerNr); 
// }

// // Implementeer de interface die we eerder ontworpen hebben
// class BiedingRepository : IBiedingRepo
// {
//     private readonly AppDbContext _db;
//     private readonly CancellationToken _ct;

//     public BiedingRepository(AppDbContext db, CancellationToken ct)
//     {
//         _db = db;
//         _ct = ct;
//     }

//     public async Task<Bieding?> GetBieding(int? gebruikerNr)
//     {
//         var query = await _db.Biedingen.AsNoTracking().AsQueryable();

//         if (gebruikerNr.HasValue)
//             query = query.Where(b => b.GebruikerNr == gebruikerNr.Value);

//         if (veilingProductNr.HasValue)
//             query = query.Where(b => b.VeilingproductNr == veilingProductNr.Value);

//         var items = await query
//             .Select(b => new klantBiedingGet_dto(
//                 b.VeilingproductNr,
//                 b.BedragPerFust,
//                 b.AantalStuks,
//                 b.GebruikerNr
//             ))
//             .ToListAsync(_ct);

//         return items;
//     }

//     public async Task<Veilingproduct?> GetVeilingProduct(int veilingProductNr)
//     {
//         return await _db.Veilingproducten
//             .AsNoTracking()
//             .Include(vp => vp.Veiling)
//             .FirstOrDefaultAsync(vp => vp.VeilingProductNr == veilingProductNr);
//     }

//     public Bieding AddBieding(Bieding entity)
//     {
//         _db.Biedingen.Add(entity);
//         return entity;
//     }

//     public async Task SaveChanges(CancellationToken ct)
//     {
//         await _db.SaveChangesAsync(ct);
//     }
// }