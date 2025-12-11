using Moq;
using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using mvc_api.Controllers;
using mvc_api.Models;
using mvc_api.Models.Dtos;
using mvc_api.DTOs.Auth;
using mvc_api.Auth.GenereerBearerToken;

namespace mvc_api.Tests.Controllers;

public class AuthControllerTests
{
    // Mocks simuleren de afhankelijkheden
    private readonly Mock<UserManager<Gebruiker>> _mockUserManager;
    private readonly Mock<SignInManager<Gebruiker>> _mockSignInManager;
    private readonly Mock<GenereerBearerToken> _mockTokenService;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockUserManager = MockHelpers.MockUserManager<Gebruiker>();
        _mockSignInManager = MockHelpers.MockSignInManager<Gebruiker>(_mockUserManager.Object);
        
        
        _mockTokenService = new Mock<GenereerBearerToken>();

        _controller = new AuthController(
            _mockUserManager.Object,
            _mockSignInManager.Object,
            _mockTokenService.Object
        );
    }

    [Fact (DisplayName ="Eerste test proberen")]
    public async Task Register_GeldigeRequest_GeeftOkResultaat()
    {
        var request = new RegisterRequest 
        { 
            Email = "test@example.com", 
            Password = "Password123!", 
            Soort = "Klant",
            BedrijfsNaam = "TestBedrijf"
        };

        _mockUserManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((Gebruiker)null!);

        _mockUserManager.Setup(x => x.CreateAsync(It.IsAny<Gebruiker>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        var result = await _controller.Register(request);

        var actionResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RegisterResponse>(actionResult.Value);
        Assert.True(response.Success);
    }
}

// Helper class om de complexe Identity Mocks op te zetten
public static class MockHelpers
{
    public static Mock<UserManager<TUser>> MockUserManager<TUser>() where TUser : class
    {
        var store = new Mock<IUserStore<TUser>>();
        return new Mock<UserManager<TUser>>(store.Object, null, null, null, null, null, null, null, null);
    }

    public static Mock<SignInManager<TUser>> MockSignInManager<TUser>(UserManager<TUser> userManager) where TUser : class
    {
        var contextAccessor = new Mock<IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<TUser>>();
        return new Mock<SignInManager<TUser>>(
            userManager, 
            contextAccessor.Object, 
            claimsFactory.Object, 
            null, null, null, null);
    }
}