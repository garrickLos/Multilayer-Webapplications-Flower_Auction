export interface PrijsHistorieItemLogica {
    bedrijfsNaam: string;
    beginDatum: string;
    bedragPerFust: number;
}

// Interface voor het hoofdresultaat (komt overeen met PrijsHistorieResultaat)
export interface PrijsHistorieResultaatLogica {
    items: PrijsHistorieItemLogica[];
    averageBedrag: number | null;
}

export interface ContainerSideMenuProps {
    isOpen: boolean;

    kwekerNaam?: string;
    categorieNr?: number;
    productNaam?: string;
}