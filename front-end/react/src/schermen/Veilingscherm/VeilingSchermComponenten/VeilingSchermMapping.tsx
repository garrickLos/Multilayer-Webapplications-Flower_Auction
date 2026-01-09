import type { VeilingLogica, PrijsHistorieItemLogica } from "../../Veilingscherm/VeilingSchermComponenten/index";

// mapt de data voor de veilingscherm
// dit zorgt ervoor dat er altijd info staat. Indien het niet gevonden kan worden (error tijdens de get)
// geeft het een default waarde om te tonen in plaats van lege vlakken
export function mapVeilingData(safeData: any[]): VeilingLogica[] {
    return safeData.map((item) => ({
        veilingNr: item.veilingNr,
        status: item.status,
        startIso: item.begintijd,
        geupdateIso: item.geupdateBeginTijd,
        endIso: item.eindtijd,
        
        producten: (item.producten || []).map((prod: any) => ({
            veilingProductNr: prod.veilingProductNr || prod.VeilingProductNr || "productNummer is niet gevonden",
            naam: prod.naam,

            kwekerNr: prod.gebruikerNr || prod.GebruikerNr || 0,
            
            categorieNaam: prod.CategorieNaam || prod.categorieNaam || "Geen categorie gevonden", 
            categorieNr: prod.CategorieNr || prod.categorieNr || "Geen categorie gevonden",
            
            aantalFusten: prod.AantalFusten || prod.aantalFusten || 0,
            voorraadBloemen: prod.VoorraadBloemen || prod.voorraadBloemen || 0,
            
            startPrijs: prod.startprijs || 'startprijs is niet bekend',
            minPrijs: prod.Minimumprijs || prod.minimumprijs || 'prijs is onbekend',

            plaats: prod.Plaats || prod.plaats || "Onbekende plaats",
            imagePath: prod.ImagePath || prod.imagePath || ""
        }))
    }));
}

export function mapInfoLijstData(apiResponse: any): PrijsHistorieItemLogica[] {
    let itemsToMap: any[] = [];

    // 2. Normalisatie van input
    if (Array.isArray(apiResponse)) {
        // Scenario A: De API geeft direct een lijst terug [ {...}, {...} ]
        itemsToMap = apiResponse;
    } else if (apiResponse && Array.isArray(apiResponse.items)) {
        // Scenario B: De API geeft een wrapper object { items: [...] }
        itemsToMap = apiResponse.items;
    } else if (apiResponse && Array.isArray(apiResponse.value)) {
        // Scenario C: OData wrapper { value: [...] }
        itemsToMap = apiResponse.value;
    } else {
        // Scenario D: Geen lijst gevonden, return leeg.
        return [];
    }

    // 3. Mapping
    return itemsToMap.map((item) => ({
        bedrijfsNaam: item.bedrijfsNaam || item.BedrijfsNaam || "Onbekend",
        beginDatum: item.beginDatum || item.BeginDatum || new Date().toISOString(),
        bedragPerFust: Number(item.bedragPerFust || item.BedragPerFust || item.prijs || 0)
    }));
}