import {
    type BiedingCreateDto,
    type BiedingUpdateDto,
    type VeilingCreateDto,
    type VeilingUpdateDto,
    type VeilingproductBidListItem,
} from "./apiTypes";
import type {
    CategorieDetailDto,
    CategorieListDto,
    GebruikerAuctionViewDto,
    ModelStatus,
    VeilingMeester_BiedingDto,
    VeilingMeester_VeilingDto,
    VeilingProductDto,
    VeilingproductVeilingmeesterDetailDto,
    VeilingproductVeilingmeesterListDto,
} from "./apiTypes";

/**
 * Domain types for the Veilingmeester dashboard.
 * These types mirror backend DTOs and provide UI-friendly models.
 */

export type AuctionStatus = "NogNietGestart" | "Actief" | "Afgesloten" | "Verkocht" | "Geannuleerd";
export type ProductStatus = ModelStatus;
export type UserRole = "Koper" | "Kweker" | "Veilingmeester" | "Admin" | "Onbekend";
export type UiStatus = "active" | "inactive" | "sold" | "deleted";
export type Status = UiStatus;

export interface PaginatedList<T> {
    readonly items: readonly T[];
    readonly page: number;
    readonly pageSize: number;
    readonly hasNext: boolean;
    readonly totalResults?: number;
}

export interface Category {
    readonly id: number;
    readonly name: string;
}

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

export interface Auction {
    readonly id: number;
    readonly title: string;
    readonly status: UiStatus;
    readonly rawStatus?: AuctionStatus | string;
    readonly startDate: string;
    readonly endDate: string;
    readonly minPrice?: number;
    readonly maxPrice?: number;
    readonly linkedProductIds?: readonly number[];
    readonly products?: readonly Product[];
    readonly bids?: readonly Bid[];
}

export type VeilingRow = Auction;

export interface Product {
    readonly id: number;
    readonly name: string;
    readonly status: ProductStatus;
    readonly category?: string | null;
    readonly startPrice?: number | null;
    readonly minimumPrice: number;
    readonly stock?: number;
    readonly fust?: number;
    readonly veilingNr?: number;
    readonly growerId?: number;
    readonly sellerName?: string;
    readonly imagePath?: string;
    readonly linkedAuctionId?: number;
    readonly location?: string;
    readonly active?: boolean;
    readonly bids?: readonly BidSummary[];
}

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

export interface BidSummary {
    readonly id: number;
    readonly amount: number;
    readonly quantity: number;
    readonly userId: number;
}

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

export const toUiStatus = (value?: AuctionStatus | string | null): UiStatus => {
    const normalised = (value ?? "").toLowerCase();
    if (normalised === "actief" || normalised === "active") return "active";
    if (normalised === "verkocht" || normalised === "afgesloten") return "sold";
    if (normalised === "geannuleerd") return "deleted";
    return "inactive";
};

export const toRole = (value?: string | null): UserRole => {
    const normalised = (value ?? "").toLowerCase();
    if (normalised === "admin") return "Admin";
    if (normalised === "veilingmeester") return "Veilingmeester";
    if (normalised === "kweker" || normalised === "grower") return "Kweker";
    if (normalised === "koper" || normalised === "buyer") return "Koper";
    return "Onbekend";
};

export class DomainMapper {
    static mapBid(dto: VeilingMeester_BiedingDto): Bid {
        return {
            id: dto.biedingNr,
            auctionId: dto.veilingNr,
            productId: dto.veilingProductNr,
            userId: dto.gebruikerNr,
            amount: dto.bedragPerFust ?? 0,
            quantity: dto.aantalStuks ?? 0,
            status: "active",
        } satisfies Bid;
    }

    static mapProduct(dto: VeilingproductVeilingmeesterListDto | VeilingproductVeilingmeesterDetailDto | VeilingProductDto): Product {
        const linkedAuctionId = "veilingNr" in dto ? dto.veilingNr ?? undefined : undefined;
        const stock = "voorraadBloemen" in dto ? dto.voorraadBloemen : undefined;

        return {
            id: dto.veilingProductNr,
            name: dto.naam ?? "Onbekend product",
            status: "status" in dto && dto.status ? dto.status : "Inactive",
            category: "categorieNaam" in dto ? dto.categorieNaam : undefined,
            startPrice: "startprijs" in dto ? dto.startprijs ?? undefined : undefined,
            minimumPrice: "minimumprijs" in dto ? dto.minimumprijs ?? 0 : 0,
            stock,
            fust: "aantalFusten" in dto ? dto.aantalFusten : undefined,
            veilingNr: linkedAuctionId,
            linkedAuctionId,
            growerId: "kwekernr" in dto ? dto.kwekernr : undefined,
            sellerName: "verkoperNaam" in dto ? dto.verkoperNaam : undefined,
            imagePath: dto.imagePath ?? undefined,
            location: "plaats" in dto ? dto.plaats ?? undefined : undefined,
            active: "status" in dto ? dto.status === "Active" : undefined,
            bids: "biedingen" in dto ? dto.biedingen?.map(DomainMapper.mapBidSummary) : undefined,
        } satisfies Product;
    }

    static mapBidSummary(dto: VeilingproductBidListItem): BidSummary {
        return {
            id: dto.biedNr,
            amount: dto.bedragPerFust,
            quantity: dto.aantalStuks,
            userId: dto.gebruikerNr,
        } satisfies BidSummary;
    }

    static mapUser(dto: GebruikerAuctionViewDto): User {
        return {
            id: dto.gebruikerNr,
            name: dto.bedrijfsNaam || dto.email,
            email: dto.email,
            role: toRole(dto.soort),
            status: toUiStatus(dto.status),
            kvk: dto.kvk ?? undefined,
        } satisfies User;
    }

    static mapAuction(dto: VeilingMeester_VeilingDto): Auction {
        const products = dto.producten?.map(DomainMapper.mapProduct);
        const bids = dto.biedingen?.map(DomainMapper.mapBid);

        const startPrices =
            products?.map((product) => (typeof product.startPrice === "number" ? product.startPrice : product.minimumPrice)) ??
            dto.producten?.map((product) => product.startprijs ?? product.minimumprijs);
        const numericPrices = (startPrices ?? []).filter((value): value is number => typeof value === "number");
        const minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : undefined;
        const maxPrice = numericPrices.length > 0 ? Math.max(...numericPrices) : undefined;

        return {
            id: dto.veilingNr ?? 0,
            title: dto.veilingNaam,
            startDate: dto.begintijd,
            endDate: dto.eindtijd,
            status: toUiStatus(dto.status),
            rawStatus: dto.status ?? undefined,
            minPrice,
            maxPrice,
            linkedProductIds: products?.map((product) => product.id),
            products,
            bids,
        } satisfies Auction;
    }

    static mapCategory(dto: CategorieDetailDto | CategorieListDto): Category {
        return { id: dto.categorieNr, name: dto.naam ?? "" } satisfies Category;
    }
}
