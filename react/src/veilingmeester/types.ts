export type Status = "active" | "inactive" | "sold" | "deleted";

export const STATUS_LABEL: Record<Status, string> = {
    active: "Actief",
    inactive: "Inactief",
    sold: "Verkocht",
    deleted: "Geannuleerd",
};

export const STATUS_VARIANT: Record<Status, string> = {
    active: "bg-success-subtle text-success-emphasis border-success-subtle",
    inactive: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle",
    sold: "bg-info-subtle text-info-emphasis border-info-subtle",
    deleted: "bg-danger-subtle text-danger-emphasis border-danger-subtle",
};

export type ListResult<T> = {
    items: T[];
    totalResults?: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
};

export type UserDto = {
    gebruikerNr?: number;
    naam?: string;
    email?: string;
    soort?: string;
    status?: string;
    rollen?: string[];
    rol?: string;
    kvk?: string;
    laatstIngelogd?: string;
};

export type BidDto = {
    biedNr?: number;
    bedragPerFust?: number;
    aantalStuks?: number;
    gebruikerNr?: number;
    veilingNr?: number;
    status?: string;
    datum?: string;
};

export type AuctionProductSummaryDto = {
    veilingProductNr?: number;
    naam?: string;
    geplaatstDatum?: string;
    fust?: number;
    voorraad?: number;
    startprijs?: number;
    minimumprijs?: number;
    maximumprijs?: number;
    categorie?: string | null;
    categorieNr?: number;
    veilingNr?: number;
    plaats?: string | null;
    image?: string | null;
    kwekerNr?: number | null;
    begindatum?: string | null;
    einddatum?: string | null;
    status?: string | null;
    isDeleted?: boolean | null;
};

export type AuctionDto = {
    veilingNr?: number;
    titel?: string | null;
    begintijd?: string;
    eindtijd?: string;
    status?: string;
    minimumprijs?: number;
    maximumprijs?: number;
    producten?: AuctionProductSummaryDto[];
};

export type AuctionDetailDto = AuctionDto;

export type ProductDto = {
    veilingProductNr?: number;
    naam?: string;
    geplaatstDatum?: string;
    fust?: number;
    voorraad?: number;
    startprijs?: number;
    minimumprijs?: number;
    maximumprijs?: number;
    categorie?: string | null;
    categorieNr?: number | null;
    veilingNr?: number | null;
    plaats?: string | null;
    image?: string | null;
    kwekerNr?: number | null;
    begindatum?: string | null;
    einddatum?: string | null;
    status?: string | null;
    isDeleted?: boolean | null;
};

export type CategoryDto = {
    categorieNr?: number;
    naam?: string;
};

export type UserRow = {
    id: string;
    gebruikerNr?: number;
    naam: string;
    email: string;
    kvk: string;
    soort: string;
    soortLabel: string;
    status: Status;
    statusLabel: string;
    statusVariant: string;
};

export type UserBidRow = {
    id: string;
    biedNr?: number;
    veilingNr?: number;
    bedragPerFust: number;
    bedragLabel: string;
    aantalStuks: number;
    datumIso?: string;
    datumLabel: string;
    status: Status;
    statusLabel: string;
    statusVariant: string;
};

export type VeilingRow = {
    id: string;
    veilingNr?: number;
    titel: string;
    startIso?: string;
    startLabel: string;
    endIso?: string;
    endLabel: string;
    status: Status;
    statusLabel: string;
    statusVariant: string;
    minPrice: number;
    minLabel: string;
    maxPrice: number;
    maxLabel: string;
    productCount: number;
};

export type VeilingProductRow = {
    id: string;
    veilingProductNr?: number;
    naam: string;
    geplaatstIso?: string;
    geplaatstLabel: string;
    fust: number;
    voorraad: number;
    piecesPerBundle: number;
    categorie?: string;
    minPrice: number;
    minLabel: string;
    maxPrice: number;
    maxLabel: string;
    status: Status;
    statusLabel: string;
    statusVariant: string;
    isDeleted: boolean;
};

const currency = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const dateFormatter = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" });

export const collator = new Intl.Collator("nl-NL", { numeric: true, sensitivity: "base" });

export function formatCurrency(value: number | undefined | null): string {
    if (value == null || Number.isNaN(value)) {
        return "€ 0,00";
    }
    return currency.format(value);
}

export function formatDate(value: string | undefined | null): string {
    if (!value) return "-";
    const date = parseDate(value);
    return date ? dateFormatter.format(date) : "-";
}

export function formatDateTime(value: string | undefined | null): string {
    if (!value) return "-";
    const date = parseDate(value);
    return date ? dateTimeFormatter.format(date) : "-";
}

export function parseDate(value: string | undefined | null): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function buildQueryString(params: Record<string, unknown>): string {
    const search = new URLSearchParams();
    for (const [key, raw] of Object.entries(params)) {
        if (raw == null || raw === "") continue;
        if (typeof raw === "boolean") {
            if (!raw) continue;
            search.append(key, "true");
        } else {
            search.append(key, raw instanceof Date ? raw.toISOString() : String(raw));
        }
    }
    const query = search.toString();
    return query ? `?${query}` : "";
}

