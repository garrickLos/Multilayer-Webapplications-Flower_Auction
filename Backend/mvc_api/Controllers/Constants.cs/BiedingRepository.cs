// using mvc_api.Data;
// using mvc_api.Models;
// using Microsoft.EntityFrameworkCore;

// namespace Controller.Repository;

// interface IBiedingRepo
// {
//     Task <Gebruiker?> GetGebruiker(int gebruikerNr);

//     Task <Veilingproduct?> GetVeilingProduct(int VeilingProductNr);

//     Bieding AddBieding(Bieding entity);

//     Task SaveChanges(CancellationToken ct);
// }

// class BiedingRepository : IBiedingRepo
// {
//     BiedingCreateDto dto;
//     CancellationToken ct = default;

//     AppDbContext dbContext {get; set;}

//     public BiedingRepository(AppDbContext dbContext)
//     {
//         this.dbContext = dbContext;
//     }

//     public async Task<Gebruiker?> GetGebruiker(int gebruikerNr)
//     {
//         var gebruikerBestaat = await dbContext.Gebruikers
//                                     .AsNoTracking()
//                                     .AnyAsync(g => g.GebruikerNr == dto.GebruikerNr, ct);

//         return gebruikerBestaat();
//     }

//     public async Task<Veilingproduct?> GetVeilingproduct(int veilingproductNr)
//     {
//         var veilingproduct = await dbContext.Veilingproducten
//             .Include(vp => vp.Veiling)
//             .FirstOrDefaultAsync(vp => vp.VeilingProductNr == dto.VeilingproductNr, ct);

//         return veilingproduct;
//     }
// }