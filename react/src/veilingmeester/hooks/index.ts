import { useEffect, useState } from "react";
import { getAuctions, getBids, getProducts, getProductsByGrower, getUsers } from "../api";
import { appConfig } from "../config";
import { adaptAuction, adaptBid, adaptProduct, adaptUser, type HookResult, type UserBidRow, type UserRow, type VeilingProductRow, type VeilingRow } from "../types";

const defaultPageSize = appConfig.pagination.table[0] ?? 25;

const isAbortError = (error: unknown): boolean => (error as { name?: string })?.name === "AbortError";

export function useOffline(): boolean {
    const [offline, setOffline] = useState(() => (typeof navigator === "undefined" ? false : !navigator.onLine));
    useEffect(() => {
        if (typeof window === "undefined") return;
        const update = () => setOffline(!navigator.onLine);
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);
    return offline;
}

function usePagedState<T>(initialPageSize = defaultPageSize) {
    const [rows, setRows] = useState<readonly T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [hasNext, setHasNext] = useState(false);
    const [totalResults, setTotalResults] = useState<number | undefined>();
    return { rows, setRows, loading, setLoading, error, setError, page, setPage, pageSize, setPageSize, hasNext, setHasNext, totalResults, setTotalResults };
}

export function useUsers(): HookResult<UserRow> & { search: string; setSearch: (value: string) => void } {
    const state = usePagedState<UserRow>();
    const [search, setSearch] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                state.setLoading(true);
                state.setError(null);
                const result = await getUsers({ q: search, page: state.page, pageSize: state.pageSize }, controller.signal);
                state.setRows(result.items.map(adaptUser));
                state.setHasNext(result.hasNext);
                state.setTotalResults(result.totalResults);
            } catch (error) {
                if (isAbortError(error)) return;
                state.setError((error as { message?: string })?.message ?? "Kon gebruikers niet laden.");
            } finally {
                state.setLoading(false);
            }
        };
        void load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, state.page, state.pageSize]);

    return { ...state, search, setSearch } as HookResult<UserRow> & { search: string; setSearch: (value: string) => void };
}

export function useUserBids(userId: number): HookResult<UserBidRow> & { from: string; setFrom: (value: string) => void; to: string; setTo: (value: string) => void } {
    const state = usePagedState<UserBidRow>(appConfig.pagination.modal[0] ?? defaultPageSize);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                state.setLoading(true);
                state.setError(null);
                const result = await getBids(
                    { gebruikerNr: userId, from: from || undefined, to: to || undefined, page: state.page, pageSize: state.pageSize },
                    controller.signal,
                );
                state.setRows(result.items.map(adaptBid));
                state.setHasNext(result.hasNext);
                state.setTotalResults(result.totalResults);
            } catch (error) {
                if (isAbortError(error)) return;
                state.setError((error as { message?: string })?.message ?? "Kon biedingen niet laden.");
            } finally {
                state.setLoading(false);
            }
        };
        void load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, from, to, state.page, state.pageSize]);

    return { ...state, from, setFrom, to, setTo } as HookResult<UserBidRow> & {
        from: string;
        setFrom: (value: string) => void;
        to: string;
        setTo: (value: string) => void;
    };
}

export function useAuctions(): HookResult<VeilingRow> & {
    status: "alle" | "actief" | "inactief";
    setStatus: (value: "alle" | "actief" | "inactief") => void;
    from: string;
    setFrom: (value: string) => void;
    to: string;
    setTo: (value: string) => void;
} {
    const state = usePagedState<VeilingRow>();
    const [status, setStatus] = useState<"alle" | "actief" | "inactief">("alle");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                state.setLoading(true);
                state.setError(null);
                const result = await getAuctions(
                    {
                        from: from || undefined,
                        to: to || undefined,
                        status: status === "alle" ? undefined : status,
                        page: state.page,
                        pageSize: state.pageSize,
                    },
                    controller.signal,
                );
                state.setRows(result.items.map(adaptAuction));
                state.setHasNext(result.hasNext);
                state.setTotalResults(result.totalResults);
            } catch (error) {
                if (isAbortError(error)) return;
                state.setError((error as { message?: string })?.message ?? "Kon veilingen niet laden.");
            } finally {
                state.setLoading(false);
            }
        };
        void load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, from, to, state.page, state.pageSize]);

    return { ...state, status, setStatus, from, setFrom, to, setTo } as HookResult<VeilingRow> & {
        status: "alle" | "actief" | "inactief";
        setStatus: (value: "alle" | "actief" | "inactief") => void;
        from: string;
        setFrom: (value: string) => void;
        to: string;
        setTo: (value: string) => void;
    };
}

