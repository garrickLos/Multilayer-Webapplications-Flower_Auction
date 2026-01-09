export interface VeilingItem {
    veilingNr: number
    begintijd: string
    eindtijd: string
    status: string
    minimumPrijs: number
    producten: Producten[]
}

export interface Producten {
    veilingProductNr: number
    naam: string
    startprijs: number
    aantalFusten: number
    imagePath?: string
    beschrijving?: string,
    gebruikerNr?: number
}

export interface AuctionCardProps {
    parentVeiling: VeilingItem;
    product: Producten;
}

export interface KwekerInfo {
    bedrijfsNaam?: string; 
}