using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using mvc_api.Models;
using mvc_api.Models.Dtos;

namespace mvc_api.Data;

/// <summary>
/// Interface voor het beheren en ophalen van veilingproducten in de database.
/// Gebruik deze interface om veilingproduct-gerelateerde data te manipuleren en op te vragen.
/// </summary>
public interface IVeilingproductRepository
{
    Task<Veilingproduct?> FindAsync(int veilingproductNr, CancellationToken ct);
    Task<Veiling?> GetVeilingAsync(int veilingNr, CancellationToken ct);
    Task<bool> CategorieExistsAsync(int categorieNr, CancellationToken ct);
    void Add(Veilingproduct entity);
    Task SaveChangesAsync(CancellationToken ct);
    Task<PagedResult<klantVeilingproductGet_dto>> GetKlantAsync(
        string? q,
        int? categorieNr,
        int page,
        int pageSize,
        CancellationToken ct);
    Task<PagedResult<kwekerVeilingproductGet_dto>> GetKwekerAsync(
        int Nummer,
        string? q,
        int? categorieNr,
        int page,
        int pageSize,
        CancellationToken ct);
        
    Task<IReadOnlyList<VeilingproductVeilingmeesterListDto>> GetForVeilingmeesterAsync(
        string? q,
        int? categorieNr,
        ModelStatus? status,
        int? minPrice,
        int? maxPrice,
        DateTime? createdAfter,
        string? title,
        CancellationToken ct);
    Task<VeilingproductKwekerListDto> GetKwekerListByIdAsync(
        int veilingproductNr,
        int? kwekerNr,
        CancellationToken ct);
    Task<VeilingproductVeilingmeesterListDto> GetVeilingmeesterListByIdAsync(
        int veilingproductNr,
        CancellationToken ct);
}