export function useProducts(growerId?: number): HookResult<VeilingProductRow> {
    const state = usePagedState<VeilingProductRow>(appConfig.pagination.modal[0] ?? defaultPageSize);

    useEffect(() => {
        if (!growerId) return undefined;
        const controller = new AbortController();
        const load = async () => {
            try {
                state.setLoading(true);
                state.setError(null);
                const result = await getProductsByGrower(growerId, { page: state.page, pageSize: state.pageSize }, controller.signal);
                state.setRows(result.items.map((dto) => adaptProduct(dto)));
                state.setHasNext(result.hasNext);
                state.setTotalResults(result.totalResults);
            } catch (error) {
                if (isAbortError(error)) return;
                state.setError((error as { message?: string })?.message ?? "Kon producten niet laden.");
            } finally {
                state.setLoading(false);
            }
        };
        void load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [growerId, state.page, state.pageSize]);

    return state;
}

export function useProductCatalog(): HookResult<VeilingProductRow> & { search: string; setSearch: (value: string) => void } {
    const state = usePagedState<VeilingProductRow>();
    const [search, setSearch] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                state.setLoading(true);
                state.setError(null);
                const result = await getProducts({ q: search, page: state.page, pageSize: state.pageSize }, controller.signal);
                state.setRows(result.items.map((dto) => adaptProduct(dto)));
                state.setHasNext(result.hasNext);
                state.setTotalResults(result.totalResults);
            } catch (error) {
                if (isAbortError(error)) return;
                state.setError((error as { message?: string })?.message ?? "Kon producten niet laden.");
            } finally {
                state.setLoading(false);
            }
        };
        void load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, state.page, state.pageSize]);

    return { ...state, search, setSearch } as HookResult<VeilingProductRow> & {
        search: string;
        setSearch: (value: string) => void;
    };
}

export function useDashboardMetrics() {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<readonly { id: string; label: string; value: string; helper: string; accent?: string }[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const load = async (signal: AbortSignal, refresh = false) => {
        try {
            setError(null);
            setLoading(!refresh);
            setRefreshing(refresh);
            const [users, auctions, products] = await Promise.all([
                getUsers({ page: 1, pageSize: 5 }, signal),
                getAuctions({ page: 1, pageSize: appConfig.ui.dashboardSampleSize }, signal),
                getProducts({ page: 1, pageSize: appConfig.ui.dashboardSampleSize }, signal),
            ]);
            const activeAuctions = auctions.items.map(adaptAuction).filter((a) => a.status === "active").length;
            setMetrics([
                { id: "users", label: "Gebruikers", value: String(users.totalResults ?? users.items.length), helper: "Totaal" },
                { id: "auctions", label: "Actieve veilingen", value: String(activeAuctions), helper: "Live" },
                { id: "products", label: "Producten", value: String(products.totalResults ?? products.items.length), helper: "Beschikbaar" },
            ]);
            setLastUpdated(new Date());
        } catch (err) {
            if (isAbortError(err)) return;
            setError((err as { message?: string })?.message ?? "Kon dashboard niet laden.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        const timer = window.setInterval(() => void load(controller.signal, true), appConfig.ui.dashboardRefreshMs);
        return () => {
            controller.abort();
            clearInterval(timer);
        };
    }, []);

    const refresh = () => void load(new AbortController().signal, true);

    return { metrics, loading, refreshing, error, lastUpdated, refresh };
}
