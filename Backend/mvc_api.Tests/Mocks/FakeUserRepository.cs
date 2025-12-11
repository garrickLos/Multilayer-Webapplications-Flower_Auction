using mvc_api.Models;

namespace mvc_api.Tests.Mocks;

// Mockbare repository-interface voor gebruikers
public interface IUserRepository
{
    Task<Gebruiker?> FindByIdAsync(int gebruikerNr, CancellationToken ct = default);
    Task SaveAsync(Gebruiker gebruiker, CancellationToken ct = default);
}

// Handgemaakte fake repository voor unit tests
public sealed class FakeUserRepository : IUserRepository
{
    private readonly Dictionary<int, Gebruiker> _store = new(); // eenvoudige in-memory database
    public List<int> SavedUserIds { get; } = new(); // bijhouden welke gebruikers zijn opgeslagen

    public FakeUserRepository(params Gebruiker[] seed)
    {
        // seeddata toevoegen aan de in-memory store
        foreach (var g in seed)
            _store[g.GebruikerNr] = g;
    }

    public Task<Gebruiker?> FindByIdAsync(int gebruikerNr, CancellationToken ct = default)
    {
        // gebruiker opzoeken in de in-memory store
        _store.TryGetValue(gebruikerNr, out var gebruiker);
        return Task.FromResult<Gebruiker?>(gebruiker);
    }

    public Task SaveAsync(Gebruiker gebruiker, CancellationToken ct = default)
    {
        // opslaan in memory + registreren voor asserts
        _store[gebruiker.GebruikerNr] = gebruiker;
        SavedUserIds.Add(gebruiker.GebruikerNr);
        return Task.CompletedTask;
    }
}
