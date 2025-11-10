// src/veilingmeester/data/utils.ts (revised)
// A cleaned‑up and more concise version of the core utilities.  Functions are
// restructured to reduce duplication, simplify logic and improve readability
// while retaining the original behaviour.

export type MaybeNumber = number | '' | null | undefined;

export type Bieding = Partial<{
    biedNr: number;
    bedragPerFust: number;
    aantalStuks: number;
    gebruikerNr: number;
    veilingNr: number;
}> & Record<string, unknown>;

export type Veilingproduct = Partial<{
    veilingProductNr: number;
    naam: string | null;
    geplaatstDatum: string;
    fust: number;
    voorraad: number;
    startprijs: number;
    categorieNr: number;
}> & Record<string, unknown>;

export type Categorie = Partial<{
    categorieNr: number;
    naam: string;
    id: number;
    name: string;
}> & Record<string, unknown>;

/**
 * Utility for exhaustive type checking.  If called, it will always throw an
 * error; use it in `switch` statements to ensure all variants are covered.
 */
export const assertNever = (x: never, msg = 'Unexpected variant'): never => {
    throw new Error(`${msg}: ${String(x)}`);
};

/* --------------------------------------------------------------------------
 * Small helpers
 *
 * A handful of simple helpers used throughout the codebase.  These helpers
 * avoid null/undefined handling boilerplate and provide type guards for
 * common cases such as abort errors.
 */

/**
 * Type guard that checks a value is neither null, undefined nor the empty
 * string.  Useful when iterating optional values or building query strings.
 */
export const isNonEmpty = <T>(v: T | '' | null | undefined): v is T =>
    v !== undefined && v !== null && v !== '';

/**
 * Checks if the given error is related to an abort or timeout.  Supports
 * DOMException and the legacy numeric code used by some browsers.
 */
export const isAbort = (e: unknown): e is DOMException | Error => {
    const a = e as { name?: unknown; code?: unknown };
    return a?.name === 'AbortError' || a?.name === 'TimeoutError' || a?.code === 20;
};

/**
 * Attempts to coerce a MaybeNumber into a finite number.  Empty strings,
 * `null` and `undefined` return `undefined`.  Strings containing a comma as
 * decimal separator are normalised to a dot.  Non‑finite numbers also yield
 * `undefined`.
 */
export const toIntOrUndef = (v: MaybeNumber): number | undefined => {
    if (!isNonEmpty(v)) return;
    const num = typeof v === 'number'
        ? v
        : Number(String(v).trim().replace(/,([0-9]+)/, '.$1'));
    return Number.isFinite(num) ? num : undefined;
};

/**
 * Retrieve a numeric identifier from a category.  Falls back through
 * `categorieNr` then `id`; returns `undefined` if neither is present or a
 * non‑number.
 */
export const getCategorieId = (c: Categorie) =>
    typeof c.categorieNr === 'number' ? c.categorieNr
        : typeof c.id === 'number' ? c.id
            : undefined;

/**
 * Retrieve the name from a category.  Falls back through `naam` then
 * `name`; returns an empty string if neither is present or a non‑string.
 */
export const getCategorieNaam = (c: Categorie) =>
    typeof c.naam === 'string' ? c.naam
        : typeof c.name === 'string' ? c.name
            : '';

/**
 * Normalise a string for case‑insensitive search by removing diacritics and
 * control characters, collapsing whitespace and lower‑casing the result.
 */
export const normalizeForSearch = (s: string) =>
    s.normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .replace(/\p{Cc}+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

/**
 * Flatten an object graph into a searchable string.  Traverses both arrays
 * and objects (cycle‑safe) and collects all primitive values into a single
 * space‑delimited string.  Limits traversal breadth and output length to
 * prevent runaway expansion.  The result is normalised via
 * `normalizeForSearch`.
 */
export function rowToSearchString(
    row: Record<string, unknown>,
    maxNodes = 5_000,
    maxLen = 100_000,
): string {
    const out: string[] = [];
    const stack: unknown[] = [row];
    const seen = new WeakSet<object>();
    let nodes = 0;
    while (stack.length && nodes < maxNodes) {
        const v = stack.pop();
        if (v == null) { nodes++; continue; }
        const t = typeof v;
        if (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint') {
            out.push(String(v));
        } else if (v instanceof Date && !isNaN(v.getTime())) {
            out.push(v.toISOString());
        } else if (Array.isArray(v)) {
            // push children for breadth first traversal
            stack.push(...v);
        } else if (t === 'object' && !seen.has(v as object)) {
            seen.add(v as object);
            stack.push(...Object.values(v as Record<string, unknown>));
        }
        nodes++;
    }
    const result = normalizeForSearch(out.join(' '));
    return result.length > maxLen ? result.slice(0, maxLen) : result;
}

/* --------------------------------------------------------------------------
 * Stable JSON
 *
 * Deterministically serialise arbitrary values to JSON.  Handles
 * `Date` objects by serialising them as `{ d: '...' }` and sorts object keys
 * lexicographically.  Cycles are detected and replaced with a `"[Circular]"`
 * marker.
 */

export const stableStringify = (input: unknown): string => {
    const seen = new WeakSet<object>();
    const walk = (v: unknown): unknown => {
        if (v instanceof Date) return { d: v.toISOString() };
        if (v === null || typeof v !== 'object') return v;
        if (seen.has(v as object)) return '[Circular]';
        seen.add(v as object);
        if (Array.isArray(v)) return v.map(walk);
        const o = v as Record<string, unknown>;
        return Object.fromEntries(Object.keys(o).sort().map(key => [key, walk(o[key])]));
    };
    return JSON.stringify(walk(input));
};

/* --------------------------------------------------------------------------
 * Fetch helpers (retry + timeout + conditional)
 *
 * A small wrapper around the native `fetch` that supports query parameter
 * construction, retries with exponential backoff, timeouts via AbortSignal
 * and conditional GETs that can return metadata along with the response
 * body.
 */

export type QueryValue = string | number | boolean | Date |
    readonly (string | number | boolean | Date)[] | undefined;

export type Query = Readonly<Record<string, QueryValue>>;

// Build a query string from an object.  Arrays are expanded into repeated
// parameters; dates are ISO‑stringified.  Empty values are omitted.
const qs = (params: Query): string => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (!isNonEmpty(value)) continue;
        const vals = Array.isArray(value) ? value : [value];
        for (const val of vals) {
            search.append(key, val instanceof Date ? val.toISOString() : String(val));
        }
    }
    return search.toString();
};

