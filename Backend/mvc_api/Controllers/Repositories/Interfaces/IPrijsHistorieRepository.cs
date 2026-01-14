using System.Collections.Generic;
using System.Threading;
using mvc_api.Controllers;

namespace mvc_api.Data;

/// <summary>
/// DTO waardes die terug worden gestuurd wanneer de endpoint succesvol waardes terugstuurd
/// </summary>
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

/// <summary>
/// Interface voor de prijsHistory controller endpoint die ervoor zorgt dat de database gescheiden is van de endpoint die testen makkelijker maakt.
/// </summary>
public interface IPrijsHistorieRepository
{
    PrijsHistorieResultaat GetPrijsHistorieIedereen(int categorieNr, CancellationToken ct = default);
    PrijsHistorieResultaat GetPrijsHistorieAlleenKweker(int categorieNr, string bedrijfsNaam, CancellationToken ct = default);
}