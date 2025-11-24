/**
 * Domain types for the Veilingmeester dashboard.
 * These types mirror backend DTOs and provide UI-friendly models.
 */

// ---- shared unions ----

/** Lifecycle of an auction as delivered by the API. */
export type AuctionStatus = "NogNietGestart" | "Actief" | "Afgesloten" | "Verkocht" | "Geannuleerd";

/** Lifecycle of a product derived from stock and linkage. */
export type ProductStatus = "Beschikbaar" | "Gekoppeld" | "Uitverkocht";

/** Supported user roles. */
export type UserRole = "Koper" | "Kweker" | "Veilingmeester" | "Admin" | "Onbekend";

/** Presentational status token used by badges. */
export type UiStatus = "active" | "inactive" | "sold" | "deleted";
export type Status = UiStatus;

/** Basic paginated list returned by API helpers. */
export interface PaginatedList<T> {
    readonly items: readonly T[];
    readonly page: number;
    readonly pageSize: number;
    readonly hasNext: boolean;
    readonly totalResults?: number;
}

/** Category metadata for filters and display. */
export interface Category {
    readonly id: number;
    readonly name: string;
}

// ---- API DTOs ----

/** Raw gebruiker payload from the backend. */
export interface GebruikerDto {
    gebruikerNr: number;
    bedrijfsNaam: string;
    email: string;
    soort: string;
    laatstIngelogd?: string;
    kvk?: string;
    straatAdres?: string;
    postcode?: string;
    biedingen?: VeilingMeester_BiedingDto[];
}

export type GebruikerUpdateDto = Partial<
    Pick<GebruikerDto, "bedrijfsNaam" | "email" | "soort" | "straatAdres" | "postcode" | "kvk"> & { wachtwoord?: string }
>;

/** Raw veiling payload from the backend. */
export interface VeilingDto {
    veilingNr: number;
    veilingNaam: string;
    begintijd: string;
    eindtijd: string;
    status?: AuctionStatus | string;
    producten?: VeilingProductDto[];
    biedingen?: VeilingMeester_BiedingDto[];
}

export type VeilingCreateDto = Pick<VeilingDto, "veilingNaam" | "begintijd" | "eindtijd"> & { status?: AuctionStatus };
export type VeilingDetailDto = VeilingDto & { beschrijving?: string };
export type VeilingUpdateDto = Partial<Pick<VeilingDto, "veilingNaam" | "begintijd" | "eindtijd" | "status">> & {
    beschrijving?: string;
};

/** Raw product payload from the backend. */
export interface VeilingProductDto {
    veilingProductNr: number;
    naam?: string;
    geplaatstDatum: string;
    fust: number;
    voorraad: number;
    startprijs: number;
    categorie?: string;
    veilingNr: number;
    imagePath?: string;
    kwekerNr?: number;
}

export type VeilingproductUpdateDto = Partial<
    Pick<VeilingProductDto, "naam" | "startprijs" | "voorraad" | "categorie" | "veilingNr" | "imagePath">
>;

/** Raw bieding payload from the backend. */
export interface VeilingMeester_BiedingDto {
    biedingNr: number;
    veilingNr: number;
    veilingProductNr: number;
    gebruikerNr: number;
    bedragPerFust: number;
    aantalStuks: number;
}

export type BiedingCreateDto = Omit<VeilingMeester_BiedingDto, "biedingNr">;
export type BiedingUpdateDto = Partial<BiedingCreateDto>;

// ---- Domain models used in the UI ----

/** Simplified user model consumed by UI components. */
export interface User {
    readonly id: number;
    readonly name: string;
    readonly email: string;
    readonly role: UserRole;
    readonly lastLogin?: string;
    readonly kvk?: string;
    readonly address?: string;
    readonly bids?: readonly Bid[];
}

/** Auction enriched with derived fields. */
export interface Auction {
    readonly id: number;
    readonly title: string;
    readonly status: UiStatus;
    readonly rawStatus?: AuctionStatus;
    readonly startDate: string;
    readonly endDate: string;
    readonly minPrice?: number;
    readonly maxPrice?: number;
    readonly linkedProductIds?: readonly number[];
    readonly products?: readonly Product[];
    readonly bids?: readonly Bid[];
}

/** Product shown in auction/product screens. */
export interface Product {
    readonly id: number;
    readonly name: string;
    readonly status: ProductStatus;
    readonly category: string;
    readonly startPrice: number;
    readonly stock: number;
    readonly fust: number;
    readonly veilingNr?: number;
    readonly growerId?: number;
    readonly imagePath?: string;
    readonly linkedAuctionId?: number;
}

