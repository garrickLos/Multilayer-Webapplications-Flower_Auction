using System.Collections.Generic;
using System.Threading;
using mvc_api.Controllers;

namespace mvc_api.Data;

public sealed class PrijsHistorieResultaat
{
    public PrijsHistorieResultaat(IReadOnlyList<PrijsHistorieItem> items, decimal? averageBedrag)
    {
        Items = items;
        AverageBedrag = averageBedrag;
    }

    public IReadOnlyList<PrijsHistorieItem> Items { get; }
    public decimal? AverageBedrag { get; }
}

public interface IPrijsHistorieRepository
{
    PrijsHistorieResultaat GetPrijsHistorieIedereen(int categorieNr, CancellationToken ct = default);
    PrijsHistorieResultaat GetPrijsHistorieAlleenKweker(int categorieNr, string bedrijfsNaam, CancellationToken ct = default);
}