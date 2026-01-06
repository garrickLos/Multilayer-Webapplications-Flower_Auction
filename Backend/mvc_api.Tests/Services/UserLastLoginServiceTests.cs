using mvc_api.Models;
using mvc_api.Tests.Mocks;
using Xunit;

namespace mvc_api.Tests.Services;

// Service die de laatste inlogtijd van een gebruiker bijwerkt
internal sealed class UserLastLoginService
{
    private readonly IUserRepository _users;

    public UserLastLoginService(IUserRepository users) => _users = users;

    public async Task<bool> TryUpdateLoginAsync(int gebruikerNr, DateTime timestamp, CancellationToken ct = default)
    {
        var user = await _users.FindByIdAsync(gebruikerNr, ct);

        // alleen actieve gebruiker mag worden bijgewerkt
        if (user is null || user.Status != ModelStatus.Active)
            return false;

        user.LaatstIngelogd = timestamp;
        await _users.SaveAsync(user, ct);
        return true;
    }
}

public class UserLastLoginServiceTests
{
    [Fact(DisplayName = "Handgeschreven mock: actieve gebruiker krijgt bijgewerkte login")]
    public async Task TryUpdateLoginAsync_WithActiveUser_SavesTimestamp()
    {
        // arrange: actieve gebruiker + handgemaakte fake repository
        var user = new Gebruiker { GebruikerNr = 10, Status = ModelStatus.Active };
        var repo = new FakeUserRepository(user);
        var service = new UserLastLoginService(repo);
        var now = DateTime.UtcNow;

        // act: login tijd bijwerken
        var result = await service.TryUpdateLoginAsync(10, now);

        // assert: update moet gelukt zijn
        Assert.True(result);
        var stored = await repo.FindByIdAsync(10);
        Assert.Equal(now, stored!.LaatstIngelogd);
    }

    [Fact(DisplayName = "Handgeschreven mock: inactieve gebruiker wordt overgeslagen")]
    public async Task TryUpdateLoginAsync_WithInactiveUser_DoesNothing()
    {
        // arrange: inactieve gebruiker + fake repository
        var user = new Gebruiker { GebruikerNr = 20, Status = ModelStatus.Inactive };
        var repo = new FakeUserRepository(user);
        var service = new UserLastLoginService(repo);

        // act: proberen te updaten
        var result = await service.TryUpdateLoginAsync(20, DateTime.UtcNow);

        // assert: update geweigerd, er is niets opgeslagen
        Assert.False(result);
        Assert.Empty(repo.SavedUserIds);
    }
}