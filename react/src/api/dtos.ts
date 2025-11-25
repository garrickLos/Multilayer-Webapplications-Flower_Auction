// Shared API DTO definitions based on the ASP.NET Core Web API models.
// This file is framework-agnostic so other React sections can reuse the same types.

// Categorie DTO's
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

// Bieding DTO's
export interface BiedingBaseAmountDto {
    BedragPerFust: number;
    AantalStuks: number;
}

export interface BiedingCreateDto extends BiedingBaseAmountDto {
    BiedingNr: number;
    GebruikerNr: number;
    VeilingNr: number;
    VeilingproductNr: number;
}

export interface BiedingUpdateDto extends BiedingBaseAmountDto {}

export interface VeilingMeester_BiedingDto extends BiedingBaseAmountDto {
    BiedingNr: number;
    GebruikerNr: number;
    VeilingNr: number;
    VeilingProductNr: number;
}

// Gebruiker DTO's
export interface BaseGebruiker {
    BedrijfsNaam: string;
    Email: string;
    Wachtwoord: string;
    LaatstIngelogd?: string | null;
    Soort: string;
    Kvk?: string | null;
    StraatAdres?: string | null;
    Postcode?: string | null;
}

export interface GebruikerCreateDto extends BaseGebruiker {}

export interface GebruikerUpdateDto extends BaseGebruiker {}

export interface Klant_GebruikerDto extends BaseGebruiker {
    GebruikerNr: number;
    Biedingen: VeilingMeester_BiedingDto[];
}

// Veiling DTO's
export interface BaseVeilingDto {
    VeilingNaam: string;
    Begintijd: string;
    Eindtijd: string;
}

export interface Klant_VeilingDto extends BaseVeilingDto {
    VeilingNr?: number | null;
    Status: string;
    Producten: VeilingProductDto[];
}

export interface VeilingCreateDto extends BaseVeilingDto {
    Status: string;
}

export interface VeilingUpdateDto extends BaseVeilingDto {}

export interface VeilingMeester_VeilingDto extends BaseVeilingDto {
    Status: string;
    VeilingNr?: number | null;
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

// Veilingproduct DTO's
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
    Plaats: string;
    Minimumprijs: number;
    Kwekernr: number;
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
