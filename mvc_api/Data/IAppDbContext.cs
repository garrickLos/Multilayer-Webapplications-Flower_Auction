using Microsoft.EntityFrameworkCore;
using mvc_api.Models;

namespace mvc_api.Data;

/// <summary>
/// Abstraction over the EF Core context so controllers and services can be tested
/// with in-memory implementations or mocks without depending on the echte database.
/// </summary>
public interface IAppDbContext
{
    DbSet<Gebruiker> Gebruikers { get; }
    DbSet<Bieding> Biedingen { get; }
    DbSet<Veilingproduct> Veilingproducten { get; }
    DbSet<Categorie> Categorieen { get; }
    DbSet<Veiling> Veilingen { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
