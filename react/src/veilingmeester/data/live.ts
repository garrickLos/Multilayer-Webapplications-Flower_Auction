// src/veilingmeester/data/live.ts
// SWR-achtige live cache en React hooks met ETag/Last-Modified, retries en refresh.

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { apiGetWithMeta, isNonEmpty, stableStringify, type Query, isAbort } from './utils';

/* -------------------------------------------------------------------------- */
/* Core live cache                                                            */
/* -------------------------------------------------------------------------- */

type Listener<T> = (value: T) => void;

type LiveState<T> = {
    value?: T;
    error?: unknown;
    etag?: string | null;
    modified?: string | null;
    listeners: Set<Listener<T>>;
    inflight?: Promise<void>;
    abort?: AbortController;
};

const store = new Map<string, LiveState<unknown>>();

/** Stable key op basis van pad + query-params. */
const keyOf = (path: string, params?: Query) => {
    if (!params || !Object.keys(params).length) return path;
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (!isNonEmpty(v)) continue;
        const vals = Array.isArray(v) ? v : [v];
        for (const val of vals) {
            search.append(k, val instanceof Date ? val.toISOString() : String(val));
        }
    }
    const qs = search.toString();
    return qs ? `${path}?${qs}` : path;
};

export type LiveOptions = {
    params?: Query;
    init?: RequestInit;
    timeoutMs?: number;
    retry?: number;
    retryBackoffMs?: number;
    refreshMs?: number;
    revalidateOnFocus?: boolean;
};

/**
 * Eén fetch + cache-update (ETag/Last-Modified). Abort vorige inflight, sla
 * nieuwe waarde/error op en notify listeners.
 */
async function revalidate<T>(path: string, opt: LiveOptions, st: LiveState<T>) {
    if (st.inflight) return st.inflight;

    st.abort?.abort();
    st.abort = new AbortController();

    const { params, init, timeoutMs, retry, retryBackoffMs } = opt;
    const headers: HeadersInit = {
        Accept: 'application/json',
        ...(init?.headers || {}),
        ...(st.etag ? { 'If-None-Match': st.etag } : {}),
        ...(st.modified ? { 'If-Modified-Since': st.modified } : {}),
    };

    st.inflight = (async () => {
        try {
            const res = await apiGetWithMeta<T>(path, {
                params,
                init: { ...init, headers, signal: st.abort!.signal },
                timeoutMs,
                retry,
                retryBackoffMs,
                acceptNotModified: true,
            });

            if (!res.notModified) {
                st.value = res.data;
                st.error = undefined;
                st.etag = res.headers.get('etag');
                st.modified = res.headers.get('last-modified');
                st.listeners.forEach(fn => fn(st.value as T));
            }
        } catch (e) {
            if (!isAbort(e)) st.error = e;
        } finally {
            st.inflight = undefined;
        }
    })();

    return st.inflight;
}

/**
 * Haal of maak een live entry voor path+params. Geeft getters en helpers terug
 * om te starten/stoppen, te subscriben, te refreshen en lokaal te muteren.
 */
export function liveGet<T>(path: string, options: LiveOptions = {}) {
    const key = keyOf(path, options.params);
    let st = store.get(key) as LiveState<T> | undefined;
    if (!st) {
        const ns: LiveState<T> = {
            listeners: new Set<Listener<T>>(),
            etag: null,
            modified: null,
        };
        store.set(key, ns as LiveState<unknown>);
        st = ns;
    }

    let timer: number | undefined;
    let focusBound = false;

    const onFocus = () => {
        if (!options.revalidateOnFocus) return;
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
            void revalidate<T>(path, options, st!);
        }
    };

    const start = () => {
        if (options.refreshMs) {
            if (timer) clearInterval(timer);
            timer = window.setInterval(
                () => void revalidate<T>(path, options, st!),
                options.refreshMs,
            );
        }
        if (options.revalidateOnFocus && typeof window !== 'undefined' && !focusBound) {
            focusBound = true;
            window.addEventListener('visibilitychange', onFocus);
            window.addEventListener('focus', onFocus);
        }
        return revalidate<T>(path, options, st!);
    };

    const stop = () => {
        if (timer) clearInterval(timer);
        st?.abort?.abort();
        if (options.revalidateOnFocus && typeof window !== 'undefined' && focusBound) {
            window.removeEventListener('visibilitychange', onFocus);
            window.removeEventListener('focus', onFocus);
            focusBound = false;
        }
    };

    const subscribe = (fn: Listener<T>) => {
        st!.listeners.add(fn);
        if (st!.value !== undefined) fn(st!.value as T);
        return () => st!.listeners.delete(fn);
    };

    const refresh = () => revalidate<T>(path, options, st!);

    const mutate = (u: T | ((prev: T | undefined) => T)) => {
        st!.value =
            typeof u === 'function'
                ? (u as (p: T | undefined) => T)(st!.value)
                : u;
        st!.listeners.forEach(fn => fn(st!.value as T));
    };

    return {
        get value() {
            return st!.value as T | undefined;
        },
        get error() {
            return st!.error;
        },
        start,
        stop,
        subscribe,
        refresh,
        mutate,
    };
}

