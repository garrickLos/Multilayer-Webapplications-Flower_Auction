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
