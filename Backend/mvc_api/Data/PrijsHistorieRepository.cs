using System;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using mvc_api.Controllers;

namespace mvc_api.Data;

public class PrijsHistorieRepository : IPrijsHistorieRepository
{
    private readonly string _connectionString;

    public PrijsHistorieRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")!;
    }

    public PrijsHistorieResultaat GetPrijsHistorieIedereen(int categorieNr, CancellationToken ct = default)
        => GetPrijsHistorie(categorieNr, null, ct);

    public PrijsHistorieResultaat GetPrijsHistorieAlleenKweker(int categorieNr, string bedrijfsNaam, CancellationToken ct = default)
        => GetPrijsHistorie(categorieNr, bedrijfsNaam, ct);

    private PrijsHistorieResultaat GetPrijsHistorie(int categorieNr, string? bedrijfsNaam, CancellationToken ct)
    {
        var items = new List<PrijsHistorieItem>();
        decimal? average = null;

        using (var connection = new SqlConnection(_connectionString))
        using (var command = connection.CreateCommand())
        {
            connection.Open();
            command.CommandText = @"
                SELECT TOP 10 U.BedrijfsNaam, V.BeginDatum, B.BedragPerFust
                FROM Veilingproduct V
                JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
                JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
                WHERE V.CategorieNr = @CategorieNr
                AND (@BedrijfsNaam = '' OR U.BedrijfsNaam = @BedrijfsNaam)
                ORDER BY V.BeginDatum DESC;

                SELECT AVG(CAST(B.BedragPerFust AS DECIMAL(18,2)))
                FROM Veilingproduct V
                JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
                JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
                WHERE V.CategorieNr = @CategorieNr
                AND (@BedrijfsNaam = '' OR U.BedrijfsNaam = @BedrijfsNaam);";

            command.Parameters.Add("@CategorieNr", SqlDbType.Int).Value = categorieNr;
            command.Parameters.Add("@BedrijfsNaam", SqlDbType.NVarChar, 256).Value =
                string.IsNullOrWhiteSpace(bedrijfsNaam) ? string.Empty : bedrijfsNaam;

            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    items.Add(new PrijsHistorieItem
                    {
                        BedrijfsNaam = reader.GetString(reader.GetOrdinal("BedrijfsNaam")),
                        BeginDatum = reader.GetDateTime(reader.GetOrdinal("BeginDatum")),
                        BedragPerFust = reader.GetInt32(reader.GetOrdinal("BedragPerFust"))
                    });
                }

                if (reader.NextResult() && reader.Read() && !reader.IsDBNull(0))
                {
                    average = reader.GetDecimal(0);
                }
            }
        }

        return new PrijsHistorieResultaat(items, average);
    }
}