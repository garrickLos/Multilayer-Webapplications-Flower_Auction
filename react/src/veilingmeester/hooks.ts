import { useCallback, useEffect, useMemo, useState } from "react";
import { getAuctions, getBids, getProducts, getUsers } from "./api";
import type { ApiError } from "./api";
import {
    mapAuctionDtoToRow,
    mapBidDtoToRow,
    mapProductDtoToRow,
    mapUserDtoToRow,
    type ListResult,
    type UserBidRow,
    type UserRow,
    type VeilingProductRow,
    type VeilingRow,
} from "./types";

const DEFAULT_PAGE_SIZE = 10;

function usePagination(initialPageSize: number) {
    const [page, setPageState] = useState(1);
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    const setPage = useCallback((value: number) => {
        setPageState((prev) => {
            const next = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : prev;
            return next;
        });
    }, []);

    const setPageSize = useCallback((value: number) => {
        setPageState(1);
        setPageSizeState((prev) => {
            const next = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : prev;
            return next;
        });
    }, []);

    return { page, setPage, pageSize, setPageSize };
}

type AsyncState<T> = {
    loading: boolean;
    error: ApiError | null;
    data: T;
};

function useAsyncState<T>(initial: T): [AsyncState<T>, (updater: Partial<AsyncState<T>>) => void] {
    const [state, setState] = useState<AsyncState<T>>({ data: initial, error: null, loading: false });
    const update = useCallback((updater: Partial<AsyncState<T>>) => {
        setState((prev) => ({ ...prev, ...updater }));
    }, []);
    return [state, update];
}

function useAbortController() {
    const [controller, setController] = useState<AbortController | null>(null);
    useEffect(() => {
        return () => {
            controller?.abort();
        };
    }, [controller]);
    const next = useCallback(() => {
        const ctrl = new AbortController();
        setController((prev) => {
            prev?.abort();
            return ctrl;
        });
        return ctrl;
    }, []);
    return next;
}

function normaliseError(error: unknown): ApiError {
    if (!error) {
        return { status: 0, message: "Onbekende fout" };
    }
    if (typeof error === "object" && "status" in error && "message" in error) {
        return error as ApiError;
    }
    if (error instanceof Error) {
        return { status: 0, message: error.message };
    }
    return { status: 0, message: String(error) };
}

function mapListResult<T, R>(result: ListResult<T>, map: (item: T) => R): { rows: R[]; hasNext: boolean; totalResults?: number } {
    return {
        rows: result.items.map(map),
        hasNext: result.hasNext,
        totalResults: result.totalResults,
    };
}

export function useUserRows() {
    const { page, setPage, pageSize, setPageSize } = usePagination(25);
    const [search, setSearchState] = useState("");
    const createAbort = useAbortController();
    const [state, setState] = useAsyncState<{ rows: UserRow[]; hasNext: boolean; totalResults?: number }>(
        { rows: [], hasNext: false }
    );

    useEffect(() => {
        const controller = createAbort();
        setState({ loading: true, error: null });
        void getUsers({ q: search.trim() || undefined, page, pageSize }, controller.signal)
            .then((result) => {
                if (controller.signal.aborted) return;
                const mapped = mapListResult(result, mapUserDtoToRow);
                setState({ data: mapped, loading: false });
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                setState({ error: normaliseError(error), loading: false, data: { rows: [], hasNext: false } });
            });
        return () => controller.abort();
    }, [createAbort, page, pageSize, search, setState]);

    const setSearch = useCallback((value: string) => {
        setSearchState(value);
        setPage(1);
    }, [setPage]);

    return {
        rows: state.data.rows,
        loading: state.loading,
        error: state.error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext: state.data.hasNext,
        totalResults: state.data.totalResults,
        search,
        setSearch,
    };
}

