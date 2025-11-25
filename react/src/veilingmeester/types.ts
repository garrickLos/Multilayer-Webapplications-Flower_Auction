import {
    type BiedingCreateDto,
    type BiedingUpdateDto,
    type CategorieDetailDto,
    type CategorieListDto,
    type GebruikerCreateDto,
    type GebruikerUpdateDto,
    type Klant_GebruikerDto,
    type VeilingCreateDto,
    type VeilingMeester_BiedingDto,
    type VeilingMeester_VeilingDto,
    type VeilingProductDto,
    type VeilingUpdateDto,
    type VeilingproductCreateDto,
    type VeilingproductDetailDto,
    type VeilingproductListDto,
    type VeilingproductUpdateDto,
    type VeilingproductBidListItem,
} from "../api/dtos";

/**
 * Domain types for the Veilingmeester dashboard.
 * These types mirror backend DTOs and provide UI-friendly models.
 */

export type AuctionStatus = "NogNietGestart" | "Actief" | "Afgesloten" | "Verkocht" | "Geannuleerd";
export type ProductStatus = "Beschikbaar" | "Gekoppeld" | "Uitverkocht";
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
    readonly category: string;
    readonly startPrice: number;
    readonly stock: number;
    readonly fust: number;
    readonly veilingNr?: number;
    readonly growerId?: number;
    readonly imagePath?: string;
    readonly linkedAuctionId?: number;
    readonly minimumPrice?: number;
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
            id: dto.BiedingNr,
            auctionId: dto.VeilingNr,
            productId: dto.VeilingProductNr,
            userId: dto.GebruikerNr,
            amount: dto.BedragPerFust,
            quantity: dto.AantalStuks,
            status: "active",
        } satisfies Bid;
    }

    static mapProduct(dto: VeilingproductListDto | VeilingproductDetailDto | VeilingProductDto): Product {
        const linkedAuctionId = "VeilingNr" in dto ? dto.VeilingNr ?? undefined : undefined;
        const status: ProductStatus = dto.Voorraad <= 0 ? "Uitverkocht" : linkedAuctionId ? "Gekoppeld" : "Beschikbaar";

        return {
            id: dto.VeilingProductNr,
            name: dto.Naam ?? "Onbekend product",
            status,
            category: "Categorie" in dto ? dto.Categorie ?? "Onbekend" : "Onbekend",
            startPrice: dto.Startprijs,
            stock: dto.Voorraad,
            fust: "Fust" in dto && dto.Fust != null ? dto.Fust : 0,
            veilingNr: linkedAuctionId,
            linkedAuctionId,
            growerId: "Kwekernr" in dto ? dto.Kwekernr : undefined,
            imagePath: dto.ImagePath,
            minimumPrice: "Minimumprijs" in dto ? dto.Minimumprijs : undefined,
            location: "Plaats" in dto ? dto.Plaats : undefined,
            active: "Status" in dto ? dto.Status : undefined,
            bids: "Biedingen" in dto ? dto.Biedingen?.map(DomainMapper.mapBidSummary) : undefined,
        } satisfies Product;
    }

    static mapBidSummary(dto: VeilingproductBidListItem): BidSummary {
        return {
            id: dto.BiedNr,
            amount: dto.BedragPerFust,
            quantity: dto.AantalStuks,
            userId: dto.GebruikerNr,
        } satisfies BidSummary;
    }

    static mapUser(dto: Klant_GebruikerDto): User {
        return {
            id: dto.GebruikerNr,
            name: dto.BedrijfsNaam || dto.Email,
            email: dto.Email,
            role: toRole(dto.Soort),
            status: "active",
            lastLogin: dto.LaatstIngelogd,
            kvk: dto.Kvk ?? undefined,
            address: dto.StraatAdres ? `${dto.StraatAdres}${dto.Postcode ? `, ${dto.Postcode}` : ""}` : undefined,
            bids: dto.Biedingen?.map(DomainMapper.mapBid),
        } satisfies User;
    }

    static mapAuction(dto: VeilingMeester_VeilingDto): Auction {
        const products = dto.Producten?.map(DomainMapper.mapProduct);
        const bids = dto.Biedingen?.map(DomainMapper.mapBid);

        const startPrices = products?.map((product) => product.startPrice) ?? dto.Producten?.map((product) => product.Startprijs);
        const minPrice = startPrices && startPrices.length > 0 ? Math.min(...startPrices) : undefined;
        const maxPrice = startPrices && startPrices.length > 0 ? Math.max(...startPrices) : undefined;

        return {
            id: dto.VeilingNr ?? 0,
            title: dto.VeilingNaam,
            startDate: dto.Begintijd,
            endDate: dto.Eindtijd,
            status: toUiStatus(dto.Status),
            rawStatus: dto.Status,
            minPrice,
            maxPrice,
            linkedProductIds: products?.map((product) => product.id),
            products,
            bids,
        } satisfies Auction;
    }

    static mapCategory(dto: CategorieDetailDto | CategorieListDto): Category {
        return { id: dto.CategorieNr, name: dto.Naam } satisfies Category;
    }
}

export type {
    BiedingCreateDto,
    BiedingUpdateDto,
    CategorieDetailDto,
    CategorieListDto,
    GebruikerCreateDto,
    GebruikerUpdateDto,
    VeilingCreateDto,
    VeilingUpdateDto,
    VeilingproductCreateDto,
    VeilingproductUpdateDto,
};
