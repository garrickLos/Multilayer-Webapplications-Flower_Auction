// Pure helper functions for formatting and small domain calculations.
import type { Auction, AuctionStatus, Product, ProductStatus, UiStatus } from "../types";

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

/**
 * Derive an auction UI status using timing and stock.
 */
export const deriveAuctionUiStatus = (auction: Auction, now: Date): UiStatus => {
    const start = new Date(auction.startDate);
    const end = new Date(auction.endDate);
    const totalStock = auction.products?.reduce((sum, product) => sum + (product.stock ?? 0), 0);

    if (auction.status === "Geannuleerd") return "deleted";
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "inactive";
    if (now < start) return "inactive";
    if (totalStock === 0) return "sold";
    if (now >= start && now <= end) return "active";
    return "inactive";
};

/**
 * Derive product status based on stock and auction linkage.
 */
export const deriveProductStatus = (product: Product): ProductStatus => {
    if (product.stock <= 0) return "Uitverkocht";
    if (product.linkedAuctionId) return "Gekoppeld";
    return "Beschikbaar";
};

/**
 * Calculate the current clock price between a start price and minimum price within a timeframe.
 */
export const calculateClockPrice = (startPrice: number, minPrice: number, start: Date, end: Date, now: Date): number => {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return startPrice;
    if (now <= start) return startPrice;
    if (now >= end) return minPrice;
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const ratio = Math.min(Math.max(elapsed / total, 0), 1);
    const price = startPrice - (startPrice - minPrice) * ratio;
    return Math.max(price, minPrice);
};

/**
 * Helper to filter rows using a predicate with normalised search term.
 */
export const filterRows = <T, F>(
    rows: readonly T[],
    search: string,
    filters: F,
    predicate: (row: T, term: string, filters: F) => boolean,
): readonly T[] => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => predicate(row, term, filters));
};

/**
 * Map API status to a presentational badge variant.
 */
export const mapAuctionStatusToBadge = (status: AuctionStatus): UiStatus => {
    if (status === "Actief") return "active";
    if (status === "Verkocht" || status === "Afgesloten") return "sold";
    if (status === "Geannuleerd") return "deleted";
    return "inactive";
};
