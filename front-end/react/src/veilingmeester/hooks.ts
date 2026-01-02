import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAuctions, fetchBids, fetchProducts, fetchUsers, type ApiError, type Auction, type Bid, type Product, type UiStatus, type User } from "./api";
import { deriveAuctionUiStatus, mapProductStatusToUiStatus } from "./rules";
import { filterRows } from "./helpers";

export const TABLE_PAGE_SIZES = [10, 25, 50] as const;
const CLOCK_TICK_MS = 5000;

export const useOffline = () => {
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        const handleStatus = () => setOffline(!navigator.onLine);
        handleStatus();
        window.addEventListener("online", handleStatus);
        window.addEventListener("offline", handleStatus);
        return () => {
            window.removeEventListener("online", handleStatus);
            window.removeEventListener("offline", handleStatus);
        };
    }, []);

    return offline;
};

const useTicker = (intervalMs: number) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), intervalMs);
        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
};

export type LiveStats = { users: number; activeAuctions: number; products: number; bids: number };

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
                const [usersResponse, activeAuctionsResponse, productsResponse, bidsResponse] = await Promise.all([
                    fetchUsers({ pageSize: 200 }, controller.signal),
                    fetchAuctions({ onlyActive: true, pageSize: 200 }, controller.signal),
                    fetchProducts({ pageSize: 200 }, controller.signal),
                    fetchBids({ pageSize: 200 }, controller.signal),
                ]);

                setStats({
                    users: usersResponse.items.length,
                    activeAuctions: activeAuctionsResponse.items.length,
                    products: productsResponse.items.length,
                    bids: bidsResponse.items.length,
                });
                setLastUpdated(new Date());
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                const apiError = err as ApiError;
                if (apiError.status === 401 || apiError.status === 403) {
                    setError("Je bent uitgelogd of hebt geen toegang. Log opnieuw in om verder te gaan.");
                } else {
                    setError((apiError as { message?: string }).message ?? "Kan statistieken niet laden");
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

export function useVeilingmeesterData() {
    const [users, setUsers] = useState<User[]>([]);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshAll = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);
        try {
            const [userResponse, auctionResponse, productResponse, bidResponse] = await Promise.all([
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
                setError("Je bent uitgelogd of hebt geen toegang. Log opnieuw in om verder te gaan.");
            } else {
                setError((apiError as { message?: string }).message ?? "Kan gegevens niet laden");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void refreshAll(controller.signal);
        return () => controller.abort();
    }, [refreshAll]);

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
    };
}

export type AuctionFilters = { onlyActive: boolean; from: string; to: string; veilingProduct: string };

export function useAuctionsPage(auctions: readonly Auction[]) {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<AuctionFilters>({ onlyActive: false, from: "", to: "", veilingProduct: "" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(TABLE_PAGE_SIZES[0]);
    const now = useTicker(CLOCK_TICK_MS);

    const filteredRows = useMemo(
        () =>
            filterRows(auctions, "", filters, (row, _term, currentFilters) => {
                const computedStatus = deriveAuctionUiStatus(row, now);
                const matchesStatus = !currentFilters.onlyActive || computedStatus === "active";
                const start = Date.parse(row.startDate);
                const from = currentFilters.from ? Date.parse(currentFilters.from) : Number.NEGATIVE_INFINITY;
                const to = currentFilters.to ? Date.parse(currentFilters.to) : Number.POSITIVE_INFINITY;
                const matchesFrom = Number.isFinite(start) ? start >= from : true;
                const matchesTo = Number.isFinite(start) ? start <= to : true;
                const title = typeof row.title === "string" ? row.title.toLowerCase() : "";
                const searchTerm = search.toLowerCase();
                const matchesSearch = !search || title.includes(searchTerm);
                const matchesVeilingProduct =
                    !currentFilters.veilingProduct || !!row.linkedProductIds?.includes(Number(currentFilters.veilingProduct));
                return matchesSearch && matchesStatus && matchesFrom && matchesTo && matchesVeilingProduct;
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

export type ProductFilters = { status: UiStatus | "all"; seller: string; auctionId: string; search: string };

export function useProductsPage(products: readonly Product[]) {
    const [filters, setFilters] = useState<ProductFilters>({ status: "all", seller: "", auctionId: "", search: "" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(TABLE_PAGE_SIZES[0]);

    const filtered = useMemo(
        () =>
            filterRows(products, filters.search, filters, (row, term, current) => {
                const matchesStatus = current.status === "all" || mapProductStatusToUiStatus(row.status) === current.status;
                const sellerName = typeof row.sellerName === "string" ? row.sellerName.toLowerCase() : "";
                const matchesSeller = !current.seller || sellerName.includes(current.seller.toLowerCase());
                const matchesAuction = !current.auctionId || row.linkedAuctionId === Number(current.auctionId);
                const productName = typeof row.name === "string" ? row.name.toLowerCase() : "";
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
