// Shared domain types for the Veilingmeester screens.
export type Status = "active" | "inactive" | "sold" | "deleted";
export type UserRole = "Veilingmeester" | "Kweker" | "Koper" | "Onbekend";

export interface PaginatedList<T> {
    readonly items: readonly T[];
    readonly page: number;
    readonly pageSize: number;
    readonly hasNext: boolean;
    readonly totalResults?: number;
}

// API DTOs
export type GebruikerDto = {
    gebruikerNr: number;
    bedrijfsNaam: string;
    email: string;
    soort: string;
    laatstIngelogd?: string;
    kvk?: string;
    straatAdres?: string;
    postcode?: string;
    biedingen?: VeilingMeester_BiedingDto[];
};

export type GebruikerUpdateDto = Partial<Pick<GebruikerDto, "bedrijfsNaam" | "email" | "soort" | "straatAdres" | "postcode" | "kvk">> & {
    wachtwoord?: string;
};

export type VeilingDto = {
    veilingNr: number;
    veilingNaam: string;
    begintijd: string;
    eindtijd: string;
    status?: string;
    producten?: VeilingProductDto[];
    biedingen?: VeilingMeester_BiedingDto[];
};

export type VeilingCreateDto = Pick<VeilingDto, "veilingNaam" | "begintijd" | "eindtijd"> & { status?: string };

export type VeilingDetailDto = VeilingDto & { beschrijving?: string };
export type VeilingUpdateDto = Partial<Pick<VeilingDto, "veilingNaam" | "begintijd" | "eindtijd" | "status">> & { beschrijving?: string };

export type VeilingProductDto = {
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
};

export type VeilingproductUpdateDto = Partial<Pick<VeilingProductDto, "naam" | "startprijs" | "voorraad" | "categorie" | "veilingNr" | "imagePath">>;

export type VeilingMeester_BiedingDto = {
    biedingNr: number;
    veilingNr: number;
    veilingProductNr: number;
    gebruikerNr: number;
    bedragPerFust: number;
    aantalStuks: number;
};

export type BiedingCreateDto = Omit<VeilingMeester_BiedingDto, "biedingNr">;
export type BiedingUpdateDto = Partial<BiedingCreateDto>;

// UI models
export interface User {
    readonly id: number;
    readonly name: string;
    readonly email: string;
    readonly role: UserRole;
    readonly lastLogin?: string;
    readonly kvk?: string;
    readonly address?: string;
    readonly status?: Status;
    readonly bids?: readonly Bid[];
}

export interface Auction {
    readonly id: number;
    readonly title: string;
    readonly status: Status;
    readonly startDate: string;
    readonly endDate: string;
    readonly minPrice?: number;
    readonly maxPrice?: number;
    readonly linkedProductIds?: readonly number[];
    readonly products?: readonly Product[];
    readonly bids?: readonly Bid[];
}

export interface Product {
    readonly id: number;
    readonly name: string;
    readonly status: Status;
    readonly category: string;
    readonly startPrice: number;
    readonly stock: number;
    readonly fust: number;
    readonly veilingNr?: number;
    readonly growerId?: number;
    readonly imagePath?: string;
    readonly linkedAuctionId?: number;
}

export interface Bid {
    readonly id: number;
    readonly userId: number;
    readonly auctionId: number;
    readonly productId: number;
    readonly amount: number;
    readonly quantity: number;
    readonly status: Status;
    readonly date?: string;
}

export type ModalKey = "newAuction" | "linkProducts" | "editUser" | "userBids" | "userProducts";

export type ModalState =
    | { key: "newAuction" }
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
    Koper: "Koper",
    Kweker: "Kweker",
    Veilingmeester: "Veilingmeester",
    Onbekend: "Onbekend",
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

export const toStatus = (value?: string | null): Status => {
    const normalised = (value ?? "").toLowerCase();
    if (normalised === "actief" || normalised === "active") return "active";
    if (normalised === "verkocht" || normalised === "sold") return "sold";
    if (normalised === "geannuleerd" || normalised === "deleted") return "deleted";
    return "inactive";
};

export const toRole = (value?: string | null): UserRole => {
    const normalised = (value ?? "").toLowerCase();
    if (normalised === "veilingmeester") return "Veilingmeester";
    if (normalised === "kweker" || normalised === "grower") return "Kweker";
    if (normalised === "koper" || normalised === "buyer") return "Koper";
    return "Onbekend";
};

export const adaptBid = (dto: VeilingMeester_BiedingDto): Bid => ({
    id: dto.biedingNr,
    auctionId: dto.veilingNr,
    productId: dto.veilingProductNr,
    userId: dto.gebruikerNr,
    amount: dto.bedragPerFust,
    quantity: dto.aantalStuks,
    status: "active",
    date: undefined,
});

export const adaptProduct = (dto: VeilingProductDto): Product => ({
    id: dto.veilingProductNr,
    name: dto.naam ?? "Onbekend product",
    status: dto.voorraad <= 0 ? "sold" : dto.veilingNr ? "active" : "inactive",
    category: dto.categorie ?? "Onbekend",
    startPrice: dto.startprijs,
    stock: dto.voorraad,
    fust: dto.fust,
    veilingNr: dto.veilingNr || undefined,
    linkedAuctionId: dto.veilingNr || undefined,
    growerId: dto.kwekerNr,
    imagePath: dto.imagePath,
});

export const adaptUser = (dto: GebruikerDto): User => ({
    id: dto.gebruikerNr,
    name: dto.bedrijfsNaam || dto.email,
    email: dto.email,
    role: toRole(dto.soort),
    lastLogin: dto.laatstIngelogd,
    kvk: dto.kvk,
    address: dto.straatAdres ? `${dto.straatAdres}${dto.postcode ? `, ${dto.postcode}` : ""}` : undefined,
    status: "active",
    bids: dto.biedingen?.map(adaptBid),
});

export const adaptAuction = (dto: VeilingDto): Auction => ({
    id: dto.veilingNr,
    title: dto.veilingNaam,
    startDate: dto.begintijd,
    endDate: dto.eindtijd,
    status: toStatus(dto.status ?? "Actief"),
    minPrice:
        dto.producten && dto.producten.length > 0
            ? Math.min(...dto.producten.map((product) => product.startprijs))
            : undefined,
    maxPrice:
        dto.producten && dto.producten.length > 0
            ? Math.max(...dto.producten.map((product) => product.startprijs))
            : undefined,
    linkedProductIds: dto.producten?.map((product) => product.veilingProductNr),
    products: dto.producten?.map(adaptProduct),
    bids: dto.biedingen?.map(adaptBid),
});
