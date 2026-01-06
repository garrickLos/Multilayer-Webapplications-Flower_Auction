using Moq;
using mvc_api.Models;

namespace mvc_api.Tests.Mocks
{
    public static class VeilingProjectieMockFactory
    {
        // public static Mock<IVeilingProjectie> CreateAnonymous()
        // {
        //     var projectieMock = new Mock<IVeilingProjectie>();

        //     projectieMock
        //         .Setup(p => p.ProjectToVeiling_anonymousDto(
        //             It.IsAny<IQueryable<Veiling>>(),
        //             It.IsAny<DateTime>()))
        //         .Returns((IQueryable<Veiling> q, DateTime _) =>
        //             q.Select(v => new Anonymous_VeilingDto
        //             {
        //                 VeilingNr = v.VeilingNr,
        //                 VeilingNaam = v.VeilingNaam,
        //                 Begintijd = v.Begintijd,
        //                 Eindtijd = v.Eindtijd,
        //                 Status = v.Status.ToString()
        //             })
        //         );

        //     return projectieMock;
        // }
    }
}
