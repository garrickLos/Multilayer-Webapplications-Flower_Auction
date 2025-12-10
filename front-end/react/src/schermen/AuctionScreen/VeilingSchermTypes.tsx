export interface ProductLogica {
    veilingProductNr: number;
    imagePath: string;
    naam: string;
    
    categorieNaam: string; 
    categorieNr: number;

    aantalFusten: number;    
    voorraadBloemen: number;

    GeplaatsteDatum: Date;

    startPrijs: number;
    minPrijs: number;
    
    plaats: string;
}

export interface VeilingLogica {
    veilingNr: number;
    status: string;
    startIso: string;
    endIso: string;
    producten: ProductLogica[];
}

export interface categorie{
    categorieNr: number;
    naam: string;
}

export type VeilingschermProps = {
    actieveVeiling: VeilingLogica;
    veilingItemNr: number;
}

export type errorMessaging = {
    verkeerdeWaarde?: string;
    correcteWaarde?: string;
};