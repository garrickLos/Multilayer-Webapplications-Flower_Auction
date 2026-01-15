using System.Data;
using Microsoft.Data.SqlClient;
using mvc_api.Controllers;

namespace mvc_api.Data
{
    public class PrijsHistorieRepository : IPrijsHistorieRepository
    {
        private readonly string _connectionString;

        /// <summary>
        /// deze query geeft de eerte 10 recenste datums en de gemiddelde bod per fust waar de
        /// categorienummer gelijk is aan de meegegeven categorie nummer en waar de bedrijfsnaam gelijk is
        /// aan de meegegeven bedrijfsnaam als die meegegeven is. De waardes zijn van nieuw naar oud geordend.
        /// </summary>
        private const string ItemsQueryKweker = @"
            SELECT TOP (10)
                CAST(V.BeginDatum AS date) AS BeginDatum,
                AVG(CAST(B.BedragPerFust AS DECIMAL(18,2))) AS GemiddeldePerFust
            FROM Veilingproduct V
            JOIN AspNetUsers U ON U.GebruikerNr = V.Kwekernr
            JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
            WHERE V.CategorieNr = @CategorieNr
              AND (@BedrijfsNaam IS NULL OR U.BedrijfsNaam = @BedrijfsNaam)
            GROUP BY CAST(V.BeginDatum AS date)
            ORDER BY CAST(V.BeginDatum AS date) DESC;";

        /// <summary>
        /// deze query haalt voor de laatste 10 veilingdatums van een bepaalde categorie
        /// per bedrijfsnaam het gemiddelde bod per fust op
        /// </summary>
        private const string ItemsQueryIedereen = @"
            SELECT
                U.BedrijfsNaam,
                CAST(V.BeginDatum AS date) AS BeginDatum,
                AVG(CAST(B.BedragPerFust AS DECIMAL(18,2))) AS GemiddeldePerFust
            FROM Veilingproduct V
            JOIN AspNetUsers U ON U.GebruikerNr = V.Kwekernr
            JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
            WHERE V.CategorieNr = @CategorieNr
              AND CAST(V.BeginDatum AS date) IN (
                    SELECT TOP 10 CAST(BeginDatum AS date)
                    FROM Veilingproduct
                    WHERE CategorieNr = @CategorieNr
                    GROUP BY CAST(BeginDatum AS date)
                    ORDER BY CAST(BeginDatum AS date) DESC
                )
            GROUP BY U.BedrijfsNaam, CAST(V.BeginDatum AS date)
            ORDER BY BeginDatum DESC, U.BedrijfsNaam;";

        /// <summary>
        /// deze quey berekent het gemiddelde bod per fust voor veilingproducten in een
        /// opgegeven categorie met een optionele filter op bedrijfsnaam
        /// </summary>
        private const string AverageQuery = @"
            SELECT AVG(CAST(B.BedragPerFust AS DECIMAL(18,2)))
            FROM Veilingproduct V
            JOIN AspNetUsers U ON U.GebruikerNr = V.Kwekernr
            JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
            WHERE V.CategorieNr = @CategorieNr
              AND (@BedrijfsNaam IS NULL OR U.BedrijfsNaam = @BedrijfsNaam);";

        public PrijsHistorieRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("Default")
                ?? throw new InvalidOperationException("Connection string 'Default' ontbreekt.");
        }

        /// <summary>
        /// Roept de juiste prijshistorie query aan (voor iedereen of alleen een specifieke kweker)
        /// en haalt de resultaten op, inclusief per datum bedragen en het gemiddelde bod per fust
        /// </summary>
       
        public PrijsHistorieResultaat GetPrijsHistorieIedereen(int categorieNr, CancellationToken ct = default)
            => GetPrijsHistorie(categorieNr, null, ct);

        public PrijsHistorieResultaat GetPrijsHistorieAlleenKweker(int categorieNr, string bedrijfsNaam, CancellationToken ct = default)
            => GetPrijsHistorie(categorieNr, bedrijfsNaam, ct);

        /// <summary>
        /// Haalt per datum het gemiddelde bod per fust en
        /// het algemene gemiddelde berekent op aan de hand van de
        /// meegegeven categorienummer en optionele bedrijfsnaam
        /// </summary>
        /// <param name="categorieNr">meegegeven categorienummer die wordt gebruikt voor het filteren</param>
        /// <param name="bedrijfsNaam">optionele bedrijfsnaam die wordt gebruikt voor het filteren</param>
        /// <param name="ct">cancelation token</param>
        /// <returns>geeft alles terug in een PrijsHistorieResultaat</returns>
        private PrijsHistorieResultaat GetPrijsHistorie(int categorieNr, string? bedrijfsNaam, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            var items = new List<PrijsHistorieItem>();

            //kijkt of er een bedrijfsnaam is meegegeven
            var isKwekerFilter = !string.IsNullOrWhiteSpace(bedrijfsNaam);

            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = isKwekerFilter ? ItemsQueryKweker : ItemsQueryIedereen;
                cmd.Parameters.Add("@CategorieNr", SqlDbType.Int).Value = categorieNr;
                //Als er een bedrijfsnaam is meegegeven dan geeft hij die mee als parameter
                if (isKwekerFilter)
                    cmd.Parameters.Add("@BedrijfsNaam", SqlDbType.NVarChar, 256).Value = bedrijfsNaam!;

                using var reader = cmd.ExecuteReader();
                var ordBegin = reader.GetOrdinal("BeginDatum");
                var ordAvg = reader.GetOrdinal("GemiddeldePerFust");
                var ordBedrijf = !isKwekerFilter ? reader.GetOrdinal("BedrijfsNaam") : -1;

                //zolang er waardes zijn slaat hij datum, gemiddelde bod per fust en eventueel bedrijfsnaam op
                while (reader.Read())
                {
                    var item = new PrijsHistorieItem
                    {
                        BeginDatum = reader.GetDateTime(ordBegin),
                        BedragPerFust = Convert.ToInt32(Math.Round(reader.GetDecimal(ordAvg)))
                    };

                    if (!isKwekerFilter)
                        item.BedrijfsNaam = reader.GetString(ordBedrijf);

                    items.Add(item);
                }
            }

            decimal? average;
            //voert de averagequery uit die het algemene gemiddelde bod per fust berekent
            //als er geen resultaat is wordt er null teruggegeven
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = AverageQuery;
                cmd.Parameters.Add("@CategorieNr", SqlDbType.Int).Value = categorieNr;
                cmd.Parameters.Add("@BedrijfsNaam", SqlDbType.NVarChar, 256).Value =
                    isKwekerFilter ? bedrijfsNaam! : DBNull.Value;

                var result = cmd.ExecuteScalar();
                average = result is null or DBNull ? null : Convert.ToDecimal(result);
            }

            return new PrijsHistorieResultaat(items, average);
        }
    }
}
