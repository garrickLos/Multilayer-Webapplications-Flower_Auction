import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError } from "./api";
import { getAuctions, getBids, getProductsByGrower, getUsers } from "./api";
import { appConfig } from "./config";
import {
    adaptAuction,
    adaptBid,
    adaptProduct,
    adaptUser,
    type HookResult,
    type UserBidRow,
    type UserRow,
    type VeilingProductRow,
    type VeilingRow,
} from "./types";

const USERS_STORAGE_KEY = appConfig.storageKeys.users;
const AUCTIONS_STORAGE_KEY = appConfig.storageKeys.auctions;
const BIDS_STORAGE_KEY = appConfig.storageKeys.bids;
const PRODUCTS_STORAGE_KEY = appConfig.storageKeys.products;

const POLL_INTERVAL = appConfig.polling.defaultIntervalMs as number;
const BACKOFF_DELAYS = appConfig.polling.backoffDelaysMs as readonly number[];

type UsersState = { page: number; pageSize: number; search: string };
type AuctionsState = {
    page: number;
    pageSize: number;
    status: "alle" | "actief" | "inactief";
    from: string;
    to: string;
};
type BidsState = { page: number; pageSize: number; from: string; to: string };
type ProductsState = { page: number; pageSize: number };

function useRefState<T>(factory: () => T): T {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const ref = useRef<T>();
    if (!ref.current) ref.current = factory();
    return ref.current;
}

function parsePositive(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normaliseStatusFilter(
    value: string | null | undefined,
): "alle" | "actief" | "inactief" | undefined {
    const raw = (value ?? "").toLowerCase();
    if (raw === "actief" || raw === "inactief" || raw === "alle") return raw;
    return undefined;
}

function readStorage<T>(key: string): T | undefined {
    if (typeof window === "undefined") return undefined;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
        return undefined;
    }
}

function writeStorage<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // negeer storage-fouten
    }
}

function updateUrlParams(entries: Record<string, string | null>): void {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(entries)) {
        if (!value) url.searchParams.delete(key);
        else url.searchParams.set(key, value);
    }
    window.history.replaceState({}, "", url.toString());
}

function useDebounced(value: string, delay: number): string {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

const isAbortError = (error: unknown): boolean =>
    Boolean((error as { name?: string })?.name === "AbortError");

function errorMessage(error: unknown): string {
    if (!error) return "Er ging iets mis.";
    if (typeof error === "string") return error;
    if ((error as ApiError | undefined)?.message) return (error as ApiError).message;
    return "Er ging iets mis. Probeer het later opnieuw.";
}

const freezeRows = <T,>(rows: readonly T[]): readonly T[] => Object.freeze([...rows]);

function isInvalidDateRange(from: string | undefined, to: string | undefined): boolean {
    if (!from || !to) return false;
    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);
    return Number.isFinite(fromMs) && Number.isFinite(toMs) && toMs < fromMs;
}

function clearTimer(timer: ReturnType<typeof setTimeout> | undefined): void {
    if (timer != null) clearTimeout(timer);
}

function schedule(
    run: () => void,
    delay: number,
    activeRef: { current: boolean },
): ReturnType<typeof setTimeout> | undefined {
    if (!activeRef.current) return undefined;
    return setTimeout(() => {
        if (activeRef.current) run();
    }, delay);
}

