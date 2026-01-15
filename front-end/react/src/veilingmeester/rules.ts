import type { Auction, UiStatus, User } from "./api";
import {
    buildDateTime,
    formatDateInput,
    formatTimeInput,
    getNextFullHour,
} from "./helpers";

// Toegestane veilingduren (uren) in de UI
export type AuctionDurationHours = 1 | 2 | 3;

// Defaults die de "Nieuwe veiling" modal gebruikt bij openen
export type AuctionTimeDefaults = {
    readonly date: string;
    readonly startTime: string;
    readonly durationHours: AuctionDurationHours;
};

// Opties voor de duur-dropdown (hier aanpassen als je extra opties wil)
export const AUCTION_DURATION_OPTIONS: readonly AuctionDurationHours[] = [1, 2, 3];

/**
 * getDefaultAuctionTimes:
 * Bepaalt een nette standaard starttijd (volgend heel uur) + datum en duur.
 * Wordt gebruikt om het formulier alvast goed in te vullen.
 */
export const getDefaultAuctionTimes = (base: Date = new Date()): AuctionTimeDefaults => {
    const nextHour = getNextFullHour(base);

    return {
        date: formatDateInput(nextHour),
        startTime: formatTimeInput(nextHour),
        durationHours: 1,
    };
};

/**
 * calculateAuctionEndTime:
 * Rekent de eindtijd uit op basis van datum + starttijd + duur (uren).
 * Geeft null terug als de invoer geen geldige datum/tijd oplevert.
 */
export const calculateAuctionEndTime = (
    dateValue: string,
    timeValue: string,
    durationHours: number,
): Date | null => {
    const startDateTime = buildDateTime(dateValue, timeValue);
    if (!startDateTime) return null;

    const end = new Date(startDateTime);
    end.setHours(end.getHours() + durationHours);

    return end;
};

/**
 * aggregateProductStock:
 * Telt voorraad op van alle producten binnen een veiling.
 * Wordt gebruikt om te bepalen of iets "uitverkocht" is.
 */
const aggregateProductStock = (products?: readonly { stock?: number }[]): number =>
    products?.reduce((sum, product) => sum + (product.stock ?? 0), 0) ?? 0;

/**
 * mapAuctionStatusToBadge:
 * Normaliseert status-string(s) uit backend naar UiStatus.
 * Ondersteunt meerdere schrijfwijzen (NL/EN) en legacy waardes.
 */
export const mapAuctionStatusToBadge = (status: string | UiStatus): UiStatus => {
    const normalised = typeof status === "string" ? status.toLowerCase() : "";

    if (normalised === "actief" || normalised === "active") return "active";

    if (
        normalised === "verkocht" ||
        normalised === "uitverkocht" ||
        normalised === "sold" ||
        normalised === "archived"
    )
        return "sold";

    if (normalised === "afgesloten" || normalised === "closed" || normalised === "finished")
        return "finished";

    if (normalised === "geannuleerd" || normalised === "cancelled" || normalised === "deleted")
        return "deleted";

    return "inactive";
};

/**
 * uiStatusToAuctionStatus:
 * Zet UiStatus terug naar de status-string die de backend verwacht.
 * Handig bij updates (bijv. annuleren).
 */
export const uiStatusToAuctionStatus = (status: UiStatus): string => {
    if (status === "active") return "active";
    if (status === "sold") return "sold";
    if (status === "deleted") return "deleted";
    if (status === "finished") return "afgesloten";
    return "inactive";
};

/**
 * deriveAuctionUiStatus:
 * Bepaalt de actuele UI status van een veiling op basis van:
 * - rawStatus / status vanuit backend
 * - huidige tijd (start/einde)
 * - totale voorraad (uitverkocht)
 */
export const deriveAuctionUiStatus = (auction: Auction, now: Date = new Date()): UiStatus => {
    const mappedStatus = auction.rawStatus
        ? mapAuctionStatusToBadge(auction.rawStatus)
        : auction.status;

    // Geannuleerd en afgesloten blijven altijd zo
    if (mappedStatus === "deleted") return "deleted";
    if (mappedStatus === "finished") return "finished";

    const start = new Date(auction.startDate);
    const end = new Date(auction.endDate);
    const totalStock = aggregateProductStock(auction.products);

    // Als datums niet kloppen, val terug op de status uit de data
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return mappedStatus;

    // Nog niet begonnen
    if (now < start) return "inactive";

    // Uitverkocht door voorraad of status
    if (totalStock === 0 || mappedStatus === "sold") return "sold";

    // Actief tijdens het tijdvenster
    if (now >= start && now <= end) return "active";

    // Daarna afgesloten
    return "finished";
};

/**
 * calculateClockPrice:
 * Rekent de actuele klokprijs lineair van startPrice naar minPrice
 * over de tijd tussen start en end.
 */
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

/**
 * isProductLinkingLocked:
 * Tijdens een actieve veiling mag je niet koppelen/ontkoppelen.
 */
export const isProductLinkingLocked = (auction: Auction, now: Date = new Date()): boolean =>
    deriveAuctionUiStatus(auction, now) === "active";

/**
 * canUnlinkProduct:
 * Alleen ontkoppelen als koppelen niet locked is.
 */
export const canUnlinkProduct = (auction: Auction, now: Date = new Date()): boolean =>
    !isProductLinkingLocked(auction, now);

/**
 * mapProductStatusToUiStatus:
 * Normaliseert productstatus uit backend (meestal enum/string) naar UiStatus.
 */
export const mapProductStatusToUiStatus = (status: string | null | undefined): UiStatus => {
    if (status === "Deleted") return "deleted";
    if (status === "Archived") return "sold";
    if (status === "Active") return "active";
    return "inactive";
};

// Filters die de users-tab gebruikt (rol + status)
export type UserFilters = { role: User["role"] | "all"; status: UiStatus | "all" };

/**
 * isUserVisible:
 * Bepaalt of een gebruiker zichtbaar is in het overzicht.
 * (bijv. Admin/Onbekend wil je verbergen)
 */
export const isUserVisible = (user: User): boolean =>
    user.role === "Koper" || user.role === "Bedrijf";

/**
 * matchesUserFilters:
 * Past rol/status filters toe en respecteert isUserVisible.
 */
export const matchesUserFilters = (user: User, filters: UserFilters): boolean => {
    if (!isUserVisible(user)) return false;

    const matchesRole = filters.role === "all" || user.role === filters.role;
    const matchesStatus = filters.status === "all" || user.status === filters.status;

    return matchesRole && matchesStatus;
};

/**
 * getUserActions:
 * Bepaalt welke knoppen (acties) beschikbaar zijn op basis van rol.
 */
export const getUserActions = (user: User): { canViewBids: boolean; canViewProducts: boolean } => ({
    canViewBids: user.role === "Koper",
    canViewProducts: user.role === "Bedrijf",
});
