import { useCallback, useEffect, useMemo, useState } from "react";
import {
    fetchAuctions,
    fetchBids,
    fetchProducts,
    fetchUsers,
    type ApiError,
    type Auction,
    type Bid,
    type Product,
    type UiStatus,
    type User,
} from "./api";
import { deriveAuctionUiStatus, mapProductStatusToUiStatus } from "./rules";
import { filterRows, formatCurrency, formatDateTime } from "./helpers";

// Standaard opties voor "items per pagina" in tabellen
export const TABLE_PAGE_SIZES = [10, 25, 50] as const;

// Interval voor live UI-updates (bijv. klokprijs/status)
const CLOCK_TICK_MS = 5000;

/**
 * useOffline:
 * Houdt bij of de browser offline is (navigator.onLine).
 * Handig om UI waarschuwingen te tonen of requests te blokkeren.
 */
export const useOffline = () => {
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        const handleStatus = () => setOffline(!navigator.onLine);

        // Initieel meteen status zetten
        handleStatus();

        // Luisteren naar online/offline events
        window.addEventListener("online", handleStatus);
        window.addEventListener("offline", handleStatus);

        return () => {
            window.removeEventListener("online", handleStatus);
            window.removeEventListener("offline", handleStatus);
        };
    }, []);

    return offline;
};

/**
 * useTicker:
 * Interne hook die elke intervalMs de "now" tijd ververst.
 * Dit zorgt dat berekende UI (zoals status/klokprijs) mee blijft lopen.
 */
const useTicker = (intervalMs: number) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), intervalMs);
        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
};

// Type voor de statistieken op het dashboard
export type LiveStats = {
    users: number;
    activeAuctions: number;
    products: number;
    bids: number;
};

/**
 * useLiveStats:
 * Laadt compacte dashboard-statistieken (aantallen) via 4 parallelle calls.
 * - Zet lastUpdated voor UI ("laatst bijgewerkt")
 * - Geeft nette foutmelding bij 401/403 (geen toegang / uitgelogd)
 */
