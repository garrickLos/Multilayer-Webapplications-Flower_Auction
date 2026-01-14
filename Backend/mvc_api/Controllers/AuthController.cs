using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using mvc_api.DTOs.Auth;
using mvc_api.Models;
using mvc_api.Models.Dtos;
using mvc_api.Auth.GenereerAccessTokens;

namespace mvc_api.Controllers;

[ApiController]
[Route("auth")]
[Produces("application/json")]
public sealed class AuthController : ControllerBase
{
    private readonly UserManager<Gebruiker> _userManager;
    private readonly SignInManager<Gebruiker> _signInManager;
    private readonly IGenereerAccessTokens _tokenService;

    /// <summary>
    /// Maakt een controller voor registreren/inloggen en token afhandeling.
    /// </summary>
    public AuthController(
        UserManager<Gebruiker> userManager,
        SignInManager<Gebruiker> signInManager,
        IGenereerAccessTokens tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    /// <summary>
    /// Registreert een nieuwe gebruiker.
    /// Controleert validatie, controleert of email al bestaat, maakt gebruiker aan en koppelt rol.
    /// </summary>
    /// <param name="request">Registratiegegevens (email, wachtwoord, soort, etc.).</param>
    /// <returns>Succes/failed met foutmeldingen.</returns>
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

        // Check of het gebruikerstype bestaat/goed gespeld is
        if (!GebruikerSoorten.TryNormalize(request.Soort, out var normalizedSoort))
        {
            return BadRequest(new RegisterResponse(false, new[] { "Ongeldige gebruiker soort." }));
        }

        var trimmed = request.Trimmed();
        var existingUser = await _userManager.FindByEmailAsync(trimmed.Email);

        // Email moet uniek zijn
        if (existingUser is not null)
            return Conflict(new RegisterResponse(false, new[] { "Email is al in gebruik." }));

        // Nieuwe gebruiker opbouwen
        var user = new Gebruiker
        {
            Email = trimmed.Email,
            UserName = trimmed.Email,
            BedrijfsNaam = trimmed.BedrijfsNaam,
            Soort = normalizedSoort,
            Kvk = TrimOrNull(trimmed.Kvk),
            StraatAdres = TrimOrNull(trimmed.StraatAdres),
            Postcode = TrimOrNull(trimmed.Postcode),
            Status = ModelStatus.Active
        };

        // Gebruiker + wachtwoord opslaan via Identity
        var result = await _userManager.CreateAsync(user, trimmed.Password);

        if (result.Succeeded)
        {
            // Rol koppelen (bijv. klant/kweker/veilingmeester)
            await _userManager.AddToRoleAsync(user, request.Soort);
        }
        else
        {
            // Identity errors omzetten naar leesbare foutmeldingen
            return BadRequest(new RegisterResponse(false, result.Errors.Select(e => $"{e.Code}: {e.Description}").ToArray()));
        }

        return Ok(new RegisterResponse(true, Array.Empty<string>()));
    }

    /// <summary>
    /// Logt een gebruiker in met email + wachtwoord.
    /// Controleert of account actief is en geeft JWT + refresh token terug bij succes.
    /// </summary>
    /// <param name="request">Login gegevens (email, wachtwoord, rememberMe).</param>
    /// <returns>Succes/failed met tokens en foutmeldingen.</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new LoginResponse(false, null, null, GetModelErrors()));
        }

        var email = request.Email.Trim();
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return InvalidCredentialsResponse();
        }

        // Blokkeer login als account niet actief is
        if (user.Status is ModelStatus.Deleted or ModelStatus.Inactive)
        {
            return Unauthorized(new LoginResponse(false, null, null, new[] { "Account is niet actief." }));
        }

        // Controleert wachtwoord via Identity
        var result = await _signInManager.PasswordSignInAsync(
            user,
            request.Password,
            request.RememberMe,
            lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            // Specifieke melding bij lockout
            if (result.IsLockedOut)
            {
                return Unauthorized(new LoginResponse(false, null, null, new[]
                {
                    "Account is tijdelijk geblokkeerd wegens te veel mislukte inlogpogingen."
                }));
            }

            return InvalidCredentialsResponse();
        }

        // Tokens genereren bij succesvolle login
        var token = await _tokenService.GenerateJwtToken(user);
        var refreshToken = await _tokenService.GenerateRefreshTokenAsync(user);

        // Laatst ingelogd opslaan
        user.LaatstIngelogd = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Ok(new LoginResponse(true, token, refreshToken, Array.Empty<string>()));
    }

    /// <summary>
    /// Maakt een nieuw JWT + refresh token op basis van een geldige refresh token.
    /// Weigert als token onbekend, verlopen of gebruiker niet bestaat.
    /// </summary>
    /// <param name="request">Bevat de refresh token.</param>
    /// <returns>Nieuwe tokens of Unauthorized met foutmelding.</returns>
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshRequest request)
    {
        var storedToken = await _tokenService.GetStoredRefreshToken(request.RefreshToken);

        if (storedToken == null || storedToken.ExpiryDate < DateTime.UtcNow)
        {
            return Unauthorized(new LoginResponse(false, null, null, new[] { "Refresh token is ongeldig." }));
        }

        var user = await _userManager.FindByIdAsync(storedToken.User_Id.ToString());
        if (user == null)
        {
            return Unauthorized(new LoginResponse(false, null, null, new[] { "Gebruiker niet gevonden." }));
        }

        var newJwtToken = await _tokenService.GenerateJwtToken(user);
        var newRefreshToken = await _tokenService.GenerateRefreshTokenAsync(user);

        // Oude token markeren als ingetrokken (afhankelijk van implementatie ook opslaan!)
        storedToken.IsRevoked = true;

        return Ok(new LoginResponse(true, newJwtToken, newRefreshToken, Array.Empty<string>()));
    }

    /// <summary>
    /// Haalt alle model-validatie fouten uit ModelState en zet ze om naar een string-array.
    /// </summary>
    private string[] GetModelErrors() =>
        ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .ToArray();

    /// <summary>
    /// Trimt een string; geeft null terug als de waarde leeg of whitespace is.
    /// </summary>
    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>
    /// Standaard Unauthorized response voor verkeerde email/wachtwoord combinatie.
    /// </summary>
    private UnauthorizedObjectResult InvalidCredentialsResponse() =>
        Unauthorized(new LoginResponse(false, null, null, new[] { "Ongeldige inloggegevens." }));
}
