// Type definitions generated from the ASP.NET Core OpenAPI schemas.
// These follow the DTOs exposed by the backend and should stay in sync
// with swagger (OpenAPI 3.0.4).

// ---- Bieding DTO's ----
export interface BiedingCreateDto {
    BiedingNr: number;
    GebruikerNr: number;
    VeilingNr: number;
    VeilingproductNr: number;
    BedragPerFust: number;
    AantalStuks: number;
}

export interface BiedingUpdateDto {
    BedragPerFust: number;
    AantalStuks: number;
}

export interface VeilingMeester_BiedingDto {
    BiedingNr: number;
    GebruikerNr: number;
    VeilingNr: number;
    VeilingProductNr: number;
    BedragPerFust: number;
    AantalStuks: number;
}

// ---- Categorie DTO's ----
export interface CategorieCreateDto {
    Naam: string;
}

export interface CategorieUpdateDto {
    Naam: string;
}

export interface CategorieListDto {
    CategorieNr: number;
    Naam: string;
}

export interface CategorieDetailDto {
    CategorieNr: number;
    Naam: string;
}

// ---- Gebruiker DTO's ----
export interface GebruikerCreateDto {
    BedrijfsNaam: string;
    Email: string;
    Wachtwoord: string;
    LaatstIngelogd?: string;
    Soort: string;
    Kvk?: string | null;
    StraatAdres?: string | null;
    Postcode?: string | null;
}

export interface GebruikerUpdateDto {
    BedrijfsNaam: string;
    Email: string;
    Wachtwoord: string;
    LaatstIngelogd?: string;
    Soort: string;
    Kvk?: string | null;
    StraatAdres?: string | null;
    Postcode?: string | null;
}

export interface Klant_GebruikerDto {
    GebruikerNr: number;
    BedrijfsNaam: string;
    Email: string;
    Wachtwoord: string;
    LaatstIngelogd?: string;
    Soort: string;
    Kvk?: string | null;
    StraatAdres?: string | null;
    Postcode?: string | null;
    Biedingen: VeilingMeester_BiedingDto[];
}

// ---- Veiling DTO's ----
export interface VeilingCreateDto {
    VeilingNaam: string;
    Begintijd: string;
    Eindtijd: string;
    Status?: string;
}

export interface VeilingUpdateDto {
    VeilingNaam: string;
    Begintijd: string;
    Eindtijd: string;
}

export interface VeilingMeester_VeilingDto {
    VeilingNr?: number;
    VeilingNaam: string;
    Begintijd: string;
    Eindtijd: string;
    Status: string;
    Producten: VeilingProductDto[];
    Biedingen: VeilingMeester_BiedingDto[];
}

export interface VeilingProductDto {
    VeilingProductNr: number;
    Naam: string;
    Startprijs: number;
    Voorraad: number;
    ImagePath: string;
}

// ---- Veilingproduct DTO's ----
export interface VeilingproductCreateDto {
    Naam: string;
    GeplaatstDatum?: string | null;
    Fust: number;
    Voorraad: number;
    Startprijs: number;
    CategorieNr: number;
    VeilingNr?: number | null;
    Plaats: string;
    Minimumprijs: number;
    Kwekernr: number;
    BeginDatum: string;
    Status: boolean;
    ImagePath: string;
}

export interface VeilingproductUpdateDto {
    Naam: string;
    GeplaatstDatum?: string | null;
    Fust: number;
    Voorraad: number;
    Startprijs: number;
    CategorieNr: number;
    VeilingNr?: number | null;
    Kwekernr: number;
    Plaats: string;
    Minimumprijs: number;
    BeginDatum: string;
    Status: boolean;
    ImagePath: string;
}

export interface VeilingproductListDto {
    VeilingProductNr: number;
    Naam: string;
    GeplaatstDatum: string;
    Fust: number;
    Voorraad: number;
    Startprijs: number;
    Minimumprijs: number;
    Plaats: string;
    Categorie?: string | null;
    VeilingNr?: number | null;
    Kwekernr: number;
    BeginDatum: string;
    Status: boolean;
    ImagePath: string;
}

export interface VeilingproductBidListItem {
    BiedNr: number;
    BedragPerFust: number;
    AantalStuks: number;
    GebruikerNr: number;
}

export interface VeilingproductDetailDto {
    VeilingProductNr: number;
    Naam: string;
    GeplaatstDatum: string;
    Fust: number;
    Voorraad: number;
    Startprijs: number;
    Minimumprijs: number;
    Plaats: string;
    Categorie?: string | null;
    VeilingNr?: number | null;
    Kwekernr: number;
    BeginDatum: string;
    Status: boolean;
    ImagePath: string;
    Biedingen: VeilingproductBidListItem[];
}

// ---- helpers ----
export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount?: number;
}

export type StatusLabel = "active" | "inactive" | "sold" | "unknown";
