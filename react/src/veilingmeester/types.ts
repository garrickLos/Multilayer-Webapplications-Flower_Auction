import type { Dispatch, SetStateAction } from "react";

export type Status = "active" | "inactive" | "sold" | "deleted";

export type Soort = "koper" | "kweker" | "veilingmeester" | "onbekend";

export interface PaginatedList<T> {
    readonly items: readonly T[];
    readonly page: number;
    readonly pageSize: number;
    readonly hasNext: boolean;
    readonly totalResults?: number;
}

export interface GebruikerDto {
    gebruikerNr?: number;
    naam?: string | null;
    email?: string | null;
    soort?: string | null;
    status?: string | null;
    kvk?: string | null;
    rollen?: readonly string[] | null;
}

export interface BiedingDto {
    biedNr?: number;
    gebruikerNr?: number;
    veilingNr?: number;
    bedragPerFust?: number;
    aantalStuks?: number;
    status?: string | null;
    datum?: string | null;
}

export interface VeilingDto {
    veilingNr?: number;
    titel?: string | null;
    begintijd?: string | null;
    eindtijd?: string | null;
    status?: string | null;
    minimumprijs?: number | string | null;
    maximumprijs?: number | string | null;
    veilingnaam?: string | null;
    producten?: readonly VeilingproductDto[] | null;
}

export type VeilingDetailDto = VeilingDto;

export interface VeilingproductDto {
    veilingProductNr?: number;
    naam?: string | null;
    startprijs?: number | string | null;
    minimumprijs?: number | string | null;
    maximumprijs?: number | string | null;
    voorraad?: number | null;
    fust?: number | null;
    categorie?: string | null;
    categorieNr?: number | null;
    kwekerNr?: number | string | null;
    begindatum?: string | null;
    einddatum?: string | null;
    plaats?: string | null;
    image?: string | null;
    status?: string | null;
    isDeleted?: boolean | null;
}

export interface CategorieDto {
    categorieNr?: number;
    naam?: string | null;
}

export type GList = PaginatedList<GebruikerDto>;
export type BList = PaginatedList<BiedingDto>;
export type VList = PaginatedList<VeilingDto>;
export type VpList = PaginatedList<VeilingproductDto>;
export type CList = PaginatedList<CategorieDto>;

export interface UserRow {
    readonly id: number;
    readonly naam: string;
    readonly email: string;
    readonly kvk: string | null;
    readonly soort: Soort;
    readonly status: Status;
}

export interface UserBidRow {
    readonly id: number;
    readonly biedNr?: number;
    readonly veilingNr?: number;
    readonly bedragPerFust: number;
    readonly aantalStuks: number;
    readonly datumIso?: string;
    readonly status: Status;
}

export interface VeilingRow {
    readonly id: number;
    readonly veilingNr?: number;
    readonly titel: string;
    readonly startIso?: string;
    readonly endIso?: string;
    readonly status: Status;
    readonly minPrice: number;
    readonly maxPrice: number;
    readonly productCount: number;
}

export interface VeilingProductRow {
    readonly id: number;
    readonly veilingProductNr?: number;
    readonly naam: string;
    readonly voorraad?: number;
    readonly fust?: number;
    readonly piecesPerBundle?: number;
    readonly minPrice: number;
    readonly maxPrice: number;
    readonly status: Status;
    readonly image?: string | null;
    readonly isDeleted: boolean;
    readonly categorie?: string;
}

export interface HookResult<T> {
    readonly rows: readonly T[];
    readonly loading: boolean;
    readonly error?: string | null;
    readonly page: number;
    readonly setPage: Dispatch<SetStateAction<number>>;
    readonly pageSize: number;
    readonly setPageSize: Dispatch<SetStateAction<number>>;
    readonly hasNext: boolean;
    readonly totalResults?: number;
    readonly search?: string;
    readonly setSearch?: (value: string) => void;
    readonly status?: "alle" | "actief" | "inactief";
    readonly setStatus?: (value: "alle" | "actief" | "inactief") => void;
    readonly from?: string;
    readonly setFrom?: (value: string) => void;
    readonly to?: string;
    readonly setTo?: (value: string) => void;
    readonly reset?: () => void;
}

export const nlCollator = new Intl.Collator("nl-NL", { numeric: true, sensitivity: "base" });

const knownSoorten: readonly Soort[] = ["koper", "kweker", "veilingmeester"] as const;

function sanitizeText(value: string | null | undefined): string {
    return value?.trim() ?? "";
}