export function useUserBids(gebruikerNr: number | string | null, options?: { from?: string; to?: string }) {
    const { page, setPage, pageSize, setPageSize } = usePagination(DEFAULT_PAGE_SIZE);
    const createAbort = useAbortController();
    const [state, setState] = useAsyncState<{ rows: UserBidRow[]; hasNext: boolean; totalResults?: number }>(
        { rows: [], hasNext: false }
    );

    const from = options?.from;
    const to = options?.to;

    useEffect(() => {
        setPage(1);
    }, [gebruikerNr, setPage]);

    useEffect(() => {
        if (gebruikerNr == null || gebruikerNr === "") {
            setState({ data: { rows: [], hasNext: false }, loading: false });
            return;
        }
        const controller = createAbort();
        setState({ loading: true, error: null });
        void getBids({ gebruikerNr, page, pageSize }, controller.signal)
            .then((result) => {
                if (controller.signal.aborted) return;
                let mapped = mapListResult(result, mapBidDtoToRow);
                if (from || to) {
                    mapped = {
                        ...mapped,
                        rows: mapped.rows.filter((row) => {
                            const iso = row.datumIso;
                            if (!iso) return false;
                            const date = new Date(iso);
                            if (Number.isNaN(date.getTime())) return false;
                            if (from && date < new Date(from)) return false;
                            if (to) {
                                const toDate = new Date(to);
                                if (!Number.isNaN(toDate.getTime()) && date > toDate) return false;
                            }
                            return true;
                        }),
                    };
                }
                setState({ data: mapped, loading: false });
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                setState({ error: normaliseError(error), loading: false, data: { rows: [], hasNext: false } });
            });
        return () => controller.abort();
    }, [createAbort, from, gebruikerNr, page, pageSize, setState, to]);

    return {
        rows: state.data.rows,
        loading: state.loading,
        error: state.error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext: state.data.hasNext,
        totalResults: state.data.totalResults,
    };
}

export function useVeilingRows() {
    const { page, setPage, pageSize, setPageSize } = usePagination(25);
    const [status, setStatusState] = useState<"alle" | "actief" | "inactief">("alle");
    const [from, setFromState] = useState<string | undefined>();
    const [to, setToState] = useState<string | undefined>();
    const createAbort = useAbortController();
    const [state, setState] = useAsyncState<{ rows: VeilingRow[]; hasNext: boolean; totalResults?: number }>(
        { rows: [], hasNext: false }
    );

    useEffect(() => {
        const controller = createAbort();
        setState({ loading: true, error: null });
        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime()) && toDate < fromDate) {
                setState({ data: { rows: [], hasNext: false }, loading: false });
                controller.abort();
                return () => controller.abort();
            }
        }
        void getAuctions({
            page,
            pageSize,
            from,
            to,
            onlyActive: status === "actief",
        }, controller.signal)
            .then((result) => {
                if (controller.signal.aborted) return;
                let mapped = mapListResult(result, mapAuctionDtoToRow);
                if (status === "actief") {
                    mapped = {
                        ...mapped,
                        rows: mapped.rows.filter((row) => row.status === "active"),
                    };
                } else if (status === "inactief") {
                    mapped = {
                        ...mapped,
                        rows: mapped.rows.filter((row) => row.status !== "active"),
                    };
                }
                setState({ data: mapped, loading: false });
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                setState({ error: normaliseError(error), loading: false, data: { rows: [], hasNext: false } });
            });
        return () => controller.abort();
    }, [createAbort, from, page, pageSize, setState, status, to]);

    const setStatus = useCallback((value: "alle" | "actief" | "inactief") => {
        setStatusState(value);
        setPage(1);
    }, [setPage]);

    const setFrom = useCallback((value?: string) => {
        setFromState(value);
        setPage(1);
    }, [setPage]);

    const setTo = useCallback((value?: string) => {
        setToState(value);
        setPage(1);
    }, [setPage]);

    return {
        rows: state.data.rows,
        loading: state.loading,
        error: state.error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext: state.data.hasNext,
        totalResults: state.data.totalResults,
        status,
        setStatus,
        from,
        setFrom,
        to,
        setTo,
    };
}

export function useVeilingProducts(params: { categorieNr?: number | string; search?: string; pageSize?: number }) {
    const { page, setPage, pageSize, setPageSize } = usePagination(params.pageSize ?? 25);
    const createAbort = useAbortController();
    const search = params.search?.trim();
    const categorieNr = params.categorieNr;
    const [state, setState] = useAsyncState<{ rows: VeilingProductRow[]; hasNext: boolean; totalResults?: number }>(
        { rows: [], hasNext: false }
    );

    useEffect(() => {
        const controller = createAbort();
        setState({ loading: true, error: null });
        void getProducts({ q: search, categorieNr, page, pageSize }, controller.signal)
            .then((result) => {
                if (controller.signal.aborted) return;
                const mapped = mapListResult(result, (dto) => mapProductDtoToRow(dto));
                setState({ data: mapped, loading: false });
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                setState({ error: normaliseError(error), loading: false, data: { rows: [], hasNext: false } });
            });
        return () => controller.abort();
    }, [categorieNr, createAbort, page, pageSize, search, setState]);

    return useMemo(() => ({
        rows: state.data.rows,
        loading: state.loading,
        error: state.error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext: state.data.hasNext,
        totalResults: state.data.totalResults,
    }), [page, pageSize, setPage, setPageSize, state]);
}
