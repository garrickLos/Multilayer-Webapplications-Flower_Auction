using mvc_api.Models;

namespace mvc_api.Tests.Mocks;

public interface IBiedingRepository
{
    Task<Bieding?> FindByAsync(int biedingNr, CancellationToken ct = default);

    Task SaveAsync(Bieding bieding, CancellationToken ct = default);
}

public class NepBiedingData : IBiedingRepository
{
    private readonly Dictionary<int, Bieding> _store = new();
    public List<int> SavedBiedingIds { get; } = new();

    public Task<Bieding?> FindByAsync(int biedingNr, CancellationToken ct = default)
    {
        _store.TryGetValue(biedingNr, out var bieding);
        return Task.FromResult<Bieding?>(bieding);
    }

    public Task SaveAsync(Bieding bieding, CancellationToken ct = default)
    {
        _store[bieding.BiedNr] = bieding;
        SavedBiedingIds.Add(bieding.BiedNr);
        return Task.CompletedTask;
    }
}