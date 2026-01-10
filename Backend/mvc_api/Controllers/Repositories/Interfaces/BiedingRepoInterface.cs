using Microsoft.AspNetCore.Mvc;

namespace mvc_api.Repo.Interfaces;

public interface IBiedingRepo
{
    Task<(List<klantBiedingGet_dto> Items, int Total)> GetKlantBiedingenAsync(int? gebruikerNr, int? veilingProductNr, bool orderDescending, int page, int pageSize, CancellationToken ct);
    Task<(List<VeilingMeester_BiedingDto> Items, int Total)> GetVeilingMeesterBiedingenAsync(int? gebruikerNr, int? veilingNr, bool orderDescending, int page, int pageSize , CancellationToken ct);
    Task<VeilingMeester_BiedingDto> GetById(int id, CancellationToken ct = default);
    Task<VeilingMeester_BiedingDto> CreateAsync(BiedingCreateDto dto, CancellationToken ct);
    Task<bool> DeleteAsync(int id, CancellationToken ct);
}