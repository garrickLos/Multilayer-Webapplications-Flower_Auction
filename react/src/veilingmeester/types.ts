// Shared domain types for the Veilingmeester screens.
export type Status = "active" | "inactive" | "sold" | "deleted";
export type UserRole = "buyer" | "grower" | "auctioneer";

export interface User {
    readonly id: number;
    readonly name: string;
    readonly email: string;
    readonly role: UserRole;
    readonly status: Status;
}

export interface Auction {
    readonly id: number;
    readonly title: string;
    readonly status: Status;
    readonly minPrice: number;
    readonly maxPrice: number;
    readonly startDate: string;
    readonly endDate: string;
    readonly linkedProductIds: readonly number[];
}

export interface Product {
    readonly id: number;
    readonly name: string;
    readonly status: Status;
    readonly category: string;
    readonly minPrice: number;
    readonly maxPrice: number;
    readonly growerId: number;
    readonly linkedAuctionId?: number;
}

export interface Bid {
    readonly id: number;
    readonly userId: number;
    readonly auctionId: number;
    readonly amount: number;
    readonly quantity: number;
    readonly date: string;
    readonly status: Status;
}

export type ModalKey =
    | "newAuction"
    | "auctionDetails"
    | "linkProducts"
    | "editUser"
    | "userBids"
    | "userProducts";

export type ModalState =
    | { key: "newAuction" }
    | { key: "auctionDetails"; auctionId: number }
    | { key: "linkProducts"; auctionId: number }
    | { key: "editUser"; userId: number }
    | { key: "userBids"; userId: number }
    | { key: "userProducts"; userId: number };

export type FilterState<T> = { readonly search: string; readonly filters: T };

export const statusLabels: Record<Status, string> = {
    active: "Actief",
    inactive: "Inactief",
    sold: "Verkocht",
    deleted: "Geannuleerd",
};

export const roleLabels: Record<UserRole, string> = {
    buyer: "Koper",
    grower: "Kweker",
    auctioneer: "Veilingmeester",
};

export const filterRows = <T, F>(
    rows: readonly T[],
    search: string,
    filters: F,
    predicate: (row: T, term: string, filters: F) => boolean,
): readonly T[] => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => predicate(row, term, filters));
};
