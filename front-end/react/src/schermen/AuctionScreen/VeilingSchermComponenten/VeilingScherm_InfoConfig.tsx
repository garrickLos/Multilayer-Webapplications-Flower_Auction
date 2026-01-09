import { jwtDecode } from "jwt-decode";
import { ApiRequest } from "../../../typeScript/ApiRequest";

import { Vermenigvuldigen as naarCenten } from "../../../typeScript/RekenFuncties";

import { GetIsoTimeByZone } from "../../../typeScript/FetchDate";

/********************
** gebruikte types **
*********************/
import type { ProductLogica } from "./VeilingSchermTypes/VeilingSchermTypes";
import type { VeilingproductUpdate, VeilingTijdUpdate } from "./VeilingSchermTypes/VeilingTypes";
import type { NieuweBieding } from "./VeilingSchermTypes/BiedingTypes";
import type { MyTokenPayload } from "./VeilingSchermTypes/TokenPayloadTypes";

export async function VeilingProductitem_Update(
    huidigProduct: ProductLogica,
    veilingNummer: number,
    InvoerAantal: number,
    HuidigePrijs: number,
    url: string, 
    token: string,
    refreshToken: string
) {
    if (!huidigProduct) return;

    const productId = Number(huidigProduct.veilingProductNr);
    if (!productId || productId === 0) {
        console.error("FOUT: Product ID is 0 of ongeldig");
        return;
    }

    const huidigeVoorraad_Fusten = Number(huidigProduct.aantalFusten) || 0;
    const huidigeVoorraad_Bloemen = Number(huidigProduct.voorraadBloemen) || 0;

    // Correctie voor laatste item: als alles wordt gekocht, zet voorraad op 0
    let nieuweVoorraad_Fusten = huidigeVoorraad_Fusten - InvoerAantal;
    let nieuweVoorraad_Bloemen: number;

    // als de voorraad fusten kleiner is dan 0 
    // fusten en bloemenvoorraad worden op 0 gezet
    if (nieuweVoorraad_Fusten <= 0) {
        nieuweVoorraad_Fusten = 0;
        nieuweVoorraad_Bloemen = 0;

    } else {
        // als het niet kleiner is dan 0 zet het de oude getallen om in nieuwe waardes
        const inhoudPerFust = huidigeVoorraad_Bloemen / huidigeVoorraad_Fusten; // berekend hoeveel bloemen 1 fust heeft
        const teVerwijderenBloemen = Math.round(InvoerAantal * inhoudPerFust); // berekend hoeveel bloemen verwijderd moeten worden
        nieuweVoorraad_Bloemen = Math.max(0, huidigeVoorraad_Bloemen - teVerwijderenBloemen); // haal de hoeveelheid bloemen van de voorraad af
    }

    // **********************************
    // * invullen van bloemen en fusten *
    // **********************************

    // Controleer of de API alle velden vereist (inclusief degene die niet veranderen)
    const dataOmTeSturen: VeilingproductUpdate = {
        VoorraadBloemen: nieuweVoorraad_Bloemen,
        AantalFusten: nieuweVoorraad_Fusten,
    };

    // ****************************
    // * invullen van een bieding *
    // ****************************

    const decoded = jwtDecode<MyTokenPayload>(token);

    let totaalPrijs = Math.round(naarCenten(HuidigePrijs, 100));

    totaalPrijs = Math.trunc(totaalPrijs);

    const BiedingAanmaken: NieuweBieding = {
        BedragPerFust: totaalPrijs, // Gebruik de prijs van de klok
        AantalStuks: InvoerAantal,
        GebruikerNr: decoded.sub,
        VeilingProductNr: productId
    };

    // ********************************
    // * invullen van een nieuwe tijd *
    // ********************************

    const UpdateBeginTijd: VeilingTijdUpdate = {
        // maakt een nieuwe tijd aan op basis van de TijdZone waar de server in zit. (Europe/Amsterdam)
        GeupdateBeginTijd: GetIsoTimeByZone('Europe/Amsterdam'),
    };

    try {
        await Promise.all([
            // update de VeilingProduct hoeveelheid op basis van wat er is ingevoerd
            ApiRequest<VeilingproductUpdate>(url, 'PUT', dataOmTeSturen, token, refreshToken),

            // maakt een nieuwe bieding aan in de database
            ApiRequest<NieuweBieding>("/api/Bieding", "POST" , BiedingAanmaken, token, refreshToken),
            
            // Update de tijd op basis van tijdzone
            ApiRequest(`/api/Veiling/UpdateBeginTijd/${veilingNummer}`, 'PUT', UpdateBeginTijd, token, refreshToken),
        ]);

        console.log("Alle updates zijn succesvol verwerkt.");

    } catch (error) {
        console.error("API Error details:", error);
    }
}