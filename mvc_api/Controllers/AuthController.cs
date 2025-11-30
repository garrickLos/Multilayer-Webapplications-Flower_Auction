using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using mvc_api.Auth.GenereerBearerToken;
using mvc_api.DTOs.Auth;
using mvc_api.Models;

namespace mvc_api.Controllers;

[ApiController]
[Route("auth")]
[Produces("application/json")]
public sealed class AuthController : ControllerBase
{
    private readonly UserManager<Gebruiker> _userManager;
    private readonly SignInManager<Gebruiker> _signInManager;
    private readonly GenereerBearerToken _bearerToken;

    public AuthController(
        UserManager<Gebruiker> userManager,
        SignInManager<Gebruiker> signInManager,
        GenereerBearerToken bearerTokenService)
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
            return BadRequest(new RegisterResponse
            {
                Success = false,
                Errors  = GetModelErrors()
            });
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
            return Conflict(new RegisterResponse { Success = false, Errors = new[] { "Email is al in gebruik." } });

        var email        = request.Email.Trim();
        var bedrijfsNaam = request.BedrijfsNaam.Trim();
        var soort        = request.Soort.Trim();
        var kvk          = request.Kvk?.Trim();
        var straatAdres  = request.StraatAdres?.Trim();
        var postcode     = request.Postcode?.Trim();
        var user = new Gebruiker
            
        {
            Email        = email,
            UserName     = email,
            BedrijfsNaam = bedrijfsNaam,
            Soort        = soort,
            Kvk          = kvk,
            StraatAdres  = straatAdres,
            Postcode     = postcode,
            Status       = ModelStatus.Active
        };

        // Password wordt hier gehasht en in PasswordHash opgeslagen
        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new RegisterResponse
            {
                Success = false,
                Errors  = result.Errors.Select(e => $"{e.Code}: {e.Description}")
            });
        }

        return Ok(new RegisterResponse
        {
            Success = true,
            Errors  = Array.Empty<string>()
        });
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {

        if (!ModelState.IsValid)
        {
            return BadRequest(new LoginResponse
            {
                Success = false,
                Errors  = GetModelErrors()
            });
        }

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return InvalidCredentialsResponse();
        }

        if (user.Status == ModelStatus.Deleted || user.Status == ModelStatus.Inactive)
        {
            return Unauthorized(new LoginResponse
            {
                Success = false,
                Errors  = new[] { "Account is niet actief." }
            });
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
                return Unauthorized(new LoginResponse
                {
                    Success = false,
                    Errors  = new[]
                    {
                        "Account is tijdelijk geblokkeerd wegens te veel mislukte inlogpogingen."
                    }
                });
            }

            return InvalidCredentialsResponse();
        }

        var token = await _bearerToken.GenerateJwtToken(user);

        user.LaatstIngelogd = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
        
        return Ok(new LoginResponse
        {
            Success = true,
            Token = token,
            Errors  = Array.Empty<string>()
        });
    }

    // Helpers

    private string[] GetModelErrors() =>
        ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .ToArray();

    private UnauthorizedObjectResult InvalidCredentialsResponse() =>
        Unauthorized(new LoginResponse
        {
            Success = false,
            Errors  = new[] { "Ongeldige inloggegevens." }
        });
}
