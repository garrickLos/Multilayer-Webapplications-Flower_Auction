// Shared API DTO definitions based on the OpenAPI specification.
// This file is framework-agnostic so other React sections can reuse the same types.

// Categorie DTO's
export interface CategorieCreateDto {
    naam: string;
}

export interface CategorieUpdateDto {
    naam: string;
}

export interface CategorieListDto {
    categorieNr: number;
    naam: string | null;
}

export interface CategorieDetailDto {
    categorieNr: number;
    naam: string | null;
}

// Bieding DTO's
export interface BiedingBaseAmountDto {
    bedragPerFust?: number;
    aantalStuks?: number;
}

export interface BiedingCreateDto extends BiedingBaseAmountDto {
    biedingNr?: number;
    gebruikerNr?: number;
    veilingNr?: number;
    veilingproductNr?: number;
}

export interface BiedingUpdateDto extends BiedingBaseAmountDto {}

export interface VeilingMeester_BiedingDto extends BiedingBaseAmountDto {
    biedingNr: number;
    gebruikerNr: number;
    veilingNr: number;
    veilingProductNr: number;
}

// Gebruiker DTO's
export interface BaseGebruiker {
    bedrijfsNaam: string;
    email: string;
    wachtwoord: string;
    laatstIngelogd?: string | null;
    soort: string;
    kvk?: string | null;
    straatAdres?: string | null;
    postcode?: string | null;
}

export interface GebruikerCreateDto extends BaseGebruiker {}

export interface GebruikerUpdateDto extends BaseGebruiker {}

export interface Klant_GebruikerDto extends BaseGebruiker {
    gebruikerNr: number;
    biedingen?: VeilingMeester_BiedingDto[] | null;
}

// Veiling DTO's
export interface BaseVeilingDto {
    veilingNaam: string;
    begintijd: string;
    eindtijd: string;
}

export interface Klant_VeilingDto extends BaseVeilingDto {
    veilingNr?: number | null;
    status: string | null;
    producten?: VeilingProductDto[] | null;
}

export interface VeilingCreateDto extends BaseVeilingDto {
    status?: string | null;
}

export interface VeilingUpdateDto extends BaseVeilingDto {}

export interface VeilingMeester_VeilingDto extends BaseVeilingDto {
    status?: string | null;
    veilingNr?: number | null;
    producten?: VeilingProductDto[] | null;
    biedingen?: VeilingMeester_BiedingDto[] | null;
}

export interface VeilingProductDto {
    veilingProductNr: number;
    naam: string | null;
    startprijs: number;
    voorraad: number;
    imagePath: string | null;
}

// Veilingproduct DTO's
export interface VeilingproductCreateDto {
    naam: string;
    geplaatstDatum?: string | null;
    fust?: number;
    voorraad?: number;
    startprijs?: number;
    categorieNr?: number;
    veilingNr?: number | null;
    plaats: string;
    minimumprijs?: number;
    kwekernr?: number;
    beginDatum?: string;
    status?: boolean;
    imagePath: string;
}

export interface VeilingproductUpdateDto {
    naam: string;
    geplaatstDatum?: string | null;
    fust?: number;
    voorraad?: number;
    startprijs?: number;
    categorieNr?: number;
    veilingNr?: number | null;
    kwekernr?: number;
    plaats: string;
    minimumprijs?: number;
    beginDatum?: string;
    status?: boolean;
    imagePath: string;
}

export interface VeilingproductListDto {
    veilingProductNr: number;
    naam: string | null;
    geplaatstDatum: string;
    fust: number;
    voorraad: number;
    startprijs: number;
    minimumprijs: number;
    plaats: string | null;
    categorie: string | null;
    veilingNr?: number | null;
    kwekernr: number;
    beginDatum: string;
    status: boolean;
    imagePath: string | null;
}

export interface VeilingproductBidListItem {
    biedNr: number;
    bedragPerFust: number;
    aantalStuks: number;
    gebruikerNr: number;
}

export interface VeilingproductDetailDto {
    veilingProductNr: number;
    naam: string | null;
    geplaatstDatum: string;
    fust: number;
    voorraad: number;
    startprijs: number;
    minimumprijs: number;
    plaats: string | null;
    categorie: string | null;
    veilingNr?: number | null;
    kwekernr: number;
    beginDatum: string;
    status: boolean;
    imagePath: string | null;
    biedingen?: VeilingproductBidListItem[] | null;
}
