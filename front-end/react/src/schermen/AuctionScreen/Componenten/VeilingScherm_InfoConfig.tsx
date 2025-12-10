import { UpdateVeilingApi } from "../../../typeScript/ApiPost";

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

export async function VeilingProductitem_Update(isGeldig: boolean, huidigProduct: ProductLogica, InvoerAantal: number, url: string, token: string) {
    if (isGeldig && huidigProduct) {
            const productId = Number(huidigProduct.veilingProductNr);
            
            if (!productId || productId === 0) {
                console.error("FOUT: Product ID is 0 of ongeldig");
                return;
            }

            const huidigeVoorraad_Fusten = Number(huidigProduct.aantalFusten) || 0;
            const huidigeVoorraad_Bloemen = Number(huidigProduct.voorraadBloemen) || 0;

            const inhoudPerFust = huidigeVoorraad_Fusten > 0 
                ? huidigeVoorraad_Bloemen / huidigeVoorraad_Fusten 
                : 0;
            
            //berekend de nieuwe voorraad van fusten
            const nieuweVoorraad_Fusten = huidigeVoorraad_Fusten - InvoerAantal;
            
            // berekend de nieuwe voorraad van bloemen
            // math.round of math.floor om de kommagetallen weg te houden
            const teVerwijderenBloemen = Math.round(InvoerAantal * inhoudPerFust);
            const nieuweVoorraad_Bloemen = huidigeVoorraad_Bloemen - teVerwijderenBloemen;

            const dataOmTeSturen: VeilingproductUpdate_props = {
                VoorraadBloemen: nieuweVoorraad_Bloemen,
                AantalFusten: nieuweVoorraad_Fusten
            };

            try {
                await UpdateVeilingApi<VeilingproductUpdate_props>(url, dataOmTeSturen, token);
                
            } catch (error) {
                console.error("API Error details:", error);
            }
        }
}