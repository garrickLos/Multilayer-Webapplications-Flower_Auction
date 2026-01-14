using Microsoft.AspNetCore.Mvc;
using System;
using System.Globalization;
using System.Threading;
using mvc_api.Data;

namespace mvc_api.Controllers
{
    /// <summary>
    /// DTO/model voor één regel in de prijshistorie (per datum en kweker/bedrijf).
    /// </summary>
    public class PrijsHistorieItem
    {
        /// <summary>Naam van het bedrijf/kweker (kan leeg zijn afhankelijk van de query).</summary>
        public string? BedrijfsNaam { get; set; }

        /// <summary>Datum/tijd waarop deze prijs is gemeten/gestart.</summary>
        public DateTime BeginDatum { get; set; }

        /// <summary>Prijs per fust (integer bedrag).</summary>
        public int BedragPerFust { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class PrijsHistorieController : ControllerBase
    {
        private readonly IPrijsHistorieRepository _repository;

        /// <summary>
        /// Controller voor het ophalen van prijshistorie via de repository.
        /// </summary>
        public PrijsHistorieController(IPrijsHistorieRepository repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Haalt prijshistorie op voor een categorie (alle kwekers/bedrijven).
        /// Zet ook de gemiddelde prijs in de response header: X-GemiddeldePrijs.
        /// </summary>
        /// <param name="CategorieNr">Categorie ID waarvoor de prijshistorie wordt opgehaald.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Lijst met prijshistorie items.</returns>
        [HttpGet]
        public IActionResult GetPrijsHistorieIedereen(int CategorieNr, CancellationToken ct = default)
        {
            var resultaat = _repository.GetPrijsHistorieIedereen(CategorieNr, ct);

            // Gemiddelde prijs meegeven via header (handig voor de frontend)
            if (HttpContext is not null)
            {
                Response.Headers["X-GemiddeldePrijs"] = (resultaat.AverageBedrag ?? 0m)
                    .ToString(CultureInfo.InvariantCulture);
            }

            return Ok(resultaat.Items);
        }

        /// <summary>
        /// Haalt prijshistorie op voor één specifieke kweker/bedrijf binnen een categorie.
        /// Zet ook de gemiddelde prijs in de response header: X-GemiddeldePrijs.
        /// </summary>
        /// <param name="CategorieNr">Categorie ID waarvoor de prijshistorie wordt opgehaald.</param>
        /// <param name="bedrijfsNaam">Naam van het bedrijf/kweker om op te filteren.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Lijst met prijshistorie items voor de gekozen kweker.</returns>
        [HttpGet("kweker")]
        public IActionResult GetPrijsHistorieAlleenKweker(int CategorieNr, string bedrijfsNaam, CancellationToken ct = default)
        {
            var resultaat = _repository.GetPrijsHistorieAlleenKweker(CategorieNr, bedrijfsNaam, ct);

            // Gemiddelde prijs meegeven via header
            if (HttpContext is not null)
            {
                Response.Headers["X-GemiddeldePrijs"] = (resultaat.AverageBedrag ?? 0m)
                    .ToString(CultureInfo.InvariantCulture);
            }

            return Ok(resultaat.Items);
        }
    }
}
