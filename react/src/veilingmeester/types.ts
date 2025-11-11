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

export type TabKey = 'biedingen' | 'veilingen';