/** Bid information mapped to UI friendly shape. */
export interface Bid {
    readonly id: number;
    readonly userId: number;
    readonly auctionId: number;
    readonly productId: number;
    readonly amount: number;
    readonly quantity: number;
}

/** Dashboard counters for live statistics. */
export interface DashboardStats {
    readonly activeAuctions: number;
    readonly activeProducts: number;
    readonly activeUsers: number;
    readonly bidsToday: number;
}

export type ModalKey = "newAuction" | "linkProducts" | "editUser" | "userBids" | "userProducts";

export type ModalState =
    | { key: "newAuction" }
    | { key: "linkProducts"; auctionId: number }
    | { key: "editUser"; userId: number }
    | { key: "userBids"; userId: number }
    | { key: "userProducts"; userId: number };

export type FilterState<T> = { readonly search: string; readonly filters: T };

// ---- label helpers ----

export const statusLabels: Record<UiStatus, string> = {
    active: "Actief",
    inactive: "Inactief",
    sold: "Verkocht",
    deleted: "Geannuleerd",
};

export const roleLabels: Record<UserRole, string> = {
    Koper: "Koper",
    Kweker: "Kweker",
    Veilingmeester: "Veilingmeester",
    Admin: "Admin",
    Onbekend: "Onbekend",
};

// ---- adapters ----

/** Map API status strings to UI friendly values. */
export const toUiStatus = (value?: AuctionStatus | string | null): UiStatus => {
    const normalised = (value ?? "").toLowerCase();
    if (normalised === "actief" || normalised === "active") return "active";
    if (normalised === "verkocht" || normalised === "afgesloten") return "sold";
    if (normalised === "geannuleerd") return "deleted";
    return "inactive";
};

/** Normalize role coming from API into a controlled union. */
export const toRole = (value?: string | null): UserRole => {
    const normalised = (value ?? "").toLowerCase();
    if (normalised === "admin") return "Admin";
    if (normalised === "veilingmeester") return "Veilingmeester";
    if (normalised === "kweker" || normalised === "grower") return "Kweker";
    if (normalised === "koper" || normalised === "buyer") return "Koper";
    return "Onbekend";
};

/** Adapt bieding DTO to UI model. */
export const adaptBid = (dto: VeilingMeester_BiedingDto): Bid => ({
    id: dto.biedingNr,
    auctionId: dto.veilingNr,
    productId: dto.veilingProductNr,
    userId: dto.gebruikerNr,
    amount: dto.bedragPerFust,
    quantity: dto.aantalStuks,
});

/** Adapt product DTO to UI model. */
export const adaptProduct = (dto: VeilingProductDto): Product => ({
    id: dto.veilingProductNr,
    name: dto.naam ?? "Onbekend product",
    status: dto.voorraad <= 0 ? "Uitverkocht" : dto.veilingNr ? "Gekoppeld" : "Beschikbaar",
    category: dto.categorie ?? "Onbekend",
    startPrice: dto.startprijs,
    stock: dto.voorraad,
    fust: dto.fust,
    veilingNr: dto.veilingNr || undefined,
    linkedAuctionId: dto.veilingNr || undefined,
    growerId: dto.kwekerNr,
    imagePath: dto.imagePath,
});

/** Adapt gebruiker DTO to UI model. */
export const adaptUser = (dto: GebruikerDto): User => ({
    id: dto.gebruikerNr,
    name: dto.bedrijfsNaam || dto.email,
    email: dto.email,
    role: toRole(dto.soort),
    lastLogin: dto.laatstIngelogd,
    kvk: dto.kvk,
    address: dto.straatAdres ? `${dto.straatAdres}${dto.postcode ? `, ${dto.postcode}` : ""}` : undefined,
    bids: dto.biedingen?.map(adaptBid),
});

/** Adapt veiling DTO to UI model. */
export const adaptAuction = (dto: VeilingDto): Auction => ({
    id: dto.veilingNr,
    title: dto.veilingNaam,
    startDate: dto.begintijd,
    endDate: dto.eindtijd,
    status: toUiStatus(dto.status),
    rawStatus: dto.status as AuctionStatus | undefined,
    minPrice: dto.producten && dto.producten.length > 0 ? Math.min(...dto.producten.map((product) => product.startprijs)) : undefined,
    maxPrice: dto.producten && dto.producten.length > 0 ? Math.max(...dto.producten.map((product) => product.startprijs)) : undefined,
    linkedProductIds: dto.producten?.map((product) => product.veilingProductNr),
    products: dto.producten?.map(adaptProduct),
    bids: dto.biedingen?.map(adaptBid),
});
