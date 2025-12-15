using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using mvc_api.DTOs.Auth;
using mvc_api.Models;
using mvc_api.Models.Dtos;

namespace mvc_api.Controllers;

public interface IGenereerBearerToken
{
    Task<string> GenerateJwtToken(Gebruiker gebruiker); 
}

[ApiController]
[Route("auth")]
[Produces("application/json")]
public sealed class AuthController : ControllerBase
{
    private readonly UserManager<Gebruiker> _userManager;
    private readonly SignInManager<Gebruiker> _signInManager;
    private readonly IGenereerBearerToken _bearerToken;

    public AuthController(
        UserManager<Gebruiker> userManager,
        SignInManager<Gebruiker> signInManager,
        IGenereerBearerToken bearerTokenService)
    {
        _userManager   = userManager   ?? throw new ArgumentNullException(nameof(userManager));
        _signInManager = signInManager ?? throw new ArgumentNullException(nameof(signInManager));
        _bearerToken   = bearerTokenService ?? throw new ArgumentNullException(nameof(bearerTokenService));
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RegisterResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(RegisterResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new RegisterResponse(false, GetModelErrors()));
        }

        // Wanneer een soort verkeerd is
        if (!GebruikerSoorten.TryNormalize(request.Soort, out var normalizedSoort))
        {
            return BadRequest(new RegisterResponse(false, new[] { "Ongeldige gebruiker soort." }));
        }

        var trimmed = request.Trimmed();
        var existingUser = await _userManager.FindByEmailAsync(trimmed.Email);

        // Wanneer er al een bestaande gebruiker is
        if (existingUser is not null)
            return Conflict(new RegisterResponse(false, new[] { "Email is al in gebruik." }));

        var user = new Gebruiker
        {
            Email        = trimmed.Email,
            UserName     = trimmed.Email,
            BedrijfsNaam = trimmed.BedrijfsNaam,
            Soort        = normalizedSoort,
            Kvk          = TrimOrNull(trimmed.Kvk),
            StraatAdres  = TrimOrNull(trimmed.StraatAdres),
            Postcode     = TrimOrNull(trimmed.Postcode),
            Status       = ModelStatus.Active
        };

        var result = await _userManager.CreateAsync(user, trimmed.Password);
        
        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(user, request.Soort);
        } else {
            return BadRequest(new RegisterResponse(false, result.Errors.Select(e => $"{e.Code}: {e.Description}").ToArray()));
        }

        return Ok(new RegisterResponse(true, Array.Empty<string>()));
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new LoginResponse(false, null, GetModelErrors()));
        }

        var email = request.Email.Trim();
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return InvalidCredentialsResponse();
        }

        if (user.Status is ModelStatus.Deleted or ModelStatus.Inactive)
        {
            return Unauthorized(new LoginResponse(false, null, new[] { "Account is niet actief." }));
        }

        var result = await _signInManager.PasswordSignInAsync(
            user,
            request.Password,
            request.RememberMe,
            lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            if (result.IsLockedOut)
            {
                return Unauthorized(new LoginResponse(false, null, new[]
                {
                    "Account is tijdelijk geblokkeerd wegens te veel mislukte inlogpogingen."
                }));
            }

            return InvalidCredentialsResponse();
        }

        var token = await _bearerToken.GenerateJwtToken(user);

        user.LaatstIngelogd = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Ok(new LoginResponse(true, token, Array.Empty<string>()));
    }

    private string[] GetModelErrors() =>
        ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .ToArray();

    private static string? TrimOrNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private UnauthorizedObjectResult InvalidCredentialsResponse() =>
        Unauthorized(new LoginResponse(false, null, new[] { "Ongeldige inloggegevens." }));
}