function computeBackoff(statusCode: number, index: number): { delay: number; nextIndex: number } {
    const serverError = statusCode >= 500 && statusCode < 600;
    if (!serverError) return { delay: POLL_INTERVAL, nextIndex: 0 };
    const capped = Math.min(index, BACKOFF_DELAYS.length - 1);
    return {
        delay: BACKOFF_DELAYS[capped],
        nextIndex: Math.min(capped + 1, BACKOFF_DELAYS.length - 1),
    };
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* Users                                                                       */
/* ──────────────────────────────────────────────────────────────────────────── */

function readUsersState(): UsersState {
    const defaults: UsersState = { page: 1, pageSize: 25, search: "" };
    if (typeof window === "undefined") return defaults;
    const params = new URLSearchParams(window.location.search);
    const stored = readStorage<Partial<UsersState>>(USERS_STORAGE_KEY);
    return {
        page: parsePositive(params.get("vm_users_page")) ?? stored?.page ?? defaults.page,
        pageSize: parsePositive(params.get("vm_users_pageSize")) ?? stored?.pageSize ?? defaults.pageSize,
        search: params.get("vm_users_q") ?? stored?.search ?? defaults.search,
    };
}

/**
 * Retrieves gebruikers with polling and persisted filters.
 */
export function useUserRows(): HookResult<UserRow> {
    const initial = useRefState(readUsersState);
    const [page, setPage] = useState(initial.page);
    const [pageSize, setPageSize] = useState(initial.pageSize);
    const [search, setSearch] = useState(initial.search);
    const debouncedSearch = useDebounced(search, 300);

    const [rows, setRows] = useState<readonly UserRow[]>([]);
    const [hasNext, setHasNext] = useState(false);
    const [totalResults, setTotalResults] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        writeStorage(USERS_STORAGE_KEY, { page, pageSize, search });
    }, [page, pageSize, search]);

    useEffect(() => {
        updateUrlParams({
            vm_users_page: page > 1 ? String(page) : null,
            vm_users_pageSize: pageSize !== 25 ? String(pageSize) : null,
            vm_users_q: search || null,
        });
    }, [page, pageSize, search]);

    useEffect(() => {
        let controller: AbortController | null = null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let initialRun = true;
        let backoffIndex = 0;
        const active = { current: true };

        const load = () => {
            if (!active.current) return;
            controller?.abort();
            controller = new AbortController();
            if (initialRun) setLoading(true);

            getUsers({ q: debouncedSearch || undefined, page, pageSize }, controller.signal)
                .then((list) => {
                    if (!active.current) return;
                    setRows(freezeRows(list.items.map(adaptUser)));
                    setHasNext(list.hasNext);
                    setTotalResults(list.totalResults);
                    setError(null);
                    setLoading(false);
                    initialRun = false;
                    backoffIndex = 0;
                    clearTimer(timer);
                    timer = schedule(load, POLL_INTERVAL, active);
                })
                .catch((err) => {
                    if (!active.current || isAbortError(err)) return;
                    setLoading(false);
                    initialRun = false;
                    setError(errorMessage(err));
                    const status = (err as ApiError | undefined)?.status ?? 0;
                    const { delay, nextIndex } = computeBackoff(status, backoffIndex);
                    backoffIndex = nextIndex;
                    clearTimer(timer);
                    timer = schedule(load, delay, active);
                });
        };

        load();
        return () => {
            active.current = false;
            controller?.abort();
            clearTimer(timer);
        };
    }, [debouncedSearch, page, pageSize]);

    const updateSearch = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const reset = useCallback(() => {
        setPage(1);
        setPageSize(25);
        setSearch("");
    }, []);

    return {
        rows,
        loading,
        error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext,
        totalResults,
        search,
        setSearch: updateSearch,
        reset,
    } satisfies HookResult<UserRow>;
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* Bids                                                                        */
/* ──────────────────────────────────────────────────────────────────────────── */

function readBidsState(): BidsState {
    const defaults: BidsState = { page: 1, pageSize: 10, from: "", to: "" };
    const stored = readStorage<Partial<BidsState>>(BIDS_STORAGE_KEY);
    return { ...defaults, ...(stored ?? {}) };
}

/**
 * Retrieves biedingen for a gebruiker with automatic refresh.
 */
export function useUserBids(gebruikerNr: number | string): HookResult<UserBidRow> {
    const initial = useRefState(readBidsState);
    const [page, setPage] = useState(initial.page);
    const [pageSize, setPageSize] = useState(initial.pageSize);
    const [from, setFrom] = useState(initial.from);
    const [to, setTo] = useState(initial.to);

    const [rows, setRows] = useState<readonly UserBidRow[]>([]);
    const [hasNext, setHasNext] = useState(false);
    const [totalResults, setTotalResults] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        writeStorage(BIDS_STORAGE_KEY, { page, pageSize, from, to });
    }, [page, pageSize, from, to]);

    useEffect(() => {
        const invalidRange = isInvalidDateRange(from, to);
        let controller: AbortController | null = null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let initialRun = true;
        let backoffIndex = 0;
        const active = { current: true };

        if (invalidRange) {
            setError("Ongeldig datumbereik. Controleer de waarden.");
            setLoading(false);
            return () => {
                active.current = false;
                controller?.abort();
                clearTimer(timer);
            };
        }

        const load = () => {
            if (!active.current) return;
            controller?.abort();
            controller = new AbortController();
            if (initialRun) setLoading(true);

            getBids(
                { gebruikerNr, from: from || undefined, to: to || undefined, page, pageSize },
                controller.signal,
            )
                .then((list) => {
                    if (!active.current) return;
                    setRows(freezeRows(list.items.map(adaptBid)));
                    setHasNext(list.hasNext);
                    setTotalResults(list.totalResults);
                    setError(null);
                    setLoading(false);
                    initialRun = false;
                    backoffIndex = 0;
                    clearTimer(timer);
                    timer = schedule(load, POLL_INTERVAL, active);
                })
                .catch((err) => {
                    if (!active.current || isAbortError(err)) return;
                    setLoading(false);
                    initialRun = false;
                    setError(errorMessage(err));
                    const status = (err as ApiError | undefined)?.status ?? 0;
                    const { delay, nextIndex } = computeBackoff(status, backoffIndex);
                    backoffIndex = nextIndex;
                    clearTimer(timer);
                    timer = schedule(load, delay, active);
                });
        };

        load();
        return () => {
            active.current = false;
            controller?.abort();
            clearTimer(timer);
        };
    }, [from, gebruikerNr, page, pageSize, to]);

    const updateFrom = useCallback((value: string) => {
        setFrom(value);
        setPage(1);
    }, []);
    const updateTo = useCallback((value: string) => {
        setTo(value);
        setPage(1);
    }, []);
    const reset = useCallback(() => {
        setPage(1);
        setPageSize(10);
        setFrom("");
        setTo("");
    }, []);

    return {
        rows,
        loading,
        error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext,
        totalResults,
        from,
        setFrom: updateFrom,
        to,
        setTo: updateTo,
        reset,
    } satisfies HookResult<UserBidRow>;
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* Veilingen                                                                   */
/* ──────────────────────────────────────────────────────────────────────────── */

