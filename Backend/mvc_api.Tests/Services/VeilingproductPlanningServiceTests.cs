using Moq;
using mvc_api.Models;
using mvc_api.Tests.Mocks;
using Xunit;

namespace mvc_api.Tests.Services;

// service met repository voor planning
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

        // alleen actieve en nog niet geplande producten
        if (product is null || product.Status != ModelStatus.Active || product.Startprijs.HasValue)
            return false;

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
        // arrange
        var product = new Veilingproduct { VeilingProductNr = 5, Status = ModelStatus.Active };
        var repo = new Mock<IVeilingproductRepository>();
        repo.Setup(r => r.FindAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var service = new VeilingproductPlanningService(repo.Object);

        // act
        var result = await service.ScheduleAsync(5, startPrijs: 100, veilingNr: 201);

        // assert
        Assert.True(result);
        repo.Verify(r => r.SaveAsync(product, It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal(100, product.Startprijs);
        Assert.Equal(201, product.VeilingNr);
    }

    [Fact(DisplayName = "Moq: products zonder actieve status of met startprijs worden geweigerd")]
    public async Task ScheduleAsync_WhenProductInactiveOrAlreadyPlanned_ReturnsFalse()
    {
        // arrange: eerst inactief product, dan actief maar al gepland
        var inactive = new Veilingproduct { VeilingProductNr = 6, Status = ModelStatus.Inactive };
        var repo = new Mock<IVeilingproductRepository>();
        repo.SetupSequence(r => r.FindAsync(6, It.IsAny<CancellationToken>()))
            .ReturnsAsync(inactive)
            .ReturnsAsync(new Veilingproduct
            {
                VeilingProductNr = 6,
                Status = ModelStatus.Active,
                Startprijs = 10 // al gepland
            });

        var service = new VeilingproductPlanningService(repo.Object);

        // act
        var inactiveResult = await service.ScheduleAsync(6, 50, 201);
        var alreadyPlannedResult = await service.ScheduleAsync(6, 50, 201);

        // assert
        Assert.False(inactiveResult);
        Assert.False(alreadyPlannedResult);
        repo.Verify(r => r.SaveAsync(It.IsAny<Veilingproduct>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
