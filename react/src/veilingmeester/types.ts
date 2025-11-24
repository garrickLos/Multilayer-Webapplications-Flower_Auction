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
export type VeilingDetailDto = VeilingDto & { beschrijving?: string; titel?: string };
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
    readonly status: UiStatus;
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

/** Alias for realtime auction rows. */
export type VeilingRow = Auction;

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
    readonly status?: UiStatus;
    readonly date?: string;
}

/** Dashboard counters for live statistics. */
export type ModalState =
    | { key: "newAuction" }
    | { key: "linkProducts"; auctionId: number }
    | { key: "editUser"; userId: number }
    | { key: "userBids"; userId: number }
    | { key: "userProducts"; userId: number };

export const roleLabels: Record<UserRole, string> = {
    Koper: "Koper",
    Kweker: "Kweker",
    Veilingmeester: "Veilingmeester",
    Admin: "Admin",
    Onbekend: "Onbekend",
};

// ---- adapters & factories ----

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

/** Mapper responsible for translating DTOs into domain models. */
export class DomainMapper {
    static mapBid(dto: VeilingMeester_BiedingDto): Bid {
        return {
            id: dto.biedingNr,
            auctionId: dto.veilingNr,
            productId: dto.veilingProductNr,
            userId: dto.gebruikerNr,
            amount: dto.bedragPerFust,
            quantity: dto.aantalStuks,
            status: "active",
        } satisfies Bid;
    }

    static mapProduct(dto: VeilingProductDto): Product {
        const linkedAuctionId = dto.veilingNr || undefined;
        const status: ProductStatus = dto.voorraad <= 0 ? "Uitverkocht" : linkedAuctionId ? "Gekoppeld" : "Beschikbaar";

        return {
            id: dto.veilingProductNr,
            name: dto.naam ?? "Onbekend product",
            status,
            category: dto.categorie ?? "Onbekend",
            startPrice: dto.startprijs,
            stock: dto.voorraad,
            fust: dto.fust,
            veilingNr: linkedAuctionId,
            linkedAuctionId,
            growerId: dto.kwekerNr,
            imagePath: dto.imagePath,
        } satisfies Product;
    }

    static mapUser(dto: GebruikerDto): User {
        return {
            id: dto.gebruikerNr,
            name: dto.bedrijfsNaam || dto.email,
            email: dto.email,
            role: toRole(dto.soort),
            status: "active",
            lastLogin: dto.laatstIngelogd,
            kvk: dto.kvk,
            address: dto.straatAdres ? `${dto.straatAdres}${dto.postcode ? `, ${dto.postcode}` : ""}` : undefined,
            bids: dto.biedingen?.map(DomainMapper.mapBid),
        } satisfies User;
    }

    static mapAuction(dto: VeilingDto | VeilingDetailDto): Auction {
        const products = dto.producten?.map(DomainMapper.mapProduct);
        const bids = dto.biedingen?.map(DomainMapper.mapBid);

        const startPrices = products?.map((product) => product.startPrice) ?? dto.producten?.map((product) => product.startprijs);
        const minPrice = startPrices && startPrices.length > 0 ? Math.min(...startPrices) : undefined;
        const maxPrice = startPrices && startPrices.length > 0 ? Math.max(...startPrices) : undefined;

        return {
            id: dto.veilingNr,
            title: (dto as VeilingDetailDto).titel ?? dto.veilingNaam,
            startDate: dto.begintijd,
            endDate: dto.eindtijd,
            status: toUiStatus(dto.status),
            rawStatus: dto.status as AuctionStatus | undefined,
            minPrice,
            maxPrice,
            linkedProductIds: products?.map((product) => product.id),
            products,
            bids,
        } satisfies Auction;
    }

    static mapCategory(dto: { categorieNr: number; categorieNaam: string }): Category {
        return { id: dto.categorieNr, name: dto.categorieNaam } satisfies Category;
    }
}
