using System.Linq.Expressions;

namespace mvc_api.Data.Filters;

public static class FilterItems
{
    /// <summary>
    /// Deze functie filtert items aan de hand van de meegegeven waardes
    /// </summary>
    /// <typeparam name="T">het type object in de query</typeparam>
    /// <typeparam name="TValue">het type van de sleutel in de query</typeparam>
    /// <param name="query"> standaard query type die in de repo/controller zit</param>
    /// <param name="value"> de waarde van de itemsoort die je meegeeft, mag null zijn als er niks wordt meegegeven</param>
    /// <param name="LinqItems">dit is de linq query die je mee krijgt; bijvoorbeeld b => b.GebruikerNr == gebruikerNr</param>
    /// Tvalue : struct forceert dat de TValue  een type (int, boolean, double, etc) moet zijn, het mag dus geen class, string interface, etc zijn.
    /// <returns>Geeft de gefilterde producten terug</returns>
    public static IQueryable<T> FilterItemNr<T, TValue>(
        this IQueryable<T> query,
        TValue? value,
        Expression<Func<T, bool>> LinqItems)
        where TValue : struct
    {
        if (value.HasValue)
        {
            return query.Where(LinqItems);
        }

        return query;
    }

    /// <summary>
    /// Soorteert een IQueryable op basis van de opgegeven LINQ expressie.
    /// Als orderDescending true is dan sorteert het aflopend, anders oplopend.
    /// </summary>
    /// <typeparam name="T">het type object in de query</typeparam>
    /// <typeparam name="TKey">het type van de sleutel in de query</typeparam>
    /// <param name="query">standard query type die in de controller/repo zit</param>
    /// <param name="orderDescending">waarde waarop gesorteerd wordt in de query.</param>
    /// <param name="LinqItems">de linq query de nodig is om te sorteren bijvoorbeeld b => b.GebruikerNr == gebruikerNr</param>
    /// <returns>geeft een gesorteerde IQueryable terug volgends de gegeven waarden</returns>
    public static IQueryable<T> FilterOrderDescending<T, TKey>(
        this IQueryable<T> query, 
        bool orderDescending,  
        Expression<Func<T, TKey>> LinqItems)  
    {
        if (orderDescending)
        {
            return query.OrderByDescending(LinqItems); 
        }

        return query.OrderBy(LinqItems); 
    }
}