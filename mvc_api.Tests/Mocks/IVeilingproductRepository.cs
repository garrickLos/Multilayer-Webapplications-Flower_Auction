using mvc_api.Models;

namespace mvc_api.Tests.Mocks;

public interface IVeilingproductRepository
{
    Task<Veilingproduct?> FindAsync(int id, CancellationToken ct = default);
    Task SaveAsync(Veilingproduct product, CancellationToken ct = default);
}
