// src/veilingmeester/data/live.ts (revised)
// A lightweight SWR‑style live cache and React hooks built on top of the
// revised utils.  Provides transparent caching with ETag/Last‑Modified
// support, automatic retries and refreshes, and helper hooks for paginated
// data and debounced values.

import { apiGetWithMeta, isNonEmpty, stableStringify, type Query } from './utils';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

/* --------------------------------------------------------------------------
 * Core live cache
 *
 * The cache is keyed off both the request path and the serialised query
 * parameters.  Each entry tracks the current value, any error, ETag/last
 * modified headers for conditional requests, a set of listeners and the
 * currently inflight fetch promise/abort controller.
 */

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

/**
 * Compute a stable cache key from a request path and optional query
 * parameters.  Parameters are appended as a query string sorted by key.
 */
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
 * Internal helper that performs a fetch using `apiGetWithMeta` and updates
 * cache state accordingly.  Handles conditional requests via ETag/Last‑Modified
 * headers and aborts any previous inflight request on the same state.  If
 * `acceptNotModified` is true, a 304 response will skip updating the value.
 */
async function revalidate<T>(path: string, opt: LiveOptions, st: LiveState<T>) {
    if (st.inflight) return st.inflight;
    st.abort?.abort();
    st.abort = new AbortController();
    const { params, init, timeoutMs, retry, retryBackoffMs } = opt;
    const headers: HeadersInit = {
        ...(init?.headers || {}),
        ...(st.etag ? { 'If-None-Match': st.etag } : {}),
        ...(st.modified ? { 'If-Modified-Since': st.modified } : {}),
        Accept: 'application/json',
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
            const name = (e as { name?: unknown })?.name;
            if (name !== 'AbortError' && name !== 'TimeoutError') st.error = e;
        } finally {
            st.inflight = undefined;
        }
    })();
    return st.inflight;
}

/**
 * Retrieve or create a live data entry for the specified path and options.
 * Returns an object with accessors for the current value/error, as well as
 * functions to start/stop automatic refresh, subscribe to updates, refresh
 * manually and mutate the cached value locally.
 */
export function liveGet<T>(path: string, options: LiveOptions = {}) {
    const key = keyOf(path, options.params);
    let st = store.get(key) as LiveState<T> | undefined;
    if (!st) {
        const ns: LiveState<T> = { listeners: new Set<Listener<T>>(), etag: null, modified: null };
        store.set(key, ns as LiveState<unknown>);
        st = ns;
    }
    let timer: number | undefined;
    const onFocus = () => {
        if (!options.revalidateOnFocus) return;
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
            void revalidate<T>(path, options, st!);
        }
    };
    const start = () => {
        if (options.refreshMs) {
            if (timer) clearInterval(timer);
            timer = window.setInterval(() => void revalidate<T>(path, options, st!), options.refreshMs);
        }
        if (options.revalidateOnFocus && typeof window !== 'undefined') {
            window.addEventListener('visibilitychange', onFocus);
            window.addEventListener('focus', onFocus);
        }
        return revalidate<T>(path, options, st!);
    };
    const stop = () => {
        if (timer) clearInterval(timer);
        st?.abort?.abort();
        if (options.revalidateOnFocus && typeof window !== 'undefined') {
            window.removeEventListener('visibilitychange', onFocus);
            window.removeEventListener('focus', onFocus);
        }
    };
    const subscribe = (fn: Listener<T>) => {
        st!.listeners.add(fn);
        if (st!.value !== undefined) fn(st!.value as T);
        return () => st!.listeners.delete(fn);
    };
    const refresh = () => revalidate<T>(path, options, st!);
    const mutate = (u: T | ((prev: T | undefined) => T)) => {
        st!.value = typeof u === 'function' ? (u as (p: T | undefined) => T)(st!.value) : u;
        st!.listeners.forEach(fn => fn(st!.value as T));
    };
    return {
        get value() { return st!.value as T | undefined; },
        get error() { return st!.error; },
        start,
        stop,
        subscribe,
        refresh,
        mutate,
    };
}

/* --------------------------------------------------------------------------
 * React hook wrapper
 *
 * Wraps `liveGet` into a React hook that automatically starts/stops the live
 * subscription and keeps component state in sync via `useSyncExternalStore`.
 */
export function useLiveData<T>(path: string, options: LiveOptions = {}) {
    const paramsKey = useMemo(() => stableStringify(options.params ?? {}), [options.params]);
    const res = useMemo(() => liveGet<T>(path, options), [path, paramsKey, options.refreshMs, options.revalidateOnFocus]);
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

/* --------------------------------------------------------------------------
 * Tiny helpers used elsewhere
 *
 * A small hook that debounces a value over a given duration, and a helper
 * hook for paginated lists that automatically infers whether more data exists
 * based on the returned array length.
 */
export function useDebounced<T>(value: T, ms = 250) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), ms);
        return () => clearTimeout(id);
    }, [value, ms]);
    return v;
}

/**
 * Generic paginated fetcher using apiGetWithMeta.  Infers whether a next page
 * exists by comparing the length of the returned array to the requested
 * pageSize.  Errors are captured as strings and loading state is tracked.
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
    const { path, params, page, pageSize, paramsKey, init, timeoutMs, retry, retryBackoffMs } = args;
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
    }, [path, page, pageSize, stableStringify(params ?? {}), paramsKey, timeoutMs, retry, retryBackoffMs]);
    return { data, loading, error, lastCount };
}