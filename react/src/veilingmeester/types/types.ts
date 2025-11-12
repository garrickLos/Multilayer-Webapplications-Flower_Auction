// api
export type MaybeNumber = number | '' | null | undefined;

export type Bieding =
    Partial<{
        biedNr: number;
        bedragPerFust: number;
        aantalStuks: number;
        gebruikerNr: number;
        veilingNr: number;
        status: string;
        datum: string;
        aanmaakDatum: string;
        aangemaaktOp: string;
        createdAt: string;
        updatedAt: string;
        totaalBedrag: number;
        veilingTitel: string;
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

export type User =
    Partial<{
        gebruikerNr: number;
        naam: string;
        email: string;
        status: string;
        rollen: string[];
        rol: string;
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
    aantalProducten: number;
};

export type UserRow = RowBase & {
    id: number | string;
    gebruikerNr: number | string;
    naam: string;
    email: string;
    status: string;
    rol: string;
};

export type UserBidRow = RowBase & {
    id: number | string;
    biedNr: number | string;
    veiling: string | number;
    veilingNr: number | string;
    bedragPerFust: number | string;
    aantalStuks: number | string;
    status: string;
    datum: string;
};


// tabs

export type TabKey = 'users' | 'veilingen';

export type TabDefinition = {
    key: TabKey;
    label: string;
};
