using System;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace mvc_api.Data
{
    public class PrijsHistorieRepository : IPrijsHistorieRepository
    {
        private readonly string _connectionString;

        private const string ItemsQueryForKweker = @"SELECT TOP (10)
    CAST(V.BeginDatum AS date) AS BeginDatum,
    AVG(CAST(B.BedragPerFust AS DECIMAL(18,2))) AS GemiddeldePerFust
FROM Veilingproduct V
    INNER JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
    INNER JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
WHERE V.CategorieNr = @CategorieNr
  AND U.BedrijfsNaam = @BedrijfsNaam
GROUP BY CAST(V.BeginDatum AS date)
ORDER BY CAST(V.BeginDatum AS date) DESC;";

        private const string ItemsQueryForIedereen = @"SELECT TOP (10)
    U.BedrijfsNaam,
    CAST(V.BeginDatum AS date) AS BeginDatum,
    AVG(CAST(B.BedragPerFust AS DECIMAL(18,2))) AS GemiddeldePerFust
FROM Veilingproduct V
    INNER JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
    INNER JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
WHERE V.CategorieNr = @CategorieNr
GROUP BY U.BedrijfsNaam, CAST(V.BeginDatum AS date)
ORDER BY CAST(V.BeginDatum AS date) DESC, U.BedrijfsNaam ASC;";

        private const string AverageQueryForKweker = @"SELECT AVG(CAST(B.BedragPerFust AS DECIMAL(18,2)))
FROM Veilingproduct V
    INNER JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
    INNER JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
WHERE V.CategorieNr = @CategorieNr
  AND U.BedrijfsNaam = @BedrijfsNaam;";

        private const string AverageQueryForIedereen = @"SELECT AVG(CAST(B.BedragPerFust AS DECIMAL(18,2)))
FROM Veilingproduct V
    INNER JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
    INNER JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
WHERE V.CategorieNr = @CategorieNr;";

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
            decimal? average = null;
            var isKwekerFilter = !string.IsNullOrWhiteSpace(bedrijfsNaam);

            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            string itemsQuery = isKwekerFilter ? ItemsQueryForKweker : ItemsQueryForIedereen;
            using (var command = connection.CreateCommand())
            {
                command.CommandText = itemsQuery;
                command.Parameters.Add("@CategorieNr", SqlDbType.Int).Value = categorieNr;
                command.Parameters.Add("@BedrijfsNaam", SqlDbType.NVarChar, 256).Value = (object?)bedrijfsNaam ?? DBNull.Value;

                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    var item = new PrijsHistorieItem
                    {
                        BeginDatum = reader.GetDateTime(reader.GetOrdinal("BeginDatum")),
                        BedragPerFust = Convert.ToInt32(Math.Round(reader.GetDecimal(reader.GetOrdinal("GemiddeldePerFust"))))
                    };

                    if (!isKwekerFilter)
                    {
                        item.BedrijfsNaam = reader.GetString(reader.GetOrdinal("BedrijfsNaam"));
                    }
                    items.Add(item);
                }
            }

            string avgQuery = isKwekerFilter ? AverageQueryForKweker : AverageQueryForIedereen;
            using (var avgCommand = connection.CreateCommand())
            {
                avgCommand.CommandText = avgQuery;
                avgCommand.Parameters.Add("@CategorieNr", SqlDbType.Int).Value = categorieNr;
                avgCommand.Parameters.Add("@BedrijfsNaam", SqlDbType.NVarChar, 256).Value = (object?)bedrijfsNaam ?? DBNull.Value;

                object? avgResult = avgCommand.ExecuteScalar();
                if (avgResult != null && avgResult != DBNull.Value)
                {
                    average = Convert.ToDecimal(avgResult);
                }
            }

            return new PrijsHistorieResultaat(items, average);
        }
    }
}