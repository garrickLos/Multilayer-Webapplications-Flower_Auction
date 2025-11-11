// src/veilingmeester/data/utils.ts

import type { Query } from '../types/types.ts';


/* Kleine helpers */

// Controleert of waarde niet null/undefined/lege string is.
export const isNonEmpty = <T>(v: T | '' | null | undefined): v is T =>
    v !== undefined && v !== null && v !== '';

// Herken afgebroken of verlopen requests.
export const isAbort = (e: unknown): e is DOMException | Error => {
    const a = e as { name?: unknown; code?: unknown };
    return (
        a?.name === 'AbortError' ||
        a?.name === 'TimeoutError' ||
        a?.code === 20
    );
};

export { normalizeForSearch, rowToSearchString } from '../utils/search';


/* Stable JSON */

// JSON.stringify met vaste sleutelvolgorde, Date→ISO en circular-detectie.
export const stableStringify = (input: unknown): string => {
    const seen = new WeakSet<object>();
    const walk = (v: unknown): unknown => {
        if (v instanceof Date) return { d: v.toISOString() };
        if (v === null || typeof v !== 'object') return v;
        if (seen.has(v as object)) return '[Circular]';
        seen.add(v as object);
        if (Array.isArray(v)) return v.map(walk);
        const o = v as Record<string, unknown>;
        return Object.fromEntries(
            Object.keys(o)
                .sort()
                .map(k => [k, walk(o[k])]),
        );
    };
    return JSON.stringify(walk(input));
};


/* Fetch helpers */

// Bouw querystring op, negeert lege waarden.
const qs = (params: Query): string => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (!isNonEmpty(value)) continue;
        const vals = Array.isArray(value) ? value : [value];
        for (const val of vals) {
            search.append(
                key,
                val instanceof Date ? val.toISOString() : String(val),
            );
        }
    }
    return search.toString();
};

// Standaardvorm API-fouten.
export type ApiErrorLike = Error & {
    name: 'ApiError';
    status: number;
    statusText: string;
    url: string;
    bodyText?: string;
};

const makeApiError = (res: Response, bodyText?: string): ApiErrorLike => {
    const err = new Error(
        `HTTP ${res.status} ${res.statusText} for ${res.url}`,
    ) as ApiErrorLike;
    err.name = 'ApiError';
    err.status = res.status;
    err.statusText = res.statusText;
    err.url = res.url;
    err.bodyText = bodyText;
    return err;
};

// Combineer meerdere AbortSignals tot één.
export const mergeSignals = (
    ...signals: (AbortSignal | undefined)[]
): AbortSignal | undefined => {
    const active = signals.filter((s): s is AbortSignal => Boolean(s));
    if (!active.length) return undefined;

    if (active.some(s => s.aborted)) {
        const c = new AbortController();
        c.abort();
        return c.signal;
    }

    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();

    for (const s of active) s.addEventListener('abort', onAbort, { once: true });
    ctrl.signal.addEventListener(
        'abort',
        () => active.forEach(s => s.removeEventListener('abort', onAbort)),
        { once: true },
    );
    return ctrl.signal;
};

// AbortSignal dat vanzelf abort na x ms (fallback voor oudere omgevingen).
export const timeoutSignal = (ms: number): AbortSignal => {
    const AS = AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal };
    if (typeof AS.timeout === 'function') return AS.timeout(ms);
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    ctrl.signal.addEventListener('abort', () => clearTimeout(id), { once: true });
    return ctrl.signal;
};

export type GetOptions = {
    params?: Query;
    signal?: AbortSignal;
    timeoutMs?: number;
    retry?: number;
    retryBackoffMs?: number;
    init?: RequestInit;
    acceptNotModified?: boolean;
};

// Retrybare fouten: netwerk of 5xx.
const isRetryable = (e: unknown): boolean =>
    !isAbort(e) &&
    (e instanceof TypeError ||
        ((e as ApiErrorLike).name === 'ApiError' &&
            (e as ApiErrorLike).status >= 500 &&
            (e as ApiErrorLike).status < 600));

// Basis fetch met timeout, signal merge, en JSON/text parse.
async function doFetch<T>(
    url: string,
    opts: {
        signal?: AbortSignal;
        timeoutMs?: number;
        init?: RequestInit;
        acceptNotModified?: boolean;
    },
): Promise<{ data: T; headers: Headers; notModified: boolean }> {
    const signal = mergeSignals(
        opts.signal,
        opts.timeoutMs ? timeoutSignal(opts.timeoutMs) : undefined,
    );

    const res = await fetch(url, {
        credentials: 'same-origin',
        ...opts.init,
        signal,
    });

    if (res.status === 304 && opts.acceptNotModified)
        return { data: [] as unknown as T, headers: res.headers, notModified: true };

    if (!res.ok)
        throw makeApiError(res, await res.text().catch(() => undefined));

    if (res.status === 204)
        return { data: undefined as unknown as T, headers: res.headers, notModified: false };

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const data =
        ct.includes('application/json') || ct.includes('+json')
            ? ((await res.json()) as T)
            : ((await res.text()) as unknown as T);

    return { data, headers: res.headers, notModified: false };
}

/* Overloads voor nette types */
async function getWithRetry<T>(
    path: string,
    opt?: GetOptions,
    meta?: false,
): Promise<T>;
async function getWithRetry<T>(
    path: string,
    opt: GetOptions | undefined,
    meta: true,
): Promise<{ data: T; headers: Headers; notModified: boolean }>;

// GET met retry en optionele meta.
async function getWithRetry<T>(
    path: string,
    opt: GetOptions = {},
    meta = false,
): Promise<T | { data: T; headers: Headers; notModified: boolean }> {
    const {
        params = {},
        signal,
        timeoutMs,
        retry = 0,
        retryBackoffMs = 300,
        init,
        acceptNotModified,
    } = opt;

    const url = Object.keys(params).length ? `${path}?${qs(params)}` : path;
    const cap = 10_000;

    for (let attempt = 0; ; attempt++) {
        try {
            const result = await doFetch<T>(url, {
                signal,
                timeoutMs,
                init,
                acceptNotModified,
            });
            return meta ? result : result.data;
        } catch (e) {
            if (!(isRetryable(e) && attempt < retry)) throw e;
            const delay = Math.min(
                retryBackoffMs * 2 ** attempt * (0.5 + Math.random()),
                cap,
            );
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// Publieke variant met meta-info (headers, notModified).
export const apiGetWithMeta = async <T>(
    path: string,
    opt: GetOptions = {},
): Promise<{ data: T; headers: Headers; notModified: boolean }> =>
    getWithRetry<T>(path, opt, true);