/* -------------------------------------------------------------------------- */
/* React hook wrapper                                                         */
/* -------------------------------------------------------------------------- */

export function useLiveData<T>(path: string, options: LiveOptions = {}) {
    // Stable key alleen op params, rest zit expliciet in de dependency array
    const paramsKey = useMemo(
        () => stableStringify(options.params ?? {}),
        [options.params],
    );

    const res = useMemo(
        () => liveGet<T>(path, options),
        [
            path,
            paramsKey,
            options.refreshMs,
            options.revalidateOnFocus,
            options.timeoutMs,
            options.retry,
            options.retryBackoffMs,
            // init is meestal stabiel, maar voor de zekerheid
            stableStringify(options.init ?? {}),
        ],
    );

    const data = useSyncExternalStore(
        cb => res.subscribe(() => cb()),
        () => res.value,
        () => res.value,
    );

    useEffect(() => {
        res.start();
        return () => res.stop();
    }, [res]);

    return { data, error: res.error, refresh: res.refresh, mutate: res.mutate };
}

/* -------------------------------------------------------------------------- */
/* Paginatie helpers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Eénmalige paginated fetcher (zonder live cache).
 */
export function usePagedList<T>(args: {
    path: string;
    params?: Query;
    page: number;
    pageSize: number;
    paramsKey: string;
    init?: RequestInit;
    timeoutMs?: number;
    retry?: number;
    retryBackoffMs?: number;
}) {
    const {
        path,
        params,
        page,
        pageSize,
        paramsKey,
        init,
        timeoutMs,
        retry,
        retryBackoffMs,
    } = args;

    const [data, setData] = useState<ReadonlyArray<T>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastCount, setLastCount] = useState(0);

    useEffect(() => {
        const ctl = new AbortController();
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const res = await apiGetWithMeta<ReadonlyArray<T>>(path, {
                    params: { ...(params || {}), page, pageSize },
                    init: { ...(init || {}), signal: ctl.signal },
                    timeoutMs,
                    retry,
                    retryBackoffMs,
                    acceptNotModified: false,
                });

                if (!ctl.signal.aborted) {
                    const list = Array.isArray(res.data) ? res.data : [];
                    setData(list);
                    setLastCount(list.length);
                }
            } catch (e) {
                if (!ctl.signal.aborted) {
                    setError((e as Error)?.message ?? 'Fout bij laden');
                }
            } finally {
                if (!ctl.signal.aborted) setLoading(false);
            }
        })();

        return () => ctl.abort();
    }, [path, page, pageSize, paramsKey, timeoutMs, retry, retryBackoffMs]);

    return { data, loading, error, lastCount };
}

/**
 * Live variant voor paginated lijsten, op basis van `useLiveData`.
 */
export function useLivePagedList<T>(args: {
    path: string;
    params?: Query;
    page: number;
    pageSize: number;
    paramsKey: string;
    init?: RequestInit;
    refreshMs?: number;
    revalidateOnFocus?: boolean;
}): {
    data: ReadonlyArray<T>;
    loading: boolean;
    error: unknown;
    lastCount: number;
} {
    const { path, params, page, pageSize, init, refreshMs, revalidateOnFocus } =
        args;

    const { data, error } = useLiveData<ReadonlyArray<T>>(path, {
        params: { ...(params || {}), page, pageSize },
        init,
        refreshMs,
        revalidateOnFocus,
    });

    const loading = data === undefined && !error;
    const lastCount = data ? data.length : 0;

    return { data: data || [], loading, error, lastCount };
}
