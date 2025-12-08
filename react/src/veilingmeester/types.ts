export type ApiError = { status: number; message: string };

/**
 * Domain types for the Veilingmeester dashboard.
 * These types mirror backend DTOs and provide UI-friendly models.
 */
export type AuctionStatus = "NogNietGestart" | "Actief" | "Afgesloten" | "Verkocht" | "Geannuleerd";
export type ProductStatus = "Active" | "Inactive" | "Deleted" | "Archived";
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
    if (normalised === "geannuleerd" || normalised === "deleted") return "deleted";
    if (normalised === "archived") return "sold";
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
