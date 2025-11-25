// Pure helper functions for formatting and domain calculations.
import type { Auction, AuctionStatus, Product, ProductStatus, UiStatus, UserRole } from "../types";

type AuctionStatusStrategy = {
    resolve: (auction: Auction, now: Date) => UiStatus;
};

type ProductStatusStrategy = {
    resolve: (product: Product) => ProductStatus;
};

type PriceStrategy = {
    calculate: (startPrice: number, minPrice: number, start: Date, end: Date, now: Date) => number;
};

const currencyFormatter = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));
const formatDateParts = (date: Date): string => {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}-${month}-${year} ${hours}:${minutes}`;
};

export const formatCurrency = (value?: number | null): string =>
    currencyFormatter.format(typeof value === "number" && Number.isFinite(value) ? value : 0);

export const formatDateTime = (value?: string | Date | null): string => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : formatDateParts(date);
};

export const paginate = <T,>(rows: readonly T[], page: number, pageSize: number): readonly T[] => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
};

export const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(" ");

export const mapAuctionStatusToBadge = (status: AuctionStatus): UiStatus => {
    if (status === "Actief") return "active";
    if (status === "Verkocht" || status === "Afgesloten") return "sold";
    if (status === "Geannuleerd") return "deleted";
    return "inactive";
};

export const uiStatusToAuctionStatus = (status: UiStatus): AuctionStatus => {
    if (status === "active") return "Actief";
    if (status === "sold") return "Verkocht";
    if (status === "deleted") return "Geannuleerd";
    return "NogNietGestart";
};

export const mapProductStatusToUiStatus = (status: ProductStatus): UiStatus => {
    if (status === "Uitverkocht") return "sold";
    if (status === "Gekoppeld") return "inactive";
    return "active";
};

export const aggregateProductStock = (products?: readonly Product[]): number =>
    products?.reduce((sum, product) => sum + (product.stock ?? 0), 0) ?? 0;

const productStatusStrategy: ProductStatusStrategy = {
    resolve: (product: Product) => {
        if (product.stock <= 0) return "Uitverkocht";
        if (product.linkedAuctionId) return "Gekoppeld";
        return "Beschikbaar";
    },
};

const auctionStatusStrategy: AuctionStatusStrategy = {
    resolve: (auction: Auction, now: Date) => {
        const mappedStatus = auction.rawStatus ? mapAuctionStatusToBadge(auction.rawStatus) : auction.status;
        if (mappedStatus === "deleted") return "deleted";

        const start = new Date(auction.startDate);
        const end = new Date(auction.endDate);
        const totalStock = aggregateProductStock(auction.products);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return mappedStatus;
        if (now < start) return "inactive";
        if (totalStock === 0 || mappedStatus === "sold") return "sold";
        if (now >= start && now <= end) return "active";
        return mappedStatus;
    },
};

const linearPriceStrategy: PriceStrategy = {
    calculate: (startPrice: number, minPrice: number, start: Date, end: Date, now: Date) => {
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return startPrice;
        if (now <= start) return startPrice;
        if (now >= end) return minPrice;
        const total = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        const ratio = Math.min(Math.max(elapsed / total, 0), 1);
        const price = startPrice - (startPrice - minPrice) * ratio;
        return Math.max(price, minPrice);
    },
};

export const statusStrategies = {
    auction: auctionStatusStrategy,
    product: productStatusStrategy,
} as const;

export const priceStrategies = {
    linear: linearPriceStrategy,
} as const;

export const deriveProductStatus = (product: Product): ProductStatus => statusStrategies.product.resolve(product);

/** Derive an auction UI status using timing, cancellation and stock. */
export const deriveAuctionUiStatus = (auction: Auction, now: Date = new Date()): UiStatus =>
    statusStrategies.auction.resolve(auction, now);

/** Calculate the current clock price between a start price and minimum price within a timeframe. */
export const calculateClockPrice = (
    startPrice: number,
    minPrice: number,
    start: Date,
    end: Date,
    now: Date,
    strategy: PriceStrategy = priceStrategies.linear,
): number => strategy.calculate(startPrice, minPrice, start, end, now);

/** Helper to filter rows using a predicate with normalised search term. */
export const filterRows = <T, F>(
    rows: readonly T[],
    search: string,
    filters: F,
    predicate: (row: T, term: string, filters: F) => boolean,
): readonly T[] => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => predicate(row, term, filters));
};