export type ApiErrorLike = Error & {
    name: 'ApiError';
    status: number;
    statusText: string;
    url: string;
    bodyText?: string;
};

const makeApiError = (res: Response, bodyText?: string): ApiErrorLike => {
    const err = new Error(`HTTP ${res.status} ${res.statusText} for ${res.url}`) as ApiErrorLike;
    err.name = 'ApiError';
    err.status = res.status;
    err.statusText = res.statusText;
    err.url = res.url;
    err.bodyText = bodyText;
    return err;
};

/**
 * Combine multiple abort signals into a single composite signal.  If any
 * constituent signal aborts, the resulting signal will abort.  Listeners
 * are cleaned up when the composite is aborted.
 */
export const mergeSignals = (...signals: (AbortSignal | undefined)[]) => {
    const active = signals.filter(Boolean) as AbortSignal[];
    if (!active.length) return undefined;
    if (active.some(s => s.aborted)) return AbortSignal.abort();
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    for (const s of active) s.addEventListener('abort', onAbort, { once: true });
    ctrl.signal.addEventListener('abort', () => active.forEach(s => s.removeEventListener('abort', onAbort)), { once: true });
    return ctrl.signal;
};

/**
 * Create an abort signal that triggers after the specified timeout (in ms).
 */
export const timeoutSignal = (ms: number): AbortSignal => {
    // Native AbortSignal.timeout is available in newer runtimes; fall back to a
    // manual implementation otherwise.
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

// Determine whether an error thrown during fetch is retryable.  Network
// failures (TypeError) and 5xx API errors are considered retryable.
const isRetryable = (e: unknown) => {
    return !isAbort(e) && (e instanceof TypeError || ((e as Partial<ApiErrorLike>)?.name === 'ApiError' &&
        typeof (e as Partial<ApiErrorLike>)?.status === 'number' &&
        (e as ApiErrorLike).status >= 500 && (e as ApiErrorLike).status < 600));
};

// Internal helper that performs a single fetch, decoding the response based
// on content type and respecting 304/204 semantics.
async function doFetch<T>(url: string, opts: {
    signal?: AbortSignal;
    timeoutMs?: number;
    init?: RequestInit;
    acceptNotModified?: boolean;
}): Promise<{ data: T; headers: Headers; notModified: boolean }> {
    const signal = mergeSignals(opts.signal, opts.timeoutMs ? timeoutSignal(opts.timeoutMs) : undefined);
    const res = await fetch(url, { credentials: 'same-origin', ...opts.init, signal });
    if (res.status === 304 && opts.acceptNotModified) {
        return { data: ([] as unknown as T), headers: res.headers, notModified: true };
    }
    if (!res.ok) throw makeApiError(res, await res.text().catch(() => undefined));
    if (res.status === 204) {
        return { data: (undefined as unknown as T), headers: res.headers, notModified: false };
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const data = ct.includes('application/json') || ct.includes('+json') ? await res.json() as T : await res.text() as unknown as T;
    return { data, headers: res.headers, notModified: false };
}

/**
 * Unified GET helper that optionally returns response metadata.  Handles
 * retries with exponential backoff and supports timeouts via AbortSignal.
 *
 * @param path the endpoint (including protocol/host if needed)
 * @param opt request options
 * @param meta when true, include headers and notModified flag in result
 */
async function getWithRetry<T>(path: string, opt: GetOptions = {}, meta = false): Promise<any> {
    const { params = {}, signal, timeoutMs, retry = 0, retryBackoffMs = 300, init, acceptNotModified } = opt;
    const url = Object.keys(params).length ? `${path}?${qs(params)}` : path;
    const cap = 10_000;
    for (let attempt = 0; ; attempt++) {
        try {
            const result = await doFetch<T>(url, { signal, timeoutMs, init, acceptNotModified });
            return meta ? result : result.data;
        } catch (e) {
            if (!(isRetryable(e) && attempt < retry)) throw e;
            const delay = Math.min(retryBackoffMs * 2 ** attempt * (0.5 + Math.random()), cap);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Perform a GET request and return the decoded body.  Supports query
 * parameters, retries, timeouts and conditional requests via options.
 */
export const apiGet = async <T>(path: string, opt: GetOptions = {}): Promise<T> =>
    getWithRetry<T>(path, opt, false);

/**
 * Perform a GET request and return the decoded body along with response
 * headers and a `notModified` flag.  Useful when implementing HTTP caching.
 */
export const apiGetWithMeta = async <T>(path: string, opt: GetOptions = {}): Promise<{ data: T; headers: Headers; notModified: boolean }> =>
    getWithRetry<T>(path, opt, true);
