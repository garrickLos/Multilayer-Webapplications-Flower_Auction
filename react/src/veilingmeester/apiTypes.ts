export type ModelStatus = "Active" | "Inactive" | "Deleted" | "Archived";

export type GebruikerSummaryDto = {
    gebruikerNr: number;
    bedrijfsNaam: string;
    email: string;
    soort: string;
    kvk?: string | null;
    status: ModelStatus;
};

// Alias voor bestaande UI-code.
export type GebruikerAuctionViewDto = GebruikerSummaryDto;

export type BiedingBaseAmountDto = {
    bedragPerFust: number;
    aantalStuks: number;
    gebruikerNr: number;
};

export type BiedingCreateDto = BiedingBaseAmountDto & {
    biedingNr?: number;
    veilingNr?: number;
    veilingproductNr?: number;
};

export type BiedingUpdateDto = BiedingBaseAmountDto;

export type VeilingMeester_BiedingDto = BiedingBaseAmountDto & {
    biedingNr: number;
    veilingNr: number;
    veilingProductNr: number;
};

export type VeilingCreateDto = {
    veilingNaam: string;
    begintijd: string;
    eindtijd: string;
    status?: string | null;
};

export type VeilingUpdateDto = {
    veilingNaam: string;
    begintijd: string;
    eindtijd: string;
};

export type VeilingProductDto = {
    veilingProductNr: number;
    naam: string;
    startprijs?: number | null;
    minimumprijs: number;
    plaats: string;
    categorieNr: number;
    aantalFusten: number;
    voorraadBloemen: number;
    imagePath: string;
};

export type VeilingMeester_VeilingDto = {
    veilingNr: number;
    veilingNaam: string;
    status?: string | null;
    begintijd: string;
    eindtijd: string;
    producten?: VeilingProductDto[] | null;
    biedingen?: VeilingMeester_BiedingDto[] | null;
};

export type VeilingproductVeilingmeesterListDto = {
    veilingProductNr: number;
    naam: string;
    categorieNaam?: string | null;
    status: ModelStatus;
    veilingNr?: number | null;
    kwekernr: number;
    aantalFusten: number;
    voorraadBloemen: number;
    plaats: string;
    minimumprijs: number;
    startprijs?: number | null;
    geplaatstDatum: string;
    imagePath: string;
    beginDatum?: string | null;
};

export type VeilingproductVeilingmeesterDetailDto = VeilingproductVeilingmeesterListDto;

export type CategorieListDto = {
    categorieNr: number;
    naam: string;
};

export type CategorieDetailDto = {
    categorieNr: number;
    naam: string;
};

export type CategorieCreateDto = {
    naam: string;
};

export type CategorieUpdateDto = {
    naam: string;
};
