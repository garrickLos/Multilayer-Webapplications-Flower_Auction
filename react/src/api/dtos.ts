// Shared API DTO definitions generated from OpenAPI spec.

// Bieding DTO's
export interface BiedingCreateDto {
    bedragPerFust?: number;
    aantalStuks?: number;
    biedingNr?: number;
    gebruikerNr?: number;
    veilingNr?: number;
    veilingproductNr?: number;
}

export interface BiedingUpdateDto {
    bedragPerFust?: number;
    aantalStuks?: number;
}

export interface VeilingMeester_BiedingDto {
    bedragPerFust?: number;
    aantalStuks?: number;
    biedingNr?: number;
    gebruikerNr?: number;
    veilingNr?: number;
    veilingProductNr?: number;
}

// Categorie DTO's
export interface CategorieCreateDto {
    naam: string;
}

export interface CategorieUpdateDto {
    naam: string;
}

export interface CategorieListDto {
    categorieNr?: number;
    naam?: string | null;
}

export interface CategorieDetailDto {
    categorieNr?: number;
    naam?: string | null;
}

// Gebruiker DTO's
interface GebruikerBaseDto {
    bedrijfsNaam: string;
    email: string;
    wachtwoord: string;
    laatstIngelogd?: string | null;
    soort: string;
    kvk?: string | null;
    straatAdres?: string | null;
    postcode?: string | null;
}

export interface GebruikerCreateDto extends GebruikerBaseDto {}

export interface GebruikerUpdateDto extends GebruikerBaseDto {}

export interface Klant_GebruikerDto extends GebruikerBaseDto {
    gebruikerNr?: number;
    biedingen?: VeilingMeester_BiedingDto[] | null;
}

// Veiling DTO's
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
    veilingProductNr?: number;
    naam?: string | null;
    startprijs?: number;
    voorraad?: number;
    imagePath?: string | null;
}

export interface VeilingMeester_VeilingDto {
    veilingNaam: string;
    begintijd: string;
    eindtijd: string;
    status?: string | null;
    veilingNr?: number | null;
    producten?: VeilingProductDto[] | null;
    biedingen?: VeilingMeester_BiedingDto[] | null;
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
    veilingProductNr?: number;
    naam?: string | null;
    geplaatstDatum?: string;
    fust?: number;
    voorraad?: number;
    startprijs?: number;
    minimumprijs?: number;
    plaats?: string | null;
    categorie?: string | null;
    veilingNr?: number | null;
    kwekernr?: number;
    beginDatum?: string;
    status?: boolean;
    imagePath?: string | null;
}

export interface VeilingproductBidListItem {
    biedNr?: number;
    bedragPerFust?: number;
    aantalStuks?: number;
    gebruikerNr?: number;
}

export interface VeilingproductDetailDto {
    veilingProductNr?: number;
    naam?: string | null;
    geplaatstDatum?: string;
    fust?: number;
    voorraad?: number;
    startprijs?: number;
    minimumprijs?: number;
    plaats?: string | null;
    categorie?: string | null;
    veilingNr?: number | null;
    kwekernr?: number;
    beginDatum?: string;
    status?: boolean;
    imagePath?: string | null;
    biedingen?: VeilingproductBidListItem[] | null;
}
