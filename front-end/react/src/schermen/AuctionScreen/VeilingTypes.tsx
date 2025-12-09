export interface ProductLogica {
    veilingProductNr: number;
    imagePath: string;
    naam: string;
    
    // Zorg dat dit numbers zijn, geen strings
    categorieNr: number | string; 
    aantalFusten: number;    
    voorraadBloemen: number;

    startPrijs: number;
    minPrijs: number; // Let op: consistentie in naamgeving (minPrijs vs minimumPrijs)
    
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