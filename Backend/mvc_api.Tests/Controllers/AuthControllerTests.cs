using mvc_api.Models.Dtos;
using Xunit;
using mvc_api.DTOs.Auth;
using mvc_api.Tests.Mocks;
using Moq;
using mvc_api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http.HttpResults;

namespace mvc_api.Tests.Controllers;

public class AuthControllerTests
{
    /* 
    *************************************
    * Testen van de Registratie functie *
    *************************************
    */ 

    [Fact(DisplayName = "Register_GeldigeRequest_GeeftOkResultaat")]
    public async Task Register_GeldigeRequest_GeeftOkResultaat()
    {
        // arrange
        var mocks = AuthMockData.Build("AuthTestDb");

        var request = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "Password123!",
            Soort = "Koper",
            BedrijfsNaam = "TestBedrijf"
        };

        // act

        var result = await mocks.Controller.Register(request);

        // assert
        var actionResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RegisterResponse>(actionResult.Value);
        Assert.True(response.Success);
    }

    [Theory
        (DisplayName = "Register_NietGeldigeRequest_GeeftNietOkResultaat")]
    [InlineData ("Klant")]
    [InlineData ("Veilingmeester")]
    [InlineData ("Admin")]
    public async Task Register_MetNietGeldigeSoortRequest_GeeftNietOkResultaat(String soort)
    {
        // arrange
        var mocks = AuthMockData.Build("AuthTestDb");

        var request = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "Password123!",
            Soort = soort,
            BedrijfsNaam = "AnderBedrijf"
        };

        // act

        var result = await mocks.Controller.Register(request);

        // assert
        var actionResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var response = Assert.IsType<RegisterResponse>(actionResult.Value);
        Assert.False(response.Success);
    }
}