function toNumber(value: number | string | null | undefined): number | undefined {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        const normalised = value.replace(",", ".");
        const parsed = Number.parseFloat(normalised);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

export function normalizeStatus(value: string | null | undefined): Status {
    const raw = sanitizeText(value).toLowerCase();
    switch (raw) {
        case "active":
        case "actief":
            return "active";
        case "sold":
        case "verkocht":
            return "sold";
        case "deleted":
        case "geannuleerd":
        case "cancelled":
            return "deleted";
        default:
            return "inactive";
    }
}

export function statusLabel(status: Status): "Actief" | "Inactief" | "Verkocht" | "Geannuleerd" {
    switch (status) {
        case "active":
            return "Actief";
        case "sold":
            return "Verkocht";
        case "deleted":
            return "Geannuleerd";
        default:
            return "Inactief";
    }
}

export function statusBadgeVariant(status: Status): string {
    switch (status) {
        case "active":
            return "text-bg-success";
        case "sold":
            return "text-bg-info";
        case "deleted":
            return "text-bg-danger";
        default:
            return "text-bg-secondary";
    }
}

export function adaptPrice(
    auction: VeilingDto | VeilingDetailDto | null | undefined,
    product?: VeilingproductDto | null,
): { minPrice: number; maxPrice: number } {
    const productMin = toNumber(product?.minimumprijs ?? product?.startprijs);
    const productMax = toNumber(product?.maximumprijs ?? product?.startprijs);
    const auctionMin = toNumber(auction?.minimumprijs);
    const auctionMax = toNumber(auction?.maximumprijs);
    const minPrice = productMin ?? auctionMin ?? 0;
    const maxPrice = auctionMax ?? productMax ?? minPrice;
    return { minPrice, maxPrice };
}

export function adaptUser(dto: GebruikerDto): UserRow {
    const id = dto.gebruikerNr ?? 0;
    const soortRaw = sanitizeText(dto.soort).toLowerCase();
    const soort = (knownSoorten.find((value) => value === soortRaw) ?? "onbekend") satisfies Soort;
    return {
        id,
        naam: sanitizeText(dto.naam) || `Gebruiker ${id}`,
        email: sanitizeText(dto.email) || "",
        kvk: sanitizeText(dto.kvk) || null,
        soort,
        status: normalizeStatus(dto.status),
    };
}

export function adaptBid(dto: BiedingDto): UserBidRow {
    return {
        id: dto.biedNr ?? 0,
        biedNr: dto.biedNr,
        veilingNr: dto.veilingNr,
        bedragPerFust: toNumber(dto.bedragPerFust) ?? 0,
        aantalStuks: dto.aantalStuks ?? 0,
        datumIso: dto.datum ?? undefined,
        status: normalizeStatus(dto.status),
    };
}

export function adaptAuction(dto: VeilingDto): VeilingRow {
    const id = dto.veilingNr ?? 0;
    const title = sanitizeText(dto.veilingnaam ?? dto.titel);
    const { minPrice, maxPrice } = adaptPrice(dto);
    return {
        id,
        veilingNr: dto.veilingNr,
        titel: title || `Veiling ${id}`,
        startIso: dto.begintijd ?? undefined,
        endIso: dto.eindtijd ?? undefined,
        status: normalizeStatus(dto.status),
        minPrice,
        maxPrice,
        productCount: dto.producten?.length ?? 0,
    };
}

export function adaptProduct(
    dto: VeilingproductDto,
    context?: VeilingDto | VeilingDetailDto | null,
): VeilingProductRow {
    const id = dto.veilingProductNr ?? 0;
    const { minPrice, maxPrice } = adaptPrice(context, dto);
    const voorraad = dto.voorraad ?? undefined;
    const fust = dto.fust ?? undefined;
    const piecesPerBundle =
        voorraad != null && fust != null && voorraad > 0 && fust > 0
            ? Math.floor(voorraad / fust)
            : undefined;
    return {
        id,
        veilingProductNr: dto.veilingProductNr,
        naam: sanitizeText(dto.naam) || `Product ${id}`,
        voorraad,
        fust,
        piecesPerBundle,
        minPrice,
        maxPrice,
        status: normalizeStatus(dto.status),
        image: dto.image ?? null,
        isDeleted: Boolean(dto.isDeleted),
        categorie: sanitizeText(dto.categorie),
    };
}

export function splitProducts(
    auction: VeilingDetailDto,
): { active: readonly VeilingProductRow[]; inactive: readonly VeilingProductRow[] } {
    const rows = (auction.producten ?? []).map((product) => adaptProduct(product, auction));
    const active = rows.filter((row) => row.status === "active" && !row.isDeleted);
    const inactive = rows.filter((row) => row.status !== "active" || row.isDeleted);
    return { active, inactive };
}

