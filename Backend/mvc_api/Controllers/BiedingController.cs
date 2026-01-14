using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;
using mvc_api.Models;
using mvc_api.Repo.Interfaces;
using mvc_api.statusPrinter;
using SQLitePCL;

namespace mvc_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize (Roles ="Koper, Bedrijf, VeilingMeester")]
public class BiedingController : ControllerBase
{
    private readonly IBiedingRepo _repository;

    public BiedingController (IBiedingRepo repository)
    {
        _repository = repository;
    }

    // GET: api/Bieding/Klant?gebruikerNr=&veilingProductNr=
    [HttpGet("Klant")]
    [Authorize (Roles ="Koper")]
    public async Task<ActionResult<IEnumerable<klantBiedingGet_dto>>> GetKlantBiedingen(
        [FromQuery] int? gebruikerNr,
        [FromQuery] int? veilingProductNr,
        [FromQuery] bool orderDescending = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        try
        {
            var (items, total) = await _repository.GetKlantBiedingenAsync(gebruikerNr, veilingProductNr, orderDescending, page, pageSize, ct);
        
            SetResponseHeader(total, page, pageSize);

            return items is null
                ? NotFound(CreateProblemDetails("Niet gevonden", $"Geen bieding gevonden.", 404))
                : Ok(items);   
        } catch (KeyNotFoundException ex)
        {
            return NotFound(CreateProblemDetails("Niet gevonden", ex.Message, 404));
        } catch (Exception)
        {
            return StatusCode(500, CreateProblemDetails("Server Fout", "Er is een onverwachte fout opgetreden.", 500));
        }
    }

    // GET: api/Bieding?gebruikerNr=&veilingNr=&page=&pageSize=
    [HttpGet]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<ActionResult<IEnumerable<VeilingMeester_BiedingDto>>> GetVeilingMeester_Biedingen(
        [FromQuery] int? gebruikerNr,
        [FromQuery] int? veilingNr,
        [FromQuery] bool orderDescending = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {

        try {
            var (items, total) = await _repository.GetVeilingMeesterBiedingenAsync(gebruikerNr, veilingNr, orderDescending, page, pageSize, ct);

            SetResponseHeader(total, page, pageSize);

            if (items is null)
            {
                return NotFound(CreateProblemDetails("Niet gevonden", $"Geen bieding gevonden.", 404));
            }

            return Ok(items);

        } catch (KeyNotFoundException ex)
        {
            return NotFound(CreateProblemDetails("Niet gevonden", ex.Message, 404));
        } catch (Exception ex)
        {
            return StatusCode(500, CreateProblemDetails("Server Fout", "Er is een onverwachte fout opgetreden." + " Error: " + ex.Message, 500));
        }
    }

    // GET: api/Bieding/1001
    [HttpGet("{id:int}")]
    [Authorize (Roles ="VeilingMeester")]
    public async Task<ActionResult<VeilingMeester_BiedingDto>> GetById(
        int id, 
        CancellationToken ct = default)
    {
        var items = await _repository.GetById(id, ct);

        if (items is null)
        {
            return NotFound(CreateProblemDetails("Niet gevonden", $"Geen bieding met ID {id}.", 404));
        }

        return Ok(items);
    }

    // POST: api/Bieding
    [HttpPost]
    [Authorize (Roles ="Koper")]
    public async Task<ActionResult<VeilingMeester_BiedingDto>> Create(
        [FromBody] BiedingCreateDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid) {
            return BadRequest(ModelState);
        }

        try
        {
            var itemResult = await _repository.CreateAsync(dto, ct);
            return CreatedAtAction("GetById", new { id = itemResult.BiedingNr }, itemResult);

        } catch (KeyNotFoundException ex)
        {
            return BadRequest(CreateProblemDetails("Ongeldige referentie", ex.Message, 400));
        } catch (InvalidOperationException ex)
        {    
            return BadRequest(CreateProblemDetails("Ongeldige status", ex.Message, 400));
        } catch (DbUpdateException ex)
        {
            return StatusCode(500, CreateProblemDetails("Database fout", ex.Message, 500));
        } catch (Exception ex)
        {
            return StatusCode(500, CreateProblemDetails("ServerFout", "Er is een onverwachte fout opgetreden." + " Error: " + ex.Message, 500));
        }
    }

    private ProblemDetails CreateProblemDetails(string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title    = title,
            Detail   = detail,
            Status   = statusCode,
            Instance = HttpContext?.Request?.Path
        };

    private void SetResponseHeader(int total, int page, int pageSize)
    {
        Response.Headers["X-Total-Count"] = total.ToString();
        Response.Headers["X-Page"]        = page.ToString();
        Response.Headers["X-Page-Size"]   = pageSize.ToString();
    }
}