export function normalizeStatus(value: string | null | undefined): Status {
    const normalized = value?.trim().toLowerCase();
    switch (normalized) {
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

function sanitizeText(value: string | null | undefined): string {
    return value?.trim() ?? "";
}

function toNumber(value: number | string | null | undefined): number | undefined {
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number.parseFloat(value.replace(",", "."));
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function resolveMinPrice(auction: AuctionDto | AuctionDetailDto | undefined, product?: ProductDto | AuctionProductSummaryDto): number {
    const productMinimum = toNumber(product?.minimumprijs ?? product?.startprijs);
    const auctionMinimum = toNumber(auction?.minimumprijs);
    return productMinimum ?? auctionMinimum ?? 0;
}

function resolveMaxPrice(auction: AuctionDto | AuctionDetailDto | undefined, product?: ProductDto | AuctionProductSummaryDto): number {
    const productMax = toNumber(product?.maximumprijs ?? product?.startprijs);
    const auctionMax = toNumber((auction as AuctionDetailDto | undefined)?.maximumprijs);
    return auctionMax ?? productMax ?? resolveMinPrice(auction, product);
}

export function mapUserDtoToRow(dto: UserDto): UserRow {
    const status = normalizeStatus(dto.status);
    return {
        id: generateId(dto.gebruikerNr ?? dto.naam),
        gebruikerNr: dto.gebruikerNr,
        naam: sanitizeText(dto.naam) || "Onbekend",
        email: sanitizeText(dto.email) || "-",
        kvk: sanitizeText(dto.kvk) || "—",
        soort: sanitizeText(dto.soort) || "onbekend",
        soortLabel: sanitizeText(dto.soort) || "Onbekend",
        status,
        statusLabel: STATUS_LABEL[status],
        statusVariant: STATUS_VARIANT[status],
    };
}

export function mapBidDtoToRow(dto: BidDto): UserBidRow {
    const bedrag = toNumber(dto.bedragPerFust) ?? 0;
    const status = normalizeStatus(dto.status);
    return {
        id: generateId(dto.biedNr),
        biedNr: dto.biedNr,
        veilingNr: dto.veilingNr,
        bedragPerFust: bedrag,
        bedragLabel: formatCurrency(bedrag),
        aantalStuks: dto.aantalStuks ?? 0,
        datumIso: dto.datum,
        datumLabel: formatDateTime(dto.datum),
        status,
        statusLabel: STATUS_LABEL[status],
        statusVariant: STATUS_VARIANT[status],
    };
}

export function mapAuctionDtoToRow(dto: AuctionDto): VeilingRow {
    const status = normalizeStatus(dto.status);
    const start = dto.begintijd ?? undefined;
    const end = dto.eindtijd ?? undefined;
    const minPrice = resolveMinPrice(dto);
    const maxPrice = resolveMaxPrice(dto);
    return {
        id: generateId(dto.veilingNr),
        veilingNr: dto.veilingNr,
        titel: sanitizeText(dto.titel) || `Veiling ${dto.veilingNr ?? ""}`.trim(),
        startIso: start,
        startLabel: formatDateTime(start),
        endIso: end,
        endLabel: formatDateTime(end),
        status,
        statusLabel: STATUS_LABEL[status],
        statusVariant: STATUS_VARIANT[status],
        minPrice,
        minLabel: formatCurrency(minPrice),
        maxPrice,
        maxLabel: formatCurrency(maxPrice),
        productCount: dto.producten?.length ?? 0,
    };
}

export function mapProductDtoToRow(
    dto: ProductDto | AuctionProductSummaryDto,
    contextAuction?: AuctionDto | AuctionDetailDto,
): VeilingProductRow {
    const status = normalizeStatus(dto.status);
    const minPrice = resolveMinPrice(contextAuction, dto);
    const maxPrice = resolveMaxPrice(contextAuction, dto);
    const fust = dto.fust ?? 0;
    const voorraad = dto.voorraad ?? 0;
    const piecesPerBundle = fust > 0 ? Math.max(1, Math.floor(voorraad / fust)) : voorraad;
    return {
        id: generateId(dto.veilingProductNr ?? sanitizeText(dto.naam)),
        veilingProductNr: dto.veilingProductNr,
        naam: sanitizeText(dto.naam) || "Onbekend product",
        geplaatstIso: dto.geplaatstDatum ?? dto.begindatum ?? undefined,
        geplaatstLabel: formatDate(dto.geplaatstDatum ?? dto.begindatum ?? undefined),
        fust,
        voorraad,
        piecesPerBundle,
        categorie: sanitizeText(dto.categorie ?? ""),
        minPrice,
        minLabel: formatCurrency(minPrice),
        maxPrice,
        maxLabel: formatCurrency(maxPrice),
        status,
        statusLabel: STATUS_LABEL[status],
        statusVariant: STATUS_VARIANT[status],
        isDeleted: Boolean(dto.isDeleted) || status === "deleted",
    };
}

export function splitProducts(
    auction: AuctionDetailDto,
): { active: VeilingProductRow[]; inactive: VeilingProductRow[] } {
    const products = auction.producten ?? [];
    const mapped = products.map((product) => mapProductDtoToRow(product, auction));
    const active: VeilingProductRow[] = [];
    const inactive: VeilingProductRow[] = [];
    for (const product of mapped) {
        if (product.status === "active" && !product.isDeleted) {
            active.push(product);
        } else {
            inactive.push(product);
        }
    }
    return { active, inactive };
}

export type ClockState = {
    startPrice: number;
    endPrice: number;
    currentPrice: number;
    status: Status;
    endIso?: string;
    startIso?: string;
};

export function createClockState(auction: AuctionDetailDto): ClockState {
    const status = normalizeStatus(auction.status);
    const startPrice = resolveMaxPrice(auction);
    const endPrice = resolveMinPrice(auction);
    return {
        startPrice,
        endPrice,
        currentPrice: startPrice,
        status,
        endIso: auction.eindtijd,
        startIso: auction.begintijd,
    };
}

function generateId(seed: unknown): string {
    if (typeof seed === "number" || typeof seed === "string") {
        const value = String(seed);
        if (value.length > 0) return value;
    }
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `id-${Math.random().toString(36).slice(2, 11)}`;
}
