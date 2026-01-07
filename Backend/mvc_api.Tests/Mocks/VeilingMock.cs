using Microsoft.EntityFrameworkCore;
using Moq;
using mvc_api.Controllers;
using mvc_api.Data;
using mvc_api.Models;
using ApiGetFilters;

namespace mvc_api.Tests.Mocks
{
    public static class VeilingControllerMockFactory
    {
        public class ThrowingDbContext : AppDbContext
        {
            public ThrowingDbContext(DbContextOptions<AppDbContext> options) : base(options)
            { }
            public override Task<int> SaveChangesAsync(CancellationToken ct = default)
            {
                throw new Exception("Test exception");
            }
        }
        public static VeilingController CreateVeilingControllerWithInMemoryDb(string dbName)
        {

            // Setup in-memory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            var context = new AppDbContext(options);

            // Gebruik echte filter zodat IQueryable async ondersteund wordt
            var filter = new VeilingControllerFilter(context);

            // Mock voor projectie (kan zo leeg blijven als je geen implementatie nodig hebt)
            var projectieMock = new Mock<ProjectieVeilingController>().Object;

            // Return controller
            return new VeilingController(context, projectieMock, filter);
        }
        
        public static VeilingController CreateVeilingControllerException(string dbName)
        {
        
            
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            //simulatie voor de errorexception
            var context = new ThrowingDbContext(options);

            // Gebruik echte filter zodat IQueryable async ondersteund wordt
            var filter = new VeilingControllerFilter(context);

            // Mock voor projectie (kan zo leeg blijven als je geen implementatie nodig hebt)
            var projectieMock = new Mock<ProjectieVeilingController>().Object;

            // Return controller
            return new VeilingController(context, projectieMock, filter);
        }
    }

    
}
