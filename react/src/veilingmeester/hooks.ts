import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiError } from "./api";
import { getAuctions, getBids, getProductsByGrower, getUsers } from "./api";
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

const USERS_STORAGE_KEY = "vm_users_filters";
const AUCTIONS_STORAGE_KEY = "vm_veilingen_filters";
const BIDS_STORAGE_KEY = "vm_bids_filters";
const PRODUCTS_STORAGE_KEY = "vm_products_filters";

const RETRY_DELAYS = [500, 1000, 2000] as const;

type CacheEntry<T> = {
    rows: readonly T[];
    hasNext: boolean;
    totalResults?: number;
};

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

const cache = new Map<string, CacheEntry<unknown>>();

function readCache<T>(key: string): CacheEntry<T> | undefined {
    return cache.get(key) as CacheEntry<T> | undefined;
}

function writeCache<T>(key: string, entry: CacheEntry<T>): void {
    cache.set(key, entry);
}

function useRefState<T>(factory: () => T): T {
    const ref = useRef<T>();
    if (!ref.current) {
        ref.current = factory();
    }
    return ref.current;
}

function readUsersState(): UsersState {
    const defaults: UsersState = { page: 1, pageSize: 25, search: "" };
    if (typeof window === "undefined") return defaults;
    const params = new URLSearchParams(window.location.search);
    const stored = readStorage<Partial<UsersState>>(USERS_STORAGE_KEY);
    const merged: UsersState = {
        ...defaults,
        ...(stored ?? {}),
    };
    const pageParam = parseNumber(params.get("vm_users_page"));
    const sizeParam = parseNumber(params.get("vm_users_pageSize"));
    const searchParam = params.get("vm_users_q");
    return {
        page: pageParam ?? merged.page,
        pageSize: sizeParam ?? merged.pageSize,
        search: searchParam ?? merged.search,
    };
}

function readAuctionsState(): AuctionsState {
    const defaults: AuctionsState = { page: 1, pageSize: 25, status: "alle", from: "", to: "" };
    if (typeof window === "undefined") return defaults;
    const params = new URLSearchParams(window.location.search);
    const stored = readStorage<Partial<AuctionsState>>(AUCTIONS_STORAGE_KEY);
    const merged: AuctionsState = {
        ...defaults,
        ...(stored ?? {}),
    };
    return {
        page: parseNumber(params.get("vm_veilingen_page")) ?? merged.page,
        pageSize: parseNumber(params.get("vm_veilingen_pageSize")) ?? merged.pageSize,
        status:
            normaliseStatusFilter(params.get("vm_veilingen_status")) ??
            normaliseStatusFilter(merged.status) ??
            "alle",
        from: params.get("vm_veilingen_from") ?? merged.from,
        to: params.get("vm_veilingen_to") ?? merged.to,
    };
}

function readBidsState(): BidsState {
    const defaults: BidsState = { page: 1, pageSize: 10, from: "", to: "" };
    if (typeof window === "undefined") return defaults;
    const stored = readStorage<Partial<BidsState>>(BIDS_STORAGE_KEY);
    return { ...defaults, ...(stored ?? {}) };
}

function readProductsState(): ProductsState {
    const defaults: ProductsState = { page: 1, pageSize: 10 };
    if (typeof window === "undefined") return defaults;
    const stored = readStorage<Partial<ProductsState>>(PRODUCTS_STORAGE_KEY);
    return { ...defaults, ...(stored ?? {}) };
}

function parseNumber(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normaliseStatusFilter(
    value: string | null | undefined,
): "alle" | "actief" | "inactief" | undefined {
    const raw = (value ?? "").toLowerCase();
    if (raw === "actief") return "actief";
    if (raw === "inactief") return "inactief";
    if (raw === "alle") return "alle";
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
        // stille failure
    }
}

