using mvc_api.Models;

namespace mvc_api.Tests.Mocks;

public interface IUserRepository
{
    Task<Gebruiker?> FindByIdAsync(int gebruikerNr, CancellationToken ct = default);
    Task SaveAsync(Gebruiker gebruiker, CancellationToken ct = default);
}

/// <summary>
/// Handgeschreven mock die via DI in services gebruikt kan worden zonder databasecalls.
/// </summary>
public sealed class FakeUserRepository : IUserRepository
{
    private readonly Dictionary<int, Gebruiker> _store = new();
    public List<int> SavedUserIds { get; } = new();

    public FakeUserRepository(params Gebruiker[] seed)
    {
        foreach (var g in seed)
        {
            _store[g.GebruikerNr] = g;
        }
    }

    public Task<Gebruiker?> FindByIdAsync(int gebruikerNr, CancellationToken ct = default)
    {
        _store.TryGetValue(gebruikerNr, out var gebruiker);
        return Task.FromResult<Gebruiker?>(gebruiker);
    }

    public Task SaveAsync(Gebruiker gebruiker, CancellationToken ct = default)
    {
        _store[gebruiker.GebruikerNr] = gebruiker;
        SavedUserIds.Add(gebruiker.GebruikerNr);
        return Task.CompletedTask;
    }
}
