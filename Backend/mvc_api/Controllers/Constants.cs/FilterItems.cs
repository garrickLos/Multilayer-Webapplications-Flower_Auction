using System.Linq.Expressions;

namespace mvc_api.Data.Filters;

public static class FilterItems
{
    public static IQueryable<T> FilterItemNr<T, TValue>(
        this IQueryable<T> query, // standaard quert type die in de repo/controller zit
        TValue? value, // de waarde van de itemSoort die je meegeeft, mag null zijn als er niks wordt meegegeven
        Expression<Func<T, bool>> LinqItems) // dit is de linq querie. Hier moet de b => where b.*** == ***
        where TValue : struct // forceert dat de TValue een type (int, boolean, double etc..) moet zijn, mag dus geen (class, string, interface etc...) zijn
    {
        if (value.HasValue)
        {
            return query.Where(LinqItems);
        }

        return query;
    }

    public static IQueryable<T> FilterOrderDescending<T, TKey> (
        this IQueryable<T> query, // standard query type die in de controller/repo zit
        bool orderDescending, // waarde waarop gesorteerd wordt in de query
        Expression<Func<T, TKey>> LinqItems) // de linq query de nodig is om te sorteren
    {
        if (orderDescending)
        {
            return query.OrderByDescending(LinqItems); // als de bool true is dan ordend het op descending
        }

        return query.OrderBy(LinqItems); // om het te ordenen als het false is op ascending
    }
}