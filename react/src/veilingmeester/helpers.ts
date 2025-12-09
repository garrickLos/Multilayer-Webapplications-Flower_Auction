import type { Auction, Product, UiStatus } from "./api";

const currencyFormatter = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

export const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));

export const formatDateParts = (date: Date): string => {
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

export const mapAuctionStatusToBadge = (status: string | UiStatus): UiStatus => {
    const normalised = (status ?? "").toLowerCase();
    if (normalised === "actief" || normalised === "active") return "active";
    if (normalised === "verkocht" || normalised === "afgesloten" || normalised === "sold" || normalised === "archived")
        return "sold";
    if (normalised === "geannuleerd" || normalised === "deleted") return "deleted";
    return "inactive";
};

export const uiStatusToAuctionStatus = (status: UiStatus): string => {
    if (status === "active") return "active";
    if (status === "sold") return "sold";
    if (status === "deleted") return "deleted";
    return "inactive";
};

export const mapProductStatusToUiStatus = (status: string): UiStatus => {
    if (status === "Deleted") return "deleted";
    if (status === "Archived") return "sold";
    if (status === "Active") return "active";
    return "inactive";
};

export const aggregateProductStock = (products?: readonly Product[]): number =>
    products?.reduce((sum, product) => sum + (product.stock ?? 0), 0) ?? 0;

export const deriveAuctionUiStatus = (auction: Auction, now: Date = new Date()): UiStatus => {
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
};

export const calculateClockPrice = (
    startPrice: number,
    minPrice: number,
    start: Date,
    end: Date,
    now: Date,
): number => {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return startPrice;
    if (now <= start) return startPrice;
    if (now >= end) return minPrice;
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const ratio = Math.min(Math.max(elapsed / total, 0), 1);
    const price = startPrice - (startPrice - minPrice) * ratio;
    return Math.max(price, minPrice);
};

