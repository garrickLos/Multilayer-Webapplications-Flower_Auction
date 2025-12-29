import { jwtDecode } from "jwt-decode";
import { UpdateApi as UpdateVeilingApi, PostApi as NieuweBiedingMaken } from "../../../typeScript/ApiPut";

import { Vermenigvuldigen as naarCenten } from "../../../typeScript/RekenFuncties";

import type { VeilingLogica } from "../VeilingSchermTypes";
import type { ProductLogica } from "../VeilingSchermTypes";

export interface VeilingproductUpdate_props {
    // string | null zorgt dat je eventueel wel null mag sturen als dat ooit nodig is
    Naam?: string | null;
    GeplaatstDatum?: Date | null;
    VoorraadBloemen: number;
    AantalFusten: number;
    CategorieNr?: number | null;
    ImagePath?: string | null;
    Minimumprijs?: number | null;
    Plaats?: string | null;
}

interface nieuweBieding {
    BedragPerFust: number,
    AantalStuks: number,
    GebruikerNr: string,
    VeilingProductNr: number
}

interface MyTokenPayload {
    GebruikerNr: string; // Of number, afhankelijk van je API
    exp: number;
    iat: number;
    [key: string]: any; // Voor overige onbekende velden
}

export function mapData(safeData: any[]): VeilingLogica[] {
    return safeData.map((item) => ({
        veilingNr: item.veilingNr,
        status: item.status,
        startIso: item.begintijd,
        endIso: item.eindtijd,
        
        producten: (item.producten || []).map((prod: any) => ({
            veilingProductNr: prod.veilingProductNr || prod.VeilingProductNr || "productNummer is niet gevonden",
            naam: prod.naam,
            
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

export async function VeilingProductitem_Update(
    huidigProduct: ProductLogica, 
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

    if (nieuweVoorraad_Fusten <= 0) {
        nieuweVoorraad_Fusten = 0;
        nieuweVoorraad_Bloemen = 0;
    } else {
        const inhoudPerFust = huidigeVoorraad_Bloemen / huidigeVoorraad_Fusten;
        const teVerwijderenBloemen = Math.round(InvoerAantal * inhoudPerFust);
        nieuweVoorraad_Bloemen = Math.max(0, huidigeVoorraad_Bloemen - teVerwijderenBloemen);
    }

    // Controleer of de API alle velden vereist (inclusief degene die niet veranderen)
    const dataOmTeSturen: VeilingproductUpdate_props = {
        VoorraadBloemen: nieuweVoorraad_Bloemen,
        AantalFusten: nieuweVoorraad_Fusten,
    };

    const decoded = jwtDecode<MyTokenPayload>(token);

    let totaalPrijs = Math.round(naarCenten(HuidigePrijs, 100));

    totaalPrijs = Math.trunc(totaalPrijs);

    const BiedingAanmaken: nieuweBieding = {
        BedragPerFust: totaalPrijs, // Gebruik de prijs van de klok
        AantalStuks: InvoerAantal,
        GebruikerNr: decoded.sub,
        VeilingProductNr: productId
    };

    try {
        await Promise.all([
            // update de voorraad 
            UpdateVeilingApi<VeilingproductUpdate_props>(url, dataOmTeSturen, token, refreshToken),

            //nieuwe bieding aanmaken
            NieuweBiedingMaken<nieuweBieding>("/api/Bieding", BiedingAanmaken, token, refreshToken)
        ]);

    } catch (error) {
        console.error("API Error details:", error);
    }
}