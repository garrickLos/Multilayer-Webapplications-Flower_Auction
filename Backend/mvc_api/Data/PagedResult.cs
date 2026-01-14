namespace mvc_api.Data;

/// <summary>
/// Dto van de pageResult die mee wordt gegeven wanneer gegevens worden opgevraagd.
/// </summary>
/// <typeparam name="T">Zorgt ervoor dat meerdere soorten items deze dto kan gebruiken</typeparam>
/// <param name="Items">Readonly vorm van de items die worden opgehaald</param>
/// <param name="TotalCount">Hoeveelheid pagina's die de items bevat</param>
/// <param name="Page">De pagina waar de items op het moment op staat</param>
/// <param name="PageSize">De grootte van de pagina's</param>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize);