function readAuctionsState(): AuctionsState {
    const defaults: AuctionsState = { page: 1, pageSize: 25, status: "alle", from: "", to: "" };
    if (typeof window === "undefined") return defaults;
    const params = new URLSearchParams(window.location.search);
    const stored = readStorage<Partial<AuctionsState>>(AUCTIONS_STORAGE_KEY) ?? {};
    const status =
        normaliseStatusFilter(params.get("vm_veilingen_status")) ??
        normaliseStatusFilter(stored.status) ??
        defaults.status;

    return {
        page: parsePositive(params.get("vm_veilingen_page")) ?? stored.page ?? defaults.page,
        pageSize: parsePositive(params.get("vm_veilingen_pageSize")) ?? stored.pageSize ?? defaults.pageSize,
        status,
        from: params.get("vm_veilingen_from") ?? stored.from ?? defaults.from,
        to: params.get("vm_veilingen_to") ?? stored.to ?? defaults.to,
    };
}

/**
 * Retrieves veilingen including filters and periodic updates.
 */
export function useVeilingRows(): HookResult<VeilingRow> {
    const initial = useRefState(readAuctionsState);
    const [page, setPage] = useState(initial.page);
    const [pageSize, setPageSize] = useState(initial.pageSize);
    const [status, setStatus] = useState<"alle" | "actief" | "inactief">(initial.status);
    const [from, setFrom] = useState(initial.from);
    const [to, setTo] = useState(initial.to);

    const [rows, setRows] = useState<readonly VeilingRow[]>([]);
    const [hasNext, setHasNext] = useState(false);
    const [totalResults, setTotalResults] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        writeStorage(AUCTIONS_STORAGE_KEY, { page, pageSize, status, from, to });
    }, [page, pageSize, status, from, to]);

    useEffect(() => {
        updateUrlParams({
            vm_veilingen_page: page > 1 ? String(page) : null,
            vm_veilingen_pageSize: pageSize !== 25 ? String(pageSize) : null,
            vm_veilingen_status: status !== "alle" ? status : null,
            vm_veilingen_from: from || null,
            vm_veilingen_to: to || null,
        });
    }, [from, page, pageSize, status, to]);

    useEffect(() => {
        const invalidRange = isInvalidDateRange(from, to);
        let controller: AbortController | null = null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let initialRun = true;
        let backoffIndex = 0;
        const active = { current: true };

        if (invalidRange) {
            setError("Ongeldig datumbereik. Controleer de waarden.");
            setLoading(false);
            return () => {
                active.current = false;
                controller?.abort();
                clearTimer(timer);
            };
        }

        const load = () => {
            if (!active.current) return;
            controller?.abort();
            controller = new AbortController();
            if (initialRun) setLoading(true);

            const onlyActive = status === "actief";
            getAuctions(
                { from: from || undefined, to: to || undefined, onlyActive: onlyActive ? true : undefined, page, pageSize },
                controller.signal,
            )
                .then((list) => {
                    if (!active.current) return;

                    const mapped = list.items.map(adaptAuction);
                    const filtered = status === "inactief" ? mapped.filter((row) => row.status !== "active") : mapped;
                    const frozen = freezeRows(filtered);

                    setRows(frozen);
                    // Als 'inactief' filter meer wegfiltert dan er in de pagina zat, houden we 'hasNext' aan.
                    const derivedHasNext = status === "inactief" && filtered.length < mapped.length ? true : list.hasNext;
                    setHasNext(derivedHasNext);
                    setTotalResults(list.totalResults);
                    setError(null);
                    setLoading(false);

                    initialRun = false;
                    backoffIndex = 0;
                    clearTimer(timer);
                    timer = schedule(load, POLL_INTERVAL, active);
                })
                .catch((err) => {
                    if (!active.current || isAbortError(err)) return;
                    setLoading(false);
                    initialRun = false;
                    setError(errorMessage(err));
                    const statusCode = (err as ApiError | undefined)?.status ?? 0;
                    const { delay, nextIndex } = computeBackoff(statusCode, backoffIndex);
                    backoffIndex = nextIndex;
                    clearTimer(timer);
                    timer = schedule(load, delay, active);
                });
        };

        load();
        return () => {
            active.current = false;
            controller?.abort();
            clearTimer(timer);
        };
    }, [from, page, pageSize, status, to]);

    const updateStatus = useCallback((value: "alle" | "actief" | "inactief") => {
        setStatus(value);
        setPage(1);
    }, []);
    const updateFrom = useCallback((value: string) => {
        setFrom(value);
        setPage(1);
    }, []);
    const updateTo = useCallback((value: string) => {
        setTo(value);
        setPage(1);
    }, []);
    const reset = useCallback(() => {
        setPage(1);
        setPageSize(25);
        setStatus("alle");
        setFrom("");
        setTo("");
    }, []);

    return {
        rows,
        loading,
        error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext,
        totalResults,
        status,
        setStatus: updateStatus,
        from,
        setFrom: updateFrom,
        to,
        setTo: updateTo,
        reset,
    } satisfies HookResult<VeilingRow>;
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* Products by grower                                                          */
/* ──────────────────────────────────────────────────────────────────────────── */