function updateUrlParams(entries: Record<string, string | null>): void {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(entries)) {
        if (value == null || value === "") {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    }
    window.history.replaceState({}, "", url.toString());
}

function useDebounced(value: string, delay: number): string {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer: ReturnType<typeof setTimeout> = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

function isAbort(error: unknown): boolean {
    return Boolean((error as { name?: string })?.name === "AbortError");
}

async function fetchWithRetry<T>(loader: () => Promise<T>, signal: AbortSignal): Promise<T> {
    let attempt = 0;
    for (;;) {
        try {
            return await loader();
        } catch (error) {
            if (isAbort(error) || signal.aborted) {
                throw error;
            }
            const status = (error as ApiError | undefined)?.status;
            if (status == null || status < 500 || status >= 600 || attempt >= RETRY_DELAYS.length) {
                throw error;
            }
            const delay = RETRY_DELAYS[attempt];
            attempt += 1;
            await new Promise((resolve) => {
                const timeout = window.setTimeout(resolve, delay);
                signal.addEventListener("abort", () => {
                    window.clearTimeout(timeout);
                    resolve(undefined);
                });
            });
        }
    }
}

function errorMessage(error: unknown): string {
    if (!error) return "Er ging iets mis.";
    if (typeof error === "string") return error;
    if ((error as ApiError | undefined)?.message) {
        return (error as ApiError).message;
    }
    return "Er ging iets mis. Probeer het opnieuw.";
}

function freezeRows<T>(rows: readonly T[]): readonly T[] {
    return Object.freeze([...rows]);
}

export function useUserRows(): HookResult<UserRow> {
    const initial = useRefState(readUsersState);
    const initialKey = useMemo(
        () => `users:${initial.page}:${initial.pageSize}:${initial.search}`,
        [initial.page, initial.pageSize, initial.search],
    );
    const cached = readCache<UserRow>(initialKey);

    const [page, setPage] = useState(initial.page);
    const [pageSize, setPageSize] = useState(initial.pageSize);
    const [search, setSearch] = useState(initial.search);
    const debouncedSearch = useDebounced(search, 300);
    const [rows, setRows] = useState<readonly UserRow[]>(cached?.rows ?? []);
    const [hasNext, setHasNext] = useState(cached?.hasNext ?? false);
    const [totalResults, setTotalResults] = useState<number | undefined>(cached?.totalResults);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        writeStorage(USERS_STORAGE_KEY, { page, pageSize, search });
    }, [page, pageSize, search]);

    useEffect(() => {
        updateUrlParams({
            vm_users_page: page > 1 ? String(page) : null,
            vm_users_pageSize: pageSize !== 25 ? String(pageSize) : null,
            vm_users_q: search ? search : null,
        });
    }, [page, pageSize, search]);

    const key = useMemo(
        () => `users:${page}:${pageSize}:${debouncedSearch}`,
        [page, pageSize, debouncedSearch],
    );

    useEffect(() => {
        const cachedEntry = readCache<UserRow>(key);
        if (cachedEntry) {
            setRows(cachedEntry.rows);
            setHasNext(cachedEntry.hasNext);
            setTotalResults(cachedEntry.totalResults);
        }
    }, [key]);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        fetchWithRetry(
            () =>
                getUsers({ q: debouncedSearch || undefined, page, pageSize }, controller.signal).then((list) => {
                    const mapped = freezeRows(list.items.map(adaptUser));
                    writeCache<UserRow>(key, {
                        rows: mapped,
                        hasNext: list.hasNext,
                        totalResults: list.totalResults,
                    });
                    if (!active) return list;
                    setRows(mapped);
                    setHasNext(list.hasNext);
                    setTotalResults(list.totalResults);
                    return list;
                }),
            controller.signal,
        ).catch((err) => {
            if (isAbort(err) || !active) return;
            setError(errorMessage(err));
        }).finally(() => {
            if (active) {
                setLoading(false);
            }
        });

        return () => {
            active = false;
            controller.abort();
        };
    }, [debouncedSearch, key, page, pageSize]);

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
        setSearch,
        reset,
    } satisfies HookResult<UserRow>;
}

