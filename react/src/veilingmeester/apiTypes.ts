export type ModelStatus = "Active" | "Inactive" | "Deleted" | "Archived";

export interface GebruikerAuctionViewDto {
    gebruikerNr: number;
    bedrijfsNaam: string;
    email: string;
    soort: string;
    kvk: string;
    status: ModelStatus;
}

export interface BiedingBaseAmountDto {
    bedragPerFust: number;
    aantalStuks: number;
    gebruikerNr: number;
}

export interface BiedingCreateDto extends Partial<BiedingBaseAmountDto> {
    biedingNr?: number;
    veilingNr?: number;
    veilingproductNr?: number;
}

export interface BiedingUpdateDto extends Partial<BiedingBaseAmountDto> {}

export interface VeilingMeester_BiedingDto extends BiedingBaseAmountDto {
    biedingNr: number;
    veilingNr: number;
    veilingProductNr: number;
}

export interface VeilingCreateDto {
    veilingNaam: string;
    begintijd: string;
    eindtijd: string;
    status?: string | null;
}

export interface VeilingUpdateDto {
    veilingNaam: string;
    begintijd: string;
    eindtijd: string;
}

export interface VeilingProductDto {
    veilingProductNr: number;
    naam: string;
    startprijs?: number | null;
    minimumprijs: number;
    plaats: string;
    categorieNr: number;
    voorraadBloemen: number;
    aantalFusten: number;
    imagePath: string;
    veilingNr?: number | null;
}

export interface VeilingMeester_VeilingDto {
    veilingNr: number;
    veilingNaam: string;
    status?: string | null;
    begintijd: string;
    eindtijd: string;
    producten?: VeilingProductDto[] | null;
    biedingen?: VeilingMeester_BiedingDto[] | null;
}

export interface VeilingproductVeilingmeesterListDto {
    veilingProductNr: number;
    naam: string;
    categorieNaam?: string | null;
    status: ModelStatus;
    veilingNr?: number | null;
    kwekernr: number;
    verkoperNaam: string;
    startprijs?: number | null;
    minimumprijs: number;
}

export interface VeilingproductVeilingmeesterDetailDto extends VeilingproductVeilingmeesterListDto {
    aantalFusten: number;
    voorraadBloemen: number;
    plaats: string;
    geplaatstDatum: string;
    imagePath: string;
}

export interface CategorieListDto {
    categorieNr: number;
    naam: string | null;
}

export interface CategorieDetailDto {
    categorieNr: number;
    naam: string | null;
}
