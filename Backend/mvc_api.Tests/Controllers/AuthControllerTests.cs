// using Xunit;
// using mvc_api.DTOs.Auth;
// using mvc_api.Tests.Mocks;
// using Microsoft.AspNetCore.Mvc;
// using Moq;
// using mvc_api.Models;
// using System.Security.Claims;
// using System.Security.Authentication;
//
// namespace mvc_api.Tests.Controllers;
//
// public class AuthControllerTests
// {
//     /* 
//     *************************************
//     * Testen van de Registratie functie *
//     *************************************
//     */ 
//
//     [Fact(DisplayName = "Register_GeldigeRequest_GeeftOkResultaat")]
//     public async Task Register_GeldigeRequest_GeeftOkResultaat()
//     {
//         // arrange
//         var mocks = AuthMockData.Build("AuthTestDb", null);
//
//         var request = new RegisterRequest
//         {
//             Email = "test@example.com",
//             Password = "Password123!",
//             Soort = "Koper",
//             BedrijfsNaam = "TestBedrijf"
//         };
//
//         // act
//
//         var result = await mocks.Controller.Register(request);
//
//         // assert
//         var actionResult = Assert.IsType<OkObjectResult>(result.Result);
//         var response = Assert.IsType<RegisterResponse>(actionResult.Value);
//         Assert.True(response.Success);
//     }
//
//     [Theory
//         (DisplayName = "Register_NietGeldigeRequest_GeeftNietOkResultaat")]
//     [InlineData ("Klant")]
//     [InlineData ("Veilingmeester")]
//     [InlineData ("Admin")]
//     public async Task Register_MetNietGeldigeSoortRequest_GeeftNietOkResultaat(String soort)
//     {
//         // arrange
//         var mocks = AuthMockData.Build("AuthTestDb", null);
//
//         var request = new RegisterRequest
//         {
//             Email = "test@example.com",
//             Password = "Password123!",
//             Soort = soort,
//             BedrijfsNaam = "AnderBedrijf"
//         };
//
//         // act
//
//         var result = await mocks.Controller.Register(request);
//
//         // assert
//         var actionResult = Assert.IsType<BadRequestObjectResult>(result.Result);
//         var response = Assert.IsType<RegisterResponse>(actionResult.Value);
//         Assert.False(response.Success);
//     }
//
//     /* 
//     *******************************
//     * Testen van de Login functie *
//     *******************************
//     */ 
//
//     [Fact(DisplayName="Success: Ingelogd met correcte data")]
//     public async Task Login_GeldigAccount_Success()
//     {
//         // 1. Arrange: Mocks ophalen
//
//         var fakeUser = new Gebruiker
//         {
//             Email = "flora@gmail.com",
//             UserName = "flora@gmail.com",
//             Status = ModelStatus.Active // Zorg dat status niet Deleted/Inactive is
//         };
//
//         var mocks = AuthMockData.Build("AuthTestDb", fakeUser);
//
//         var request = new LoginRequest
//         {
//             Email = "flora@gmail.com",
//             Password = "Password123!",
//             RememberMe = true
//         };
//
//         mocks.SignInManager.Setup(x => x.PasswordSignInAsync(It.IsAny<Gebruiker>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()))
//             .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
//
//         // Act
//         var result = await mocks.Controller.Login(request);
//
//         // Assert:
//         var actionResult = Assert.IsType<OkObjectResult>(result.Result);
//
//         var response = Assert.IsType<LoginResponse>(actionResult.Value);
//
//         // Controleer de inhoud
//         Assert.True(response.Success);
//         Assert.Equal("valid-test-token", response.Token);
//     }
//
//     [Fact(DisplayName="Failure: Ingelogd met geen gebruiker")]
//     public async Task Login_NoUser_Failure()
//     {
//         // 1. Arrange: Mocks ophalen
//
//         var mocks = AuthMockData.Build("AuthTestDb", null);
//
//         var request = new LoginRequest
//         {
//             Email = "flora@gmail.com",
//             Password = "Password123!",
//             RememberMe = true
//         };
//
//         // Act
//         var result = await mocks.Controller.Login(request);
//
//         // Assert:
//         var actionResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
//
//         var response = Assert.IsType<LoginResponse>(actionResult.Value);
//
//         // Controleer de inhoud
//         Assert.False(response.Success);
//     }
//
//     [Fact(DisplayName="Failure: Ingelogd met inactieve account")]
//     public async Task Login_ModelStatusInactive_Failure()
//     {
//         // 1. Arrange: Mocks ophalen
//
//         var fakeUser = new Gebruiker
//         {
//             Email = "flora@gmail.com",
//             UserName = "flora@gmail.com",
//             PasswordHash = "Password123!",
//             Status = ModelStatus.Inactive // Zorg dat status niet Deleted/Inactive is
//         };
//
//         var mocks = AuthMockData.Build("AuthTestDb", fakeUser);
//
//         var request = new LoginRequest
//         {
//             Email = "flora@gmail.com",
//             Password = "Password123!",
//             RememberMe = true
//         };
//
//         // Act
//         var result = await mocks.Controller.Login(request);
//
//         // Assert:
//         var actionResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
//
//         var response = Assert.IsType<LoginResponse>(actionResult.Value);
//
//         // Controleer de inhoud
//         Assert.False(response.Success);
//     }
//
//     [Fact(DisplayName="Failure: Ingelogd met ongeldige gegevens")]
//     public async Task Login_WrongSignIn_Failure()
//     {
//         // 1. Arrange
//         
//
//         var fakeUser = new Gebruiker
//         {
//             Email = "flora@gmail.com",
//             UserName = "flora@gmail.com",
//             Status = ModelStatus.Active
//         };
//
//         var mocks = AuthMockData.Build("AuthTestDb", fakeUser);
//
//         var request = new LoginRequest
//         {
//             Email = "flora@gmail.com",
//             Password = "FoutWachtwoord!",
//             RememberMe = true
//         };
//
//         mocks.SignInManager 
//             .Setup(x => x.PasswordSignInAsync(It.IsAny<Gebruiker>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<bool>()))
//             .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);
//
//         // 2. Act
//         var result = await mocks.Controller.Login(request);
//
//         // 3. Assert
//         // Let op: Verander OkObjectResult naar UnauthorizedObjectResult (ervan uitgaande dat InvalidCredentialsResponse 401 teruggeeft)
//         var actionResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
//
//         // Haal de Value op, niet GetType()
//         var response = Assert.IsType<LoginResponse>(actionResult.Value);
//
//         Assert.False(response.Success);
//     }
// }