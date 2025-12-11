using mvc_api.Models;

namespace mvc_api.Tests.Mocks;

// mock repository interface
public interface IUserRepository
{
    Task<Gebruiker?> FindByIdAsync(int gebruikerNr, CancellationToken ct = default);
    Task SaveAsync(Gebruiker gebruiker, CancellationToken ct = default);
}

// fake implementation voor tests
public sealed class FakeUserRepository : IUserRepository
{
    private readonly Dictionary<int, Gebruiker> _store = new(); // in-memory opslag
    public List<int> SavedUserIds { get; } = new(); // voor assert op opgeslagen ids

    public FakeUserRepository(params Gebruiker[] seed)
    {
        // seed testdata
        foreach (var g in seed)
            _store[g.GebruikerNr] = g;
    }

    public Task<Gebruiker?> FindByIdAsync(int gebruikerNr, CancellationToken ct = default)
    {
        // ophalen uit memory store
        _store.TryGetValue(gebruikerNr, out var gebruiker);
        return Task.FromResult<Gebruiker?>(gebruiker);
    }

    public Task SaveAsync(Gebruiker gebruiker, CancellationToken ct = default)
    {
        // opslaan + registreren voor asserts
        _store[gebruiker.GebruikerNr] = gebruiker;
        SavedUserIds.Add(gebruiker.GebruikerNr);
        return Task.CompletedTask;
    }
}