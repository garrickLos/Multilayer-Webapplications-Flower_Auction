using Moq;
using mvc_api.Models;
using mvc_api.Tests.Mocks;
using Xunit;

namespace mvc_api.Tests.Services;

// Service die een planning op een veilingproduct zet
internal sealed class VeilingproductPlanningService
{
    private readonly IVeilingproductRepository _repository;

    public VeilingproductPlanningService(IVeilingproductRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> ScheduleAsync(int id, int startPrijs, int veilingNr, CancellationToken ct = default)
    {
        var product = await _repository.FindAsync(id, ct);

        // planning mag alleen bij actieve producten zonder bestaande startprijs
        if (product is null || product.Status != ModelStatus.Active || product.Startprijs.HasValue)
            return false;

        // planning invullen
        product.Startprijs = startPrijs;
        product.VeilingNr = veilingNr;

        await _repository.SaveAsync(product, ct);
        return true;
    }
}

public class VeilingproductPlanningServiceTests
{
    [Fact(DisplayName = "Moq: actief product krijgt planning en wordt opgeslagen")]
    public async Task ScheduleAsync_WithActiveProduct_PersistsPlanning()
    {
        // testproduct aanmaken
        var product = new Veilingproduct { VeilingProductNr = 5, Status = ModelStatus.Active };

        // mock-repository instellen: FindAsync moet ons product teruggeven
        var repo = new Mock<IVeilingproductRepository>();
        repo.Setup(r => r.FindAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var service = new VeilingproductPlanningService(repo.Object);

        // methode uitvoeren
        var result = await service.ScheduleAsync(5, 100, 201);

        // controleren of het gelukt is
        Assert.True(result);

        // mock controleren: SaveAsync moet 1x zijn aangeroepen
        repo.Verify(r => r.SaveAsync(product, It.IsAny<CancellationToken>()), Times.Once);

        // waarden moeten op het product zijn gezet
        Assert.Equal(100, product.Startprijs);
        Assert.Equal(201, product.VeilingNr);
    }

    [Fact(DisplayName = "Moq: products zonder actieve status of met startprijs worden geweigerd")]
    public async Task ScheduleAsync_WhenProductInactiveOrAlreadyPlanned_ReturnsFalse()
    {
        // 1e testproduct: inactief
        var inactive = new Veilingproduct { VeilingProductNr = 6, Status = ModelStatus.Inactive };

        // mock-repo met een sequence van antwoorden
        var repo = new Mock<IVeilingproductRepository>();
        repo.SetupSequence(r => r.FindAsync(6, It.IsAny<CancellationToken>()))
            .ReturnsAsync(inactive)
            .ReturnsAsync(new Veilingproduct
            {
                VeilingProductNr = 6,
                Status = ModelStatus.Active,
                Startprijs = 10
            });

        var service = new VeilingproductPlanningService(repo.Object);

        // uitvoeren voor beide gevallen
        var inactiveResult = await service.ScheduleAsync(6, 50, 201);
        var alreadyPlannedResult = await service.ScheduleAsync(6, 50, 201);

        // beide moeten mislukken
        Assert.False(inactiveResult);
        Assert.False(alreadyPlannedResult);

        // er mag nooit iets opgeslagen zijn
        repo.Verify(r => r.SaveAsync(It.IsAny<Veilingproduct>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
