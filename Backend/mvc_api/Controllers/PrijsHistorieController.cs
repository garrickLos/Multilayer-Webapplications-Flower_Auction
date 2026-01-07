using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading;

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
        private readonly string _connectionString;

        public PrijsHistorieController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("Default")!;
        }

        [HttpGet]
        public IActionResult GetPrijsHistorieIedereen(int CategorieNr, CancellationToken ct = default)
        {
            var resultaten = new List<PrijsHistorieItem>();


            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                var tijdelijkeQuery = @"
                        SELECT top 10 U.BedrijfsNaam, V.BeginDatum, B.BedragPerFust
                        FROM Veilingproduct V
                        JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
                        JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
                        WHERE V.CategorieNr = @CategorieNr
                        ORDER BY V.BeginDatum DESC";

                using (var command = new SqlCommand(tijdelijkeQuery, connection))
                {
                    command.Parameters.AddWithValue("@CategorieNr", CategorieNr);

                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            resultaten.Add(new PrijsHistorieItem
                            {
                                BedrijfsNaam = reader.GetString(reader.GetOrdinal("BedrijfsNaam")),
                                BeginDatum = reader.GetDateTime(reader.GetOrdinal("BeginDatum")),
                                BedragPerFust = reader.GetInt32(reader.GetOrdinal("BedragPerFust"))
                            });
                        }
                    }
                }
            }

            return Ok(resultaten);
        }

        [HttpGet]
        public IActionResult GetPrijsHistorieAlleenKweker(int CategorieNr, string bedrijfsNaam, CancellationToken ct = default)
        {
            var resultaten = new List<PrijsHistorieItem>();


            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                var tijdelijkeQuery = @"
                    SELECT top 10 U.BedrijfsNaam, V.BeginDatum, B.BedragPerFust
                    FROM Veilingproduct V
                    JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
                    JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
                    WHERE V.CategorieNr = @CategorieNr
                    AND (@BedrijfsNaam = '' OR U.BedrijfsNaam = @BedrijfsNaam)
                    ORDER BY V.BeginDatum DESC";

                using (var command = new SqlCommand(tijdelijkeQuery, connection))
                {
                    command.Parameters.AddWithValue("@CategorieNr", CategorieNr);
                    command.Parameters.AddWithValue("@BedrijfsNaam", string.IsNullOrEmpty(bedrijfsNaam) ? "" : bedrijfsNaam);

                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            resultaten.Add(new PrijsHistorieItem
                            {
                                BedrijfsNaam = reader.GetString(reader.GetOrdinal("BedrijfsNaam")),
                                BeginDatum = reader.GetDateTime(reader.GetOrdinal("BeginDatum")),
                                BedragPerFust = reader.GetInt32(reader.GetOrdinal("BedragPerFust"))
                            });
                        }
                    }
                }
            }

            return Ok(resultaten);
        }
    }
    

}
