using Microsoft.AspNetCore.Mvc;
using System;
using System.Globalization;
using System.Threading;
using mvc_api.Data;

namespace mvc_api.Controllers
{
    // Model voor één regel van de prijshistorie
    public class PrijsHistorieItem
    {
        public string BedrijfsNaam { get; set; } = "";
        public DateTime BeginDatum { get; set; }
        public int BedragPerFust { get; set; }
    }

    [ApiController]
    [Route("[controller]")]
    public class PrijsHistorieController : ControllerBase
    {
        private readonly IPrijsHistorieRepository _repository;
        public PrijsHistorieController(IPrijsHistorieRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public IActionResult GetPrijsHistorieIedereen(int CategorieNr, CancellationToken ct = default)
        {
            var resultaat = _repository.GetPrijsHistorieIedereen(CategorieNr, ct);
            if (HttpContext is not null)
            {
                Response.Headers["X-GemiddeldePrijs"] = (resultaat.AverageBedrag ?? 0m)
                    .ToString(CultureInfo.InvariantCulture);
            }
            return Ok(resultaat.Items);
        }

        [HttpGet]
        public IActionResult GetPrijsHistorieAlleenKweker(int CategorieNr, string bedrijfsNaam, CancellationToken ct = default)
        {
            var resultaat = _repository.GetPrijsHistorieAlleenKweker(CategorieNr, bedrijfsNaam, ct);
            if (HttpContext is not null)
            {
                Response.Headers["X-GemiddeldePrijs"] = (resultaat.AverageBedrag ?? 0m)
                    .ToString(CultureInfo.InvariantCulture);
            }

            return Ok(resultaat.Items);
        }
    }
}