export function useUserBids(gebruikerNr: number | string): HookResult<UserBidRow> {
    const initial = useRefState(readBidsState);
    const keyBase = `bids:${gebruikerNr}`;
    const cached = readCache<UserBidRow>(`${keyBase}:${initial.page}:${initial.pageSize}:${initial.from}:${initial.to}`);

    const [page, setPage] = useState(initial.page);
    const [pageSize, setPageSize] = useState(initial.pageSize);
    const [from, setFrom] = useState(initial.from);
    const [to, setTo] = useState(initial.to);
    const [rows, setRows] = useState<readonly UserBidRow[]>(cached?.rows ?? []);
    const [hasNext, setHasNext] = useState(cached?.hasNext ?? false);
    const [totalResults, setTotalResults] = useState<number | undefined>(cached?.totalResults);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        writeStorage(BIDS_STORAGE_KEY, { page, pageSize, from, to });
    }, [page, pageSize, from, to]);

    const key = useMemo(
        () => `${keyBase}:${page}:${pageSize}:${from || ""}:${to || ""}`,
        [keyBase, page, pageSize, from, to],
    );

    useEffect(() => {
        const cachedEntry = readCache<UserBidRow>(key);
        if (cachedEntry) {
            setRows(cachedEntry.rows);
            setHasNext(cachedEntry.hasNext);
            setTotalResults(cachedEntry.totalResults);
        }
    }, [key]);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        const invalidRange = Boolean(from && to && to < from);
        if (invalidRange) {
            setLoading(false);
            setError("Ongeldig datumbereik. Controleer de waarden.");
            return () => {
                active = false;
                controller.abort();
            };
        }
        setLoading(true);
        setError(null);
        fetchWithRetry(
            () =>
                getBids(
                    {
                        gebruikerNr,
                        from: from || undefined,
                        to: to || undefined,
                        page,
                        pageSize,
                    },
                    controller.signal,
                ).then((list) => {
                    const mapped = freezeRows(list.items.map(adaptBid));
                    writeCache<UserBidRow>(key, {
                        rows: mapped,
                        hasNext: list.hasNext,
                        totalResults: list.totalResults,
                    });
                    if (!active) return list;
                    setRows(mapped);
                    setHasNext(list.hasNext);
                    setTotalResults(list.totalResults);
                    return list;
                }),
            controller.signal,
        ).catch((err) => {
            if (isAbort(err) || !active) return;
            setError(errorMessage(err));
        }).finally(() => {
            if (active) setLoading(false);
        });

        return () => {
            active = false;
            controller.abort();
        };
    }, [from, gebruikerNr, key, page, pageSize, to]);

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
        setFrom,
        to,
        setTo,
        reset,
    } satisfies HookResult<UserBidRow>;
}