export function useLiveStats() {
    const [stats, setStats] = useState<LiveStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const [
                    usersResponse,
                    activeAuctionsResponse,
                    productsResponse,
                    bidsResponse,
                ] = await Promise.all([
                    fetchUsers({ pageSize: 200 }, controller.signal),
                    fetchAuctions({ onlyActive: true, pageSize: 200 }, controller.signal),
                    fetchProducts({ pageSize: 200 }, controller.signal),
                    fetchBids({ pageSize: 200 }, controller.signal),
                ]);

                // Alleen aantallen opslaan (sneller/compacter dan hele objecten)
                setStats({
                    users: usersResponse.items.length,
                    activeAuctions: activeAuctionsResponse.items.length,
                    products: productsResponse.items.length,
                    bids: bidsResponse.items.length,
                });

                setLastUpdated(new Date());
            } catch (err) {
                // Abort is geen echte fout (bij unmount)
                if ((err as { name?: string }).name === "AbortError") return;

                const apiError = err as ApiError;

                // Auth errors krijgen een duidelijke melding
                if (apiError.status === 401 || apiError.status === 403) {
                    setError(
                        "Je bent uitgelogd of hebt geen toegang. Log opnieuw in om verder te gaan.",
                    );
                } else {
                    setError(
                        (apiError as { message?: string }).message ??
                        "Kan statistieken niet laden",
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, []);

    return { stats, loading, error, lastUpdated };
}

/**
 * useVeilingmeesterData:
 * Centrale data-hook voor de veilingmeester pagina:
 * - houdt users/auctions/products/bids state bij
 * - biedt refresh-methodes per tab of alles tegelijk
 * - zorgt voor consistente error handling
 */
export function useVeilingmeesterData() {
    const [users, setUsers] = useState<User[]>([]);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * refreshAll:
     * Laadt alle datasets in parallel (users, auctions, products, bids).
     * Wordt ook bij init gebruikt.
     */
    const refreshAll = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);

        try {
            const [
                userResponse,
                auctionResponse,
                productResponse,
                bidResponse,
            ] = await Promise.all([
                fetchUsers({ pageSize: 200 }, signal),
                fetchAuctions({ pageSize: 200 }, signal),
                fetchProducts({ pageSize: 200 }, signal),
                fetchBids({ pageSize: 200 }, signal),
            ]);

            setUsers([...userResponse.items]);
            setAuctions([...auctionResponse.items]);
            setProducts([...productResponse.items]);
            setBids([...bidResponse.items]);
        } catch (err) {
            if ((err as { name?: string }).name === "AbortError") return;

            const apiError = err as ApiError;

            if (apiError.status === 401 || apiError.status === 403) {
                setError(
                    "Je bent uitgelogd of hebt geen toegang. Log opnieuw in om verder te gaan.",
                );
            } else {
                setError((apiError as { message?: string }).message ?? "Kan gegevens niet laden");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * refreshAuctions:
     * Herlaadt alleen veilingen (handig bij acties zoals aanmaken/annuleren).
     */
    const refreshAuctions = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);

        try {
            const auctionResponse = await fetchAuctions({ pageSize: 200 }, signal);
            setAuctions([...auctionResponse.items]);
        } catch (err) {
            if ((err as { name?: string }).name === "AbortError") return;

            const apiError = err as ApiError;

            if (apiError.status === 401 || apiError.status === 403) {
                setError(
                    "Je bent uitgelogd of hebt geen toegang. Log opnieuw in om verder te gaan.",
                );
            } else {
                setError((apiError as { message?: string }).message ?? "Kan veilingen niet laden");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * refreshProducts:
     * Herlaadt alleen producten.
     */
    const refreshProducts = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);

        try {
            const productResponse = await fetchProducts({ pageSize: 200 }, signal);
            setProducts([...productResponse.items]);
        } catch (err) {
            if ((err as { name?: string }).name === "AbortError") return;

            const apiError = err as ApiError;

            if (apiError.status === 401 || apiError.status === 403) {
                setError(
                    "Je bent uitgelogd of hebt geen toegang. Log opnieuw in om verder te gaan.",
                );
            } else {
                setError((apiError as { message?: string }).message ?? "Kan producten niet laden");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * refreshUsers:
     * Herlaadt gebruikers en biedingen samen (handig voor user-details).
     */
    const refreshUsers = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);

        try {
            const [userResponse, bidResponse] = await Promise.all([
                fetchUsers({ pageSize: 200 }, signal),
                fetchBids({ pageSize: 200 }, signal),
            ]);

            setUsers([...userResponse.items]);
            setBids([...bidResponse.items]);
        } catch (err) {
            if ((err as { name?: string }).name === "AbortError") return;

            const apiError = err as ApiError;

            if (apiError.status === 401 || apiError.status === 403) {
                setError(
                    "Je bent uitgelogd of hebt geen toegang. Log opnieuw in om verder te gaan.",
                );
            } else {
                setError((apiError as { message?: string }).message ?? "Kan gebruikers niet laden");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Initieel alles laden bij mount (met abort bij unmount).
     */
    useEffect(() => {
        const controller = new AbortController();
        void refreshAll(controller.signal);
        return () => controller.abort();
    }, [refreshAll]);

    /**
     * handleAuctionsLoaded:
     * Kleine helper om veilingen te vervangen vanuit een child-component.
     */
    const handleAuctionsLoaded = useCallback((items: Auction[]) => setAuctions(items), []);

    return {
        users,
        auctions,
        products,
        bids,
        loading,
        error,
        setError,
        setAuctions,
        setProducts,
        setBids,
        handleAuctionsLoaded,
        refreshAll,
        refreshAuctions,
        refreshProducts,
        refreshUsers,
    };
}

/**
 * Filters voor de veilingen-tab:
 * - onlyActive: alleen lopende veilingen tonen
 * - from/to: datum-range filtering op startDate
 * - status: UI status filter of "all"
 */
export type AuctionFilters = {
    onlyActive: boolean;
    from: string;
    to: string;
    status: UiStatus | "all";
};

/**
 * useAuctionsPage:
 * Houdt UI-state bij voor de veilingen tabel:
 * - zoeken
 * - filters
 * - paging
 * - now ticker (voor live status/klokprijs)
 * En geeft een gefilterde lijst terug.
 */
export function useAuctionsPage(auctions: readonly Auction[]) {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<AuctionFilters>({
        onlyActive: false,
        from: "",
        to: "",
        status: "all",
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(TABLE_PAGE_SIZES[0]);

    // "now" wordt elke 5s geüpdatet zodat status/klok in de UI meeloopt
    const now = useTicker(CLOCK_TICK_MS);

    /**
     * filteredRows:
     * Combineert zoekterm + filters in één predicate.
     * - status wordt berekend via deriveAuctionUiStatus
     * - datums worden vergeleken via Date.parse
     * - zoeken gebeurt door een samengestelde string van relevante velden
     */
    const filteredRows = useMemo(
        () =>
            filterRows(auctions, search, filters, (row, term, currentFilters) => {
                const computedStatus = deriveAuctionUiStatus(row, now);

                // Filter: alleen actief
                const matchesOnlyActive =
                    !currentFilters.onlyActive || computedStatus === "active";

                // Filter: status dropdown
                const matchesStatus =
                    currentFilters.status === "all" ||
                    computedStatus === currentFilters.status;

                // Filter: datum range (op startDate)
                const start = Date.parse(row.startDate);
                const from = currentFilters.from
                    ? Date.parse(currentFilters.from)
                    : Number.NEGATIVE_INFINITY;
                const to = currentFilters.to
                    ? Date.parse(currentFilters.to)
                    : Number.POSITIVE_INFINITY;

                const matchesFrom = Number.isFinite(start) ? start >= from : true;
                const matchesTo = Number.isFinite(start) ? start <= to : true;

                // Extra waarden voor search (prijs, aantallen, datums, etc.)
                const productCount =
                    row.linkedProductIds?.length ?? row.products?.length ?? 0;

                const startPrice = row.maxPrice ?? row.minPrice ?? 0;
                const minPrice = row.minPrice ?? 0;

                const rawStatus = typeof row.rawStatus === "string" ? row.rawStatus : "";

                // Samenstellen van zoekbare tekst
                const searchValues = [
                    row.title,
                    computedStatus,
                    rawStatus,
                    formatCurrency(startPrice),
                    formatCurrency(minPrice),
                    String(startPrice),
                    String(minPrice),
                    String(productCount),
                    row.startDate,
                    row.endDate,
                    formatDateTime(row.startDate),
                    formatDateTime(row.endDate),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const matchesSearch = !term || searchValues.includes(term);

                return (
                    matchesSearch &&
                    matchesOnlyActive &&
                    matchesStatus &&
                    matchesFrom &&
                    matchesTo
                );
            }),
        [auctions, filters, now, search],
    );

    return {
        filtered: filteredRows,
        search,
        filters,
        now,
        page,
        pageSize,
        setSearch,
        setFilters,
        setPage,
        setPageSize,
    };
}

/**
 * Filters voor producten-tab:
 * - status: UI status of "all"
 * - seller: tekstfilter op verkopernaam
 * - auctionId: filter op gekoppelde veiling
 * - search: tekstfilter op productnaam
 */
export type ProductFilters = {
    status: UiStatus | "all";
    seller: string;
    auctionId: string;
    search: string;
};

/**
 * useProductsPage:
 * Houdt UI-state bij voor producten-overzicht:
 * - filters + paging
 * En geeft gefilterde producten terug.
 */
export function useProductsPage(products: readonly Product[]) {
    const [filters, setFilters] = useState<ProductFilters>({
        status: "all",
        seller: "",
        auctionId: "",
        search: "",
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(TABLE_PAGE_SIZES[0]);

    /**
     * filtered:
     * Filtert producten op:
     * - status (via mapProductStatusToUiStatus)
     * - verkopernaam
     * - gekoppelde veiling
     * - zoekterm in productnaam
     */
    const filtered = useMemo(
        () =>
            filterRows(products, filters.search, filters, (row, term, current) => {
                const matchesStatus =
                    current.status === "all" ||
                    mapProductStatusToUiStatus(row.status) === current.status;

                const sellerName =
                    typeof row.sellerName === "string" ? row.sellerName.toLowerCase() : "";
                const matchesSeller =
                    !current.seller || sellerName.includes(current.seller.toLowerCase());

                const matchesAuction =
                    !current.auctionId || row.linkedAuctionId === Number(current.auctionId);

                const productName =
                    typeof row.name === "string" ? row.name.toLowerCase() : "";
                const matchesSearch = !term || productName.includes(term);

                return matchesStatus && matchesSeller && matchesAuction && matchesSearch;
            }),
        [filters, products],
    );

    return {
        filtered,
        filters,
        page,
        pageSize,
        setFilters,
        setPage,
        setPageSize,
    };
}
