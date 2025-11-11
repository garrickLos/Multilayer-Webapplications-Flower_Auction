// api
export type MaybeNumber = number | '' | null | undefined;

export type Bieding = Partial<{
    biedNr: number;
    bedragPerFust: number;
    aantalStuks: number;
    gebruikerNr: number;
    veilingNr: number;
}> &
    Record<string, unknown>;

export type Veilingproduct = Partial<{
    veilingProductNr: number;
    naam: string | null;
    geplaatstDatum: string;
    fust: number;
    voorraad: number;
    startprijs: number;
    categorieNr: number;
    veilingNr: number;
    categorieNaam: string;
}> &
    Record<string, unknown>;

export type VeilingProductItem = Partial<{
    veilingProductNr: number;
    naam: string;
    startprijs: number | string;
    voorraad: number;
    afbeeldingUrl: string | null;
}> &
    Record<string, unknown>;

export type Veiling = Partial<{
    veilingNr: number;
    begintijd: string;
    eindtijd: string;
    status: string;
    minimumprijs: number | string;
    producten: VeilingProductItem[];
}> &
    Record<string, unknown>;

export type Categorie = Partial<{
    categorieNr: number;
    naam: string;
    id: number;
    name: string;
}> &
    Record<string, unknown>;


// http

export type QueryValue =
    | string
    | number
    | boolean
    | Date
    | readonly (string | number | boolean | Date)[]
    | undefined;

export type Query = Readonly<Record<string, QueryValue>>;

// rows

export type RowBase = Record<string, unknown>;

export type BidRow = RowBase & {
    id: number | string;
    biedNr: number | string;
    gebruiker: string | number;
    veiling: string | number;
    bedragPerFust: number | string;
    aantalStuks: number | string;
};

export type VeilingRow = RowBase & {
    id: number | string;
    veilingNr: number | undefined;
    begintijd: string;
    eindtijd: string;
    status: string | undefined;
    minimumprijs: string;
    aantalProducten: number;
};


// tabs

export type TabKey = 'biedingen' | 'veilingen';

export type TabDefinition = {
    key: TabKey;
    label: string;
};
