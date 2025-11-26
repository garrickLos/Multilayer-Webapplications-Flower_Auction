using Microsoft.AspNetCore.Mvc;
using mvc_api.DTOs.Auth;
using mvc_api.Models;
using Microsoft.AspNetCore.Identity;

namespace mvc_api.Controllers;

[ApiController]
[Route("auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly UserManager<Gebruiker> _userManager;

    public AuthController(UserManager<Gebruiker> userManager)
    {
        _userManager = userManager;
    }

    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            var validationErrors = ModelState.Values
                                             .SelectMany(v => v.Errors)
                                             .Select(e => e.ErrorMessage)
                                             .Where(e => !string.IsNullOrWhiteSpace(e));

            return BadRequest(new RegisterResponse
            {
                Success = false,
                Errors = validationErrors
            });
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Conflict(new RegisterResponse
            {
                Success = false,
                Errors = new[] { "Email is al in gebruik." }
            });
        }

        var user = new Gebruiker
        {
            Email = request.Email,
            UserName = request.Email,
            BedrijfsNaam = $"{request.FirstName} {request.LastName}".Trim(),
            Soort = "Koper",
            Wachtwoord = request.Password
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new RegisterResponse
            {
                Success = false,
                Errors = result.Errors.Select(e => $"{e.Code}: {e.Description}")
            });
        }

        return Ok(new RegisterResponse
        {
            Success = true,
            Errors = Array.Empty<string>()
        });
    }
}
