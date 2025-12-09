import { UpdateVeilingApi } from "../../../typeScript/ApiPost";

import type { VeilingLogica } from "../VeilingTypes";
import type { VeilingproductUpdateDto } from "../VeilingScherm";
import type { ProductLogica } from "../VeilingTypes";

export function mapData(safeData: any[]): VeilingLogica[] {
    return safeData.map((item) => ({
        veilingNr: item.veilingNr,
        status: item.status,
        startIso: item.begintijd,
        endIso: item.eindtijd,
        
        producten: (item.producten || []).map((prod: any) => ({
            veilingProductNr: prod.veilingProductNr || prod.VeilingProductNr || "productNummer is niet gevonden",
            naam: prod.naam,
            
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

            const dataOmTeSturen: VeilingproductUpdateDto = {
                AantalFusten: nieuweVoorraad_Fusten,
                VoorraadBloemen: nieuweVoorraad_Bloemen
            };

            try {
                await UpdateVeilingApi<VeilingproductUpdateDto>(url, dataOmTeSturen, token);
                
            } catch (error) {
                console.error("API Error details:", error);
            }
        }
}