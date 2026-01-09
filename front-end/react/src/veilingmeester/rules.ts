import type { Auction, UiStatus, User } from "./api";
import { buildDateTime, formatDateInput, formatTimeInput, getNextFullHour } from "./helpers";

export type AuctionDurationHours = 1 | 2 | 3;

export type AuctionTimeDefaults = {
    readonly date: string;
    readonly startTime: string;
    readonly durationHours: AuctionDurationHours;
};

// Change auction time defaults here.
export const AUCTION_DURATION_OPTIONS: readonly AuctionDurationHours[] = [1, 2, 3];

export const getDefaultAuctionTimes = (base: Date = new Date()): AuctionTimeDefaults => {
    const nextHour = getNextFullHour(base);
    return {
        date: formatDateInput(nextHour),
        startTime: formatTimeInput(nextHour),
        durationHours: 1,
    };
};

export const calculateAuctionEndTime = (dateValue: string, timeValue: string, durationHours: number): Date | null => {
    const startDateTime = buildDateTime(dateValue, timeValue);
    if (!startDateTime) return null;
    const end = new Date(startDateTime);
    end.setHours(end.getHours() + durationHours);
    return end;
};

const aggregateProductStock = (products?: readonly { stock?: number }[]): number =>
    products?.reduce((sum, product) => sum + (product.stock ?? 0), 0) ?? 0;

// Change auction status defaults & transitions here.
export const mapAuctionStatusToBadge = (status: string | UiStatus): UiStatus => {
    const normalised = typeof status === "string" ? status.toLowerCase() : "";
    if (normalised === "actief" || normalised === "active") return "active";
    if (normalised === "verkocht" || normalised === "uitverkocht" || normalised === "sold" || normalised === "archived")
        return "sold";
    if (normalised === "afgesloten" || normalised === "closed" || normalised === "finished") return "finished";
    if (normalised === "geannuleerd" || normalised === "cancelled" || normalised === "deleted") return "deleted";
        return "inactive";
};

export const uiStatusToAuctionStatus = (status: UiStatus): string => {
    if (status === "active") return "active";
    if (status === "sold") return "sold";
    if (status === "deleted") return "deleted";
    if (status === "finished") return "afgesloten";
    return "inactive";
};

export const deriveAuctionUiStatus = (auction: Auction, now: Date = new Date()): UiStatus => {
    const mappedStatus = auction.rawStatus ? mapAuctionStatusToBadge(auction.rawStatus) : auction.status;
    if (mappedStatus === "deleted") return "deleted";
    if (mappedStatus === "finished") return "finished";

    const start = new Date(auction.startDate);
    const end = new Date(auction.endDate);
    const totalStock = aggregateProductStock(auction.products);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return mappedStatus;
    if (now < start) return "inactive";
    if (totalStock === 0 || mappedStatus === "sold") return "sold";
    if (now >= start && now <= end) return "active";
    return "finished";
};

// Change auction clock pricing rules here.
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

// Change product linking rules here.
export const isProductLinkingLocked = (auction: Auction, now: Date = new Date()): boolean =>
    deriveAuctionUiStatus(auction, now) === "active";

export const canUnlinkProduct = (auction: Auction, now: Date = new Date()): boolean =>
    !isProductLinkingLocked(auction, now);

// Change product status mapping here.
export const mapProductStatusToUiStatus = (status: string | null | undefined): UiStatus => {
    if (status === "Deleted") return "deleted";
    if (status === "Archived") return "sold";
    if (status === "Active") return "active";
    return "inactive";
};

export type UserFilters = { role: User["role"] | "all"; status: UiStatus | "all" };

// Change user visibility rules here.
export const isUserVisible = (user: User): boolean => user.role === "Koper" || user.role === "Bedrijf";

export const matchesUserFilters = (user: User, filters: UserFilters): boolean => {
    if (!isUserVisible(user)) return false;
    const matchesRole = filters.role === "all" || user.role === filters.role;
    const matchesStatus = filters.status === "all" || user.status === filters.status;
    return matchesRole && matchesStatus;
};

export const getUserActions = (user: User): { canViewBids: boolean; canViewProducts: boolean } => ({
    canViewBids: user.role === "Koper",
    canViewProducts: user.role === "Bedrijf",
});