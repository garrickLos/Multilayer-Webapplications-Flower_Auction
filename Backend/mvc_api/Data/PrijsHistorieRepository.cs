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

        // Alleen de "kweker" variant groeperen op BeginDatum
        var isKwekerFilter = !string.IsNullOrWhiteSpace(bedrijfsNaam);

        using var connection = new SqlConnection(_connectionString);
        using var command = connection.CreateCommand();

        connection.Open();

        if (isKwekerFilter)
        {
            command.CommandText = @"
                -- 10 unieke dagen (BeginDatum) voor 1 specifieke kweker + categorie
                SELECT TOP (10)
                    CAST(V.BeginDatum AS date) AS BeginDatum,
                    CAST(ROUND(AVG(CAST(B.BedragPerFust AS DECIMAL(18,2))), 0) AS INT) AS BedragPerFust
                FROM Veilingproduct V
                JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
                JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
                WHERE V.CategorieNr = @CategorieNr
                  AND U.BedrijfsNaam = @BedrijfsNaam
                GROUP BY CAST(V.BeginDatum AS date)
                ORDER BY CAST(V.BeginDatum AS date) DESC;

                -- Gemiddelde over alle biedingen voor dezelfde kweker + categorie
                SELECT AVG(CAST(B.BedragPerFust AS DECIMAL(18,2)))
                FROM Veilingproduct V
                JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
                JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
                WHERE V.CategorieNr = @CategorieNr
                  AND U.BedrijfsNaam = @BedrijfsNaam;";
        }
        else
        {
            command.CommandText = @"
          SELECT TOP (10)
                    U.BedrijfsNaam,
                    CAST(V.BeginDatum AS date) AS BeginDatum,
                    CAST(ROUND(AVG(CAST(B.BedragPerFust AS DECIMAL(18,2))), 0) AS INT) AS BedragPerFust
          FROM Veilingproduct V
                JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
                JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
                WHERE V.CategorieNr = @CategorieNr
                GROUP BY U.BedrijfsNaam, CAST(V.BeginDatum AS date)
                ORDER BY CAST(V.BeginDatum AS date) DESC, U.BedrijfsNaam ASC;

                SELECT AVG(CAST(B.BedragPerFust AS DECIMAL(18,2)))
                FROM Veilingproduct V
                JOIN AspNetUsers U ON V.Kwekernr = U.GebruikerNr
                JOIN Bieding B ON B.VeilingproductNr = V.VeilingProductNr
                WHERE V.CategorieNr = @CategorieNr;";
        }

        command.Parameters.Add("@CategorieNr", SqlDbType.Int).Value = categorieNr;
        command.Parameters.Add("@BedrijfsNaam", SqlDbType.NVarChar, 256).Value =
            isKwekerFilter ? bedrijfsNaam! : string.Empty;

        using var reader = command.ExecuteReader();

        while (reader.Read())
        {
            if (isKwekerFilter)
            {
                items.Add(new PrijsHistorieItem
                {
                    BeginDatum     = reader.GetDateTime(reader.GetOrdinal("BeginDatum")),
                    BedragPerFust  = reader.GetInt32(reader.GetOrdinal("BedragPerFust"))
                });
            }
            else
            {
                items.Add(new PrijsHistorieItem
                {
                    BedrijfsNaam   = reader.GetString(reader.GetOrdinal("BedrijfsNaam")),
                    BeginDatum     = reader.GetDateTime(reader.GetOrdinal("BeginDatum")),
                    BedragPerFust  = reader.GetInt32(reader.GetOrdinal("BedragPerFust"))
                });
            }
        }

        if (reader.NextResult() && reader.Read() && !reader.IsDBNull(0))
        {
            average = reader.GetDecimal(0);
        }

        return new PrijsHistorieResultaat(items, average);
    }
}
