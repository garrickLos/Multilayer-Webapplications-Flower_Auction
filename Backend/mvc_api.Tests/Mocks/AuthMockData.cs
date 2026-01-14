using Moq;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using mvc_api.Controllers;
using mvc_api.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using mvc_api.Data;

using mvc_api.Auth.GenereerAccessTokens;

namespace mvc_api.Tests.Mocks;

public class AuthMocks
{
    public AuthController Controller { get; set; } = null!;
    public Mock<UserManager<Gebruiker>> UserManager { get; set; } = null!;
    public Mock<SignInManager<Gebruiker>> SignInManager { get; set; } = null!;
    public Mock<IGenereerAccessTokens> TokenService { get; set; } = null!;
}

public static class AuthMockData
{
    // Bouwt een set van mocks en retourneert een geconfigureerde AuthController
    public static AuthMocks Build(string dbName, Gebruiker? fakeUser)
    {
        var userManagerMock = MockHelpers.MockUserManager<Gebruiker>();
        var signInManager = MockHelpers.MockSignInManager(userManagerMock.Object);
        var tokenMock = new Mock<IGenereerAccessTokens>();

        /*
            Mock voor de userManager
        */

        // Default: geen bestaande gebruiker
        userManagerMock.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(fakeUser);

        userManagerMock.Setup(x => x.CreateAsync(It.IsAny<Gebruiker>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<Gebruiker>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<Gebruiker>()))
            .ReturnsAsync(IdentityResult.Success);

        /*
            Mock voor de signInManager
        */

        /*
            Mock voor de tokenService
        */

        tokenMock
            .Setup(x => x.GenerateJwtToken(It.IsAny<Gebruiker>()))
            .ReturnsAsync("valid-test-token");
        
        var controller = new AuthController(userManagerMock.Object, signInManager.Object, tokenMock.Object);

        return new AuthMocks
        {
            Controller = controller,
            UserManager = userManagerMock,
            SignInManager = signInManager,
            TokenService = tokenMock
        };
    }

    public static AuthController AuthController (string dbname, ClaimsPrincipal? user = null){
        
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbname)
            .Options;
        var dbContext = new AppDbContext(options);

        dbContext.Database.EnsureCreated();

        if (!dbContext.Gebruikers.Any()) {
            dbContext.Gebruikers.Add(
                new Gebruiker{
                    Id = 1,
                    GebruikerNr = 1,
                    BedrijfsNaam = "Flora BV",
                    Email = "flora@gmail.com",
                    PasswordHash = "Password123",
                    UserName = "flora@gmail.com",
                    LaatstIngelogd = new DateTime(2025, 10, 08, 12, 0, 0, DateTimeKind.Utc),
                    Soort = "VeilingMeester",
                    Kvk = "12345678",
                    StraatAdres = "Bloemig 10",
                    Postcode = "1234AB",
                    Status = ModelStatus.Active
                }
            );

            dbContext.SaveChanges();
        }

        // Return a controller wired to the DbContext (useful for tests that operate directly on DB-backed controller)
        // For controller actions that require Identity, prefer the mocks returned by Build(...)
        return new AuthController(MockHelpers.MockUserManager<Gebruiker>().Object,
                                  MockHelpers.MockSignInManager(MockHelpers.MockUserManager<Gebruiker>().Object).Object,
                                  new Mock<IGenereerAccessTokens>().Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user ?? new ClaimsPrincipal() }
            }
        };
    }
}

// Helper class om de complexe Identity Mocks op te zetten
public static class MockHelpers
{
    public static Mock<UserManager<TUser>> MockUserManager<TUser>() where TUser : class
    {
        var store = new Mock<IUserStore<TUser>>();
        return new Mock<UserManager<TUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    public static Mock<SignInManager<TUser>> MockSignInManager<TUser>(UserManager<TUser> userManager) where TUser : class
    {
        var contextAccessor = new Mock<IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<TUser>>();
        
        return new Mock<SignInManager<TUser>>(
            userManager,
            contextAccessor.Object,
            claimsFactory.Object,
            null!, null!, null!, null!);
    }
}