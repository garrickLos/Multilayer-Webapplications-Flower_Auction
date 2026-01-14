using mvc_api.Data;
using mvc_api.Models;

namespace mvc_api.Controllers.Constants;

public class VeilingUpdate
{
    /// <summary>
    /// Deze functie controlleert aan de hand van de meegegeven waarden of een veilingstatus moet 
    /// worden aangepast aan de hand van de begin en eindtijden.
    /// </summary>
    /// <param name="veilingenTeUpdaten">krijgt een lijst met veilingen mee</param>
    /// <param name="now">krijgt de huidige tijd mee</param>
    /// <param name="_db">de databasecontext waarmee de wijzigingen worden opgeslagen</param>
    /// <param name="ct"> krijgt een cancelationtoken mee</param>
    /// <returns>alle wijzigingen status zijn opgeslagen</returns>
    public async Task ForEachUpdateProduct(IQueryable<Veiling> veilingenTeUpdaten, DateTime now, AppDbContext _db, CancellationToken ct)
    {
        foreach (var v in veilingenTeUpdaten)
        {
            //status wordt inactief gezet als de eindtijd voorbij is
            if (now >= v.Eindtijd)
            {
                v.Status = VeilingStatus.Inactive;
            }
            //status wordt actief als de veiling nog bezig is 
            else if (now >= v.Begintijd && now < v.Eindtijd)
            {
                v.Status = VeilingStatus.Active;
            }
        }
    
        await _db.SaveChangesAsync(ct);
    }   
}