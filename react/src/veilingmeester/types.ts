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
    readonly veilingNr?: number;
    readonly bedragPerFust: number;
    readonly aantalStuks: number;
    readonly datumIso?: string;
    readonly status: Status;
}

export interface VeilingRow {
    readonly id: number;
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
    readonly setPage: (value: number | ((prev: number) => number)) => void;
    readonly pageSize: number;
    readonly setPageSize: (value: number) => void;
    readonly hasNext: boolean;
    readonly totalResults?: number;
}

export const nlCollator = new Intl.Collator("nl-NL", { numeric: true, sensitivity: "base" });

const STATUS_LABEL: Record<Status, string> = {
    active: "Actief",
    inactive: "Inactief",
    sold: "Verkocht",
    deleted: "Geannuleerd",
};

const STATUS_CLASS: Record<Status, string> = {
    active: "text-bg-success",
    inactive: "text-bg-secondary",
    sold: "text-bg-info",
    deleted: "text-bg-danger",
};

const STATUS_MAP: Record<string, Status> = {
    active: "active",
    actief: "active",
    sold: "sold",
    verkocht: "sold",
    deleted: "deleted",
    geannuleerd: "deleted",
    cancelled: "deleted",
};

const clean = (value: string | null | undefined): string => value?.trim() ?? "";
const knownSoorten = ["koper", "kweker", "veilingmeester"] as const;
const isSoort = (value: string): value is Soort => (knownSoorten as readonly string[]).includes(value);

export const normalizeStatus = (value: string | null | undefined): Status => {
    const key = clean(value).toLowerCase();
    return STATUS_MAP[key] ?? "inactive";
};

const toNumber = (value: number | string | null | undefined): number | undefined => {
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number.parseFloat(value.replace(",", "."));
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

export const adaptPrice = (
    auction: VeilingDto | VeilingDetailDto | null | undefined,
    product?: VeilingproductDto | null,
): { minPrice: number; maxPrice: number } => {
    const auctionMin = toNumber(auction?.minimumprijs);
    const auctionMax = toNumber(auction?.maximumprijs);
    const productMin = toNumber(product?.minimumprijs ?? product?.startprijs);
    const productMax = toNumber(product?.maximumprijs);
    const minPrice = productMin ?? auctionMin ?? 0;
    const maxPrice = auctionMax ?? productMax ?? minPrice;
    return { minPrice, maxPrice };
};

export const adaptUser = (dto: GebruikerDto): UserRow => {
    const id = dto.gebruikerNr ?? 0;
    const soort = isSoort(clean(dto.soort).toLowerCase()) ? (clean(dto.soort).toLowerCase() as Soort) : "onbekend";
    return {
        id,
        naam: clean(dto.naam) || `Gebruiker ${id}`,
        email: clean(dto.email) || "",
        kvk: clean(dto.kvk) || null,
        soort,
        status: normalizeStatus(dto.status),
    };
};

export const adaptBid = (dto: BiedingDto): UserBidRow => ({
    id: dto.biedNr ?? 0,
    veilingNr: dto.veilingNr,
    bedragPerFust: toNumber(dto.bedragPerFust) ?? 0,
    aantalStuks: dto.aantalStuks ?? 0,
    datumIso: dto.datum ?? undefined,
    status: normalizeStatus(dto.status),
});

export const adaptAuction = (dto: VeilingDto): VeilingRow => {
    const id = dto.veilingNr ?? 0;
    const { minPrice, maxPrice } = adaptPrice(dto);
    return {
        id,
        titel: clean(dto.veilingnaam ?? dto.titel) || `Veiling ${id}`,
        startIso: dto.begintijd ?? undefined,
        endIso: dto.eindtijd ?? undefined,
        status: normalizeStatus(dto.status),
        minPrice,
        maxPrice,
        productCount: dto.producten?.length ?? 0,
    };
};

export const adaptProduct = (dto: VeilingproductDto, context?: VeilingDto | VeilingDetailDto | null): VeilingProductRow => {
    const id = dto.veilingProductNr ?? 0;
    const { minPrice, maxPrice } = adaptPrice(context, dto);
    const voorraad = dto.voorraad ?? undefined;
    const fust = dto.fust ?? undefined;
    const piecesPerBundle = voorraad && fust ? Math.floor(voorraad / fust) : undefined;

    return {
        id,
        naam: clean(dto.naam) || `Product ${id}`,
        voorraad,
        fust,
        piecesPerBundle,
        minPrice,
        maxPrice,
        status: normalizeStatus(dto.status),
        image: dto.image ?? null,
        isDeleted: Boolean(dto.isDeleted),
        categorie: clean(dto.categorie),
    };
};

export const splitProducts = (
    auction: VeilingDetailDto,
): { active: readonly VeilingProductRow[]; inactive: readonly VeilingProductRow[] } => {
    const rows = (auction.producten ?? []).map((p) => adaptProduct(p, auction));
    return {
        active: rows.filter((r) => r.status === "active" && !r.isDeleted),
        inactive: rows.filter((r) => r.status !== "active" || r.isDeleted),
    };
};

export const statusLabel = (status: Status): string => STATUS_LABEL[status];
export const statusBadgeVariant = (status: Status): string => STATUS_CLASS[status];
