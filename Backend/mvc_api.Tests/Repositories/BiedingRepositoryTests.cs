using Xunit;
using Microsoft.AspNetCore.Mvc;
using mvc_api.Repo.Interfaces;
using mvc_api.Controllers;
using Moq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace mvc_api.Tests.Repositories;

public class BiedingRepositoryTests
{
    /* 
    ************
    * getklant *
    ************
    */ 
    [Fact(DisplayName = "Error klant bieding GET: Controller geeft 500 bij Repository Exception")]
    public async Task GetKlantBiedingen_OnException_Returns500()
    {
        // Arrange: Gebruik Moq om de repository te simuleren
        var mockRepo = new Mock<IBiedingRepo>();
        
        // Forceer een crash
        mockRepo.Setup(repo => repo.GetKlantBiedingenAsync(
            It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<bool>(), 
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new System.Exception("Database verbinding mislukt"));

        var controller = new BiedingController(mockRepo.Object);

        // Act
        var result = await controller.GetKlantBiedingen(1, null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }

    [Fact(DisplayName = "Error Klant bieding GET: Controller geeft 404 bij Repository Exception")]
    public async Task GetKlantBiedingen_OnException_Returns404()
    {
        // Arrange: Gebruik Moq om de repository te simuleren
        var mockRepo = new Mock<IBiedingRepo>();
        
        // Forceer een crash
        mockRepo.Setup(repo => repo.GetKlantBiedingenAsync(
            It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<bool>(), 
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Niet gevonden"));

        var controller = new BiedingController(mockRepo.Object);

        // Act
        var result = await controller.GetKlantBiedingen(1, null);

        // Assert
        var objectResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    [Fact(DisplayName = "Error: controller geeft 404 met geen data gevonden")]
    public async Task GetKlantBiedingen_IfStatement_Returns404()
    {
        // 1. Arrange
        var mockRepo = new Mock<IBiedingRepo>();
        
        mockRepo.Setup(repo => repo.GetKlantBiedingenAsync(
            It.IsAny<int?>(), 
            It.IsAny<int?>(), 
            It.IsAny<bool>(), 
            It.IsAny<int>(), 
            It.IsAny<int>(), 
            It.IsAny<CancellationToken>()))
            .ReturnsAsync((null, 0)); 

        var controller = new BiedingController(mockRepo.Object);

        // CRUCIAAL: Voeg HttpContext toe om NullReferenceException in SetResponseHeader te voorkomen
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        // 2. Act
        var result = await controller.GetKlantBiedingen(1, null);

        // 3. Assert
        // NotFoundObjectResult is specifieker dan ObjectResult
        var objectResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    /* 
    ******************************
    * getVeilingMeesterBiedingen *
    ******************************
    */ 

    [Fact(DisplayName = "Error VeilingMeester bieding GET: Controller geeft 500 bij Repository Exception")]
    public async Task GetVeilingMeester_biedingen_OnException_Returns500()
    {
        // Arrange: Gebruik Moq om de repository te simuleren
        var mockRepo = new Mock<IBiedingRepo>();
        
        // Forceer een crash
        mockRepo.Setup(repo => repo.GetVeilingMeesterBiedingenAsync(
            It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<bool>(), 
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new System.Exception("Niet gevonden"));

        var controller = new BiedingController(mockRepo.Object);

        // Act
        var result = await controller.GetVeilingMeester_Biedingen(1, null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }

    [Fact(DisplayName = "Error VeilingMeester bieding GET: Controller geeft 404 bij Repository Exception")]
    public async Task GetVeilingMeester_biedingen_OnException_Returns404()
    {
        // Arrange: Gebruik Moq om de repository te simuleren
        var mockRepo = new Mock<IBiedingRepo>();
        
        // Forceer een crash
        mockRepo.Setup(repo => repo.GetVeilingMeesterBiedingenAsync(
            It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<bool>(), 
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("Niet gevonden"));

        var controller = new BiedingController(mockRepo.Object);

        // Act
        var result = await controller.GetVeilingMeester_Biedingen(1, null);

        // Assert
        var objectResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    /* 
    ***********
    * GetById *
    ***********
    */ 

    [Fact(DisplayName = "Error GetById 404: controller geeft een 404 error")]
    public async Task GetById_IfStatement_Returns404()
    {
        // 1. Arrange
        var mockRepo = new Mock<IBiedingRepo>();
        
        mockRepo.Setup(repo => repo.GetById(
            It.IsAny<int>(), 
            It.IsAny<CancellationToken>()))
            .ReturnsAsync((VeilingMeester_BiedingDto)null); 

        var controller = new BiedingController(mockRepo.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        // 2. Act
        var result = await controller.GetById(1);

        // 3. Assert
        // NotFoundObjectResult is specifieker dan ObjectResult
        var objectResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    /* 
    *****************
    * CreateBieding *
    *****************
    */

    [Fact(DisplayName = "Error 400 ongeldige status: Koper krijgt error bij het aanmaken van een bieding")]
    public async Task Create_ErrorCreateBieding_400()
    {
        var mockRepo = new Mock<IBiedingRepo>();

        mockRepo.Setup(repo => repo.CreateAsync(
        It.IsAny<CancellationToken>()))
        .ThrowsAsync(new InvalidOperationException("Bieding niet toegestaan")); 

        var controller = new BiedingController(mockRepo.Object);

        var result = await controller.Create(new BiedingCreateDto(), CancellationToken.None);

        var objectResult = Assert.IsType<BadRequest>(result.Result);
        Assert.Equal(400, objectResult.StatusCode);
    }
}