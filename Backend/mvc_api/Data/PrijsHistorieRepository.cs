using System.Data;
using Microsoft.Data.SqlClient;
using mvc_api.Controllers;

namespace mvc_api.Data
{
    public class PrijsHistorieRepository : IPrijsHistorieRepository
    {
        private readonly string _connectionString;

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

        public PrijsHistorieResultaat GetPrijsHistorieIedereen(int categorieNr, CancellationToken ct = default)
            => GetPrijsHistorie(categorieNr, null, ct);

        public PrijsHistorieResultaat GetPrijsHistorieAlleenKweker(int categorieNr, string bedrijfsNaam, CancellationToken ct = default)
            => GetPrijsHistorie(categorieNr, bedrijfsNaam, ct);

        private PrijsHistorieResultaat GetPrijsHistorie(int categorieNr, string? bedrijfsNaam, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            var items = new List<PrijsHistorieItem>();
            var isKwekerFilter = !string.IsNullOrWhiteSpace(bedrijfsNaam);

            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = isKwekerFilter ? ItemsQueryKweker : ItemsQueryIedereen;
                cmd.Parameters.Add("@CategorieNr", SqlDbType.Int).Value = categorieNr;
                if (isKwekerFilter)
                    cmd.Parameters.Add("@BedrijfsNaam", SqlDbType.NVarChar, 256).Value = bedrijfsNaam!;

                using var reader = cmd.ExecuteReader();
                var ordBegin = reader.GetOrdinal("BeginDatum");
                var ordAvg = reader.GetOrdinal("GemiddeldePerFust");
                var ordBedrijf = !isKwekerFilter ? reader.GetOrdinal("BedrijfsNaam") : -1;

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
