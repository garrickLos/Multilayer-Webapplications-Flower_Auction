using Microsoft.AspNetCore.Mvc;

namespace mvc_api.Repo.Interfaces;

/// <summary>
///     Interface met de klas items die gebruikt worden in de bieding controller.
///     Dit is nodig voor de scheiden van de database met de controller voor het testen van mocks.
/// </summary>
public interface IBiedingRepo
{
    Task<(List<klantBiedingGet_dto> Items, int Total)> GetKlantBiedingenAsync(int? gebruikerNr, int? veilingProductNr, bool orderDescending, int page, int pageSize, CancellationToken ct);
    Task<(List<VeilingMeester_BiedingDto> Items, int Total)> GetVeilingMeesterBiedingenAsync(int? gebruikerNr, int? veilingNr, bool orderDescending, int page, int pageSize , CancellationToken ct);
    Task<VeilingMeester_BiedingDto> GetById(int id, CancellationToken ct = default);
    Task<VeilingMeester_BiedingDto> CreateAsync(BiedingCreateDto dto, CancellationToken ct);
    Task<bool> DeleteAsync(int id, CancellationToken ct);
}