function readProductsState(): ProductsState {
    const defaults: ProductsState = { page: 1, pageSize: 10 };
    const stored = readStorage<Partial<ProductsState>>(PRODUCTS_STORAGE_KEY);
    return { ...defaults, ...(stored ?? {}) };
}

/**
 * Retrieves products for a specific grower.
 */
export function useVeilingProductsByGrower(kwekernr: number | string): HookResult<VeilingProductRow> {
    const initial = useRefState(readProductsState);
    const [page, setPage] = useState(initial.page);
    const [pageSize, setPageSize] = useState(initial.pageSize);

    const [rows, setRows] = useState<readonly VeilingProductRow[]>([]);
    const [hasNext, setHasNext] = useState(false);
    const [totalResults, setTotalResults] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        writeStorage(PRODUCTS_STORAGE_KEY, { page, pageSize });
    }, [page, pageSize]);

    useEffect(() => {
        let controller: AbortController | null = null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let initialRun = true;
        let backoffIndex = 0;
        const active = { current: true };

        const load = () => {
            if (!active.current) return;
            controller?.abort();
            controller = new AbortController();
            if (initialRun) setLoading(true);

            getProductsByGrower(kwekernr, { page, pageSize }, controller.signal)
                .then((list) => {
                    if (!active.current) return;
                    setRows(freezeRows(list.items.map((item) => adaptProduct(item))));
                    setHasNext(list.hasNext);
                    setTotalResults(list.totalResults);
                    setError(null);
                    setLoading(false);
                    initialRun = false;
                    backoffIndex = 0;
                    clearTimer(timer);
                    timer = schedule(load, POLL_INTERVAL, active);
                })
                .catch((err) => {
                    if (!active.current || isAbortError(err)) return;
                    setLoading(false);
                    initialRun = false;
                    setError(errorMessage(err));
                    const status = (err as ApiError | undefined)?.status ?? 0;
                    const { delay, nextIndex } = computeBackoff(status, backoffIndex);
                    backoffIndex = nextIndex;
                    clearTimer(timer);
                    timer = schedule(load, delay, active);
                });
        };

        load();
        return () => {
            active.current = false;
            controller?.abort();
            clearTimer(timer);
        };
    }, [kwekernr, page, pageSize]);

    const reset = useCallback(() => {
        setPage(1);
        setPageSize(10);
    }, []);

    return {
        rows,
        loading,
        error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext,
        totalResults,
        reset,
    } satisfies HookResult<VeilingProductRow>;
}