export function useVeilingRows(): HookResult<VeilingRow> {
    const initial = useRefState(readAuctionsState);
    const keyBase = `auctions:${initial.status}:${initial.from}:${initial.to}`;
    const cached = readCache<VeilingRow>(`${keyBase}:${initial.page}:${initial.pageSize}`);

    const [page, setPage] = useState(initial.page);
    const [pageSize, setPageSize] = useState(initial.pageSize);
    const [status, setStatus] = useState<"alle" | "actief" | "inactief">(initial.status);
    const [from, setFrom] = useState(initial.from);
    const [to, setTo] = useState(initial.to);
    const [rows, setRows] = useState<readonly VeilingRow[]>(cached?.rows ?? []);
    const [hasNext, setHasNext] = useState(cached?.hasNext ?? false);
    const [totalResults, setTotalResults] = useState<number | undefined>(cached?.totalResults);
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

    const key = useMemo(
        () => `auctions:${status}:${from || ""}:${to || ""}:${page}:${pageSize}`,
        [status, from, to, page, pageSize],
    );

    useEffect(() => {
        const cachedEntry = readCache<VeilingRow>(key);
        if (cachedEntry) {
            setRows(cachedEntry.rows);
            setHasNext(cachedEntry.hasNext);
            setTotalResults(cachedEntry.totalResults);
        }
    }, [key]);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        const onlyActive = status === "actief";
        fetchWithRetry(
            () =>
                getAuctions(
                    {
                        from: from || undefined,
                        to: to || undefined,
                        onlyActive,
                        page,
                        pageSize,
                    },
                    controller.signal,
                ).then((list) => {
                    const mappedRows = list.items.map(adaptAuction);
                    const filteredRows = status === "inactief" ? mappedRows.filter((row) => row.status !== "active") : mappedRows;
                    const frozen = freezeRows(filteredRows);
                    writeCache<VeilingRow>(key, {
                        rows: frozen,
                        hasNext: status === "inactief" ? list.hasNext || filteredRows.length < mappedRows.length : list.hasNext,
                        totalResults: list.totalResults,
                    });
                    if (!active) return list;
                    setRows(frozen);
                    setHasNext(status === "inactief" ? list.hasNext || filteredRows.length < mappedRows.length : list.hasNext);
                    setTotalResults(list.totalResults);
                    return list;
                }),
            controller.signal,
        ).catch((err) => {
            if (isAbort(err) || !active) return;
            setError(errorMessage(err));
        }).finally(() => {
            if (active) setLoading(false);
        });

        return () => {
            active = false;
            controller.abort();
        };
    }, [from, key, page, pageSize, status, to]);

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
        setStatus,
        from,
        setFrom,
        to,
        setTo,
        reset,
    } satisfies HookResult<VeilingRow>;
}

export function useVeilingProductsByGrower(kwekernr: number | string): HookResult<VeilingProductRow> {
    const initial = useRefState(readProductsState);
    const keyBase = `products:${kwekernr}`;
    const cached = readCache<VeilingProductRow>(`${keyBase}:${initial.page}:${initial.pageSize}`);

    const [page, setPage] = useState(initial.page);
    const [pageSize, setPageSize] = useState(initial.pageSize);
    const [rows, setRows] = useState<readonly VeilingProductRow[]>(cached?.rows ?? []);
    const [hasNext, setHasNext] = useState(cached?.hasNext ?? false);
    const [totalResults, setTotalResults] = useState<number | undefined>(cached?.totalResults);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        writeStorage(PRODUCTS_STORAGE_KEY, { page, pageSize });
    }, [page, pageSize]);

    const key = useMemo(() => `${keyBase}:${page}:${pageSize}`, [keyBase, page, pageSize]);

    useEffect(() => {
        const cachedEntry = readCache<VeilingProductRow>(key);
        if (cachedEntry) {
            setRows(cachedEntry.rows);
            setHasNext(cachedEntry.hasNext);
            setTotalResults(cachedEntry.totalResults);
        }
    }, [key]);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        fetchWithRetry(
            () =>
                getProductsByGrower(kwekernr, { page, pageSize }, controller.signal).then((list) => {
                    const mapped = freezeRows(list.items.map((item) => adaptProduct(item)));
                    writeCache<VeilingProductRow>(key, {
                        rows: mapped,
                        hasNext: list.hasNext,
                        totalResults: list.totalResults,
                    });
                    if (!active) return list;
                    setRows(mapped);
                    setHasNext(list.hasNext);
                    setTotalResults(list.totalResults);
                    return list;
                }),
            controller.signal,
        ).catch((err) => {
            if (isAbort(err) || !active) return;
            setError(errorMessage(err));
        }).finally(() => {
            if (active) setLoading(false);
        });

        return () => {
            active = false;
            controller.abort();
        };
    }, [kwekernr, key, page, pageSize]);

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

