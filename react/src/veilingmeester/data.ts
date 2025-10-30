// utils.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/* ===== Types ===== */
export type MaybeNumber = number | "" | null | undefined

export type Bieding = Partial<{
    biedNr: number
    bedragPerFust: number
    aantalStuks: number
    gebruikerNr: number
    veilingNr: number
}> & Record<string, unknown>

export type Veilingproduct = Partial<{
    veilingProductNr: number
    naam: string | null
    geplaatstDatum: string
    fust: number
    voorraad: number
    startprijs: number
    categorieNr: number
}> & Record<string, unknown>

export type Categorie = Partial<{
    categorieNr: number
    naam: string
    id: number
    name: string
}> & Record<string, unknown>

/** Exhaustive-guard helper. */
export function assertNever(x: never, msg = "Unexpected variant"): never {
    throw new Error(`${msg}: ${String(x)}`)
}

/* ===== Tiny helpers ===== */
export const isNonEmpty = (v: unknown): boolean =>
    v !== undefined && v !== null && v !== ""

export const isAbort = (e: unknown): e is DOMException => {
    const any = e as { name?: unknown; code?: unknown }
    return any?.name === "AbortError" || any?.code === 20
}

/** Accepts comma-decimals; returns finite number or undefined. */
export const toIntOrUndef = (v: MaybeNumber): number | undefined => {
    if (v === "" || v == null) return undefined
    const s = String(v).replace(/,(\d+)$/, (_m, g) => "." + g)
    const n = Number(s)
    return Number.isFinite(n) ? n : undefined
}

export const getCategorieId = (c: Categorie): number | undefined =>
    (typeof c.categorieNr === "number" ? c.categorieNr : undefined) ??
    (typeof c.id === "number" ? c.id : undefined)

export const getCategorieNaam = (c: Categorie): string =>
    (typeof c.naam === "string" ? c.naam : undefined) ??
    (typeof c.name === "string" ? c.name : "") ?? ""

/** Normalize + strip combining marks; collapse whitespace. */
export const normalizeForSearch = (s: string): string =>
    s
        .normalize("NFKD")
        .replace(/[\p{M}]/gu, "") // portable diacritic strip
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()

/** Flatten any record to a normalized searchable string. */
export function rowToSearchString(row: Record<string, unknown>, max = 5000): string {
    const out: string[] = []
    const stack: unknown[] = [row]
    const seen = new WeakSet<object>()

    const push = (v: unknown) => {
        if (v == null) return
        const t = typeof v
        if (t === "string" || t === "number" || t === "boolean" || t === "bigint") {
            out.push(String(v)); return
        }
        if (v instanceof Date && !isNaN(v.getTime())) { out.push(v.toISOString()); return }
        if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) stack.push(v[i]); return }
        if (t === "object" && !seen.has(v as object)) {
            seen.add(v as object)
            const vals = Object.values(v as Record<string, unknown>)
            for (let i = 0; i < vals.length; i++) stack.push(vals[i])
        }
    }

    for (let i = 0; stack.length && i < max; i++) push(stack.pop())
    return normalizeForSearch(out.join(" "))
}

/* ===== Debounce (optional leading) ===== */
export interface UseDebouncedOptions { leading?: boolean }

export function useDebounced<T>(value: T, delay = 300, options: UseDebouncedOptions = {}): T {
    const { leading = false } = options
    const [debounced, setDebounced] = useState<T>(value)
    const t = useRef<ReturnType<typeof setTimeout> | null>(null)
    const didLead = useRef(false)

    useEffect(() => {
        if (leading && !t.current) { setDebounced(value); didLead.current = true }
        if (t.current) clearTimeout(t.current)
        t.current = setTimeout(() => {
            if (!leading || didLead.current) setDebounced(value)
            t.current = null; didLead.current = false
        }, delay)
        return () => { if (t.current) { clearTimeout(t.current); t.current = null } didLead.current = false }
    }, [value, delay, leading])

    return debounced
}

/* ===== Fetch helpers (typed, retry, timeout) ===== */
export type QueryValue =
    | string | number | boolean | Date
    | readonly (string | number | boolean | Date)[]
    | undefined

export type Query = Readonly<Record<string, QueryValue>>

/** Stable stringify for memo keys; handles Dates + circular refs. */
export const stableStringify = (input: unknown): string => {
    const seen = new WeakSet<object>()
    const walk = (v: unknown): unknown => {
        if (v instanceof Date) return { date: (v as Date).toISOString() }
        if (v === null || typeof v !== "object") return v
        if (seen.has(v as object)) return { ref: "[Circular]" }
        seen.add(v as object)
        if (Array.isArray(v)) return v.map(walk)
        const o = v as Record<string, unknown>
        const out: Record<string, unknown> = {}
        for (const k of Object.keys(o).sort()) out[k] = walk(o[k])
        return out
    }
    return JSON.stringify(walk(input))
}

/** Build query string; omit nullish/empty; repeat arrays. */
const qs = (params: Query): string => {
    const s = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
        if (!isNonEmpty(v)) continue
        if (Array.isArray(v)) for (const it of v) s.append(k, it instanceof Date ? it.toISOString() : String(it))
        else s.set(k, v instanceof Date ? v.toISOString() : String(v))
    }
    return s.toString()
}

/** Safe JSON parse with fallback. */
const safeParseJson = <T,>(text: string, fallback: T): T => {
    try { return JSON.parse(text) as T } catch { return fallback }
}

/** Rich error for failed HTTP responses. */
export class ApiError extends Error {
    readonly status: number
    readonly statusText: string
    readonly url: string
    readonly bodyText?: string
    constructor(res: Response, bodyText?: string) {
        super(`HTTP ${res.status} ${res.statusText} for ${res.url}`)
        this.name = "ApiError"
        this.status = res.status
        this.statusText = res.statusText
        this.url = res.url
        this.bodyText = bodyText
    }
}

/** Merge AbortSignals; aborts when any input aborts; cleans listeners. */
export function mergeSignals(...signals: (AbortSignal | undefined)[]): AbortSignal | undefined {
    const valid = signals.filter(Boolean) as AbortSignal[]
    if (!valid.length) return undefined
    const ctl = new AbortController()
    const onAbort = () => ctl.abort()
    for (const s of valid) {
        if (s.aborted) return AbortSignal.abort()
        s.addEventListener("abort", onAbort, { once: true })
        ctl.signal.addEventListener("abort", () => s.removeEventListener("abort", onAbort), { once: true })
    }
    return ctl.signal
}

/** Abort after ms, with fallback when AbortSignal.timeout is missing. */
export const timeoutSignal = (ms: number): AbortSignal => {
    if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms)
    const ctl = new AbortController()
    const id = setTimeout(() => ctl.abort(new DOMException("TimeoutError", "TimeoutError")), ms)
    ctl.signal.addEventListener("abort", () => clearTimeout(id), { once: true })
    return ctl.signal
}

export interface GetOptions {
    params?: Query
    signal?: AbortSignal
    timeoutMs?: number
    retry?: number
    retryBackoffMs?: number
    init?: RequestInit
}

const shouldRetry = (e: unknown): boolean =>
    !isAbort(e) && (e instanceof TypeError || (e instanceof ApiError && e.status >= 500 && e.status < 600))

async function doFetch<T>(
    url: string,
    { signal, timeoutMs, init }: { signal?: AbortSignal; timeoutMs?: number; init?: RequestInit }
): Promise<{ data: T; headers: Headers }> {
    const composed = mergeSignals(signal, timeoutMs ? timeoutSignal(timeoutMs) : undefined)
    const res = await fetch(url, { credentials: "same-origin", ...init, signal: composed })

    if (!res.ok) {
        const bodyText = await res.text().catch(() => undefined)
        throw new ApiError(res, bodyText)
    }

    const ct = (res.headers.get("content-type") || "").toLowerCase()
    if (ct.includes("application/json")) {
        return { data: (await res.json()) as T, headers: res.headers }
    }
    const text = await res.text()
    const data = text ? safeParseJson<T>(text, [] as unknown as T) : (([] as unknown) as T)
    return { data, headers: res.headers }
}

/** GET helper with retries/backoff. */
export async function apiGet<T>(path: string, options: GetOptions = {}): Promise<T> {
    const { params = {}, signal, timeoutMs, retry = 0, retryBackoffMs = 300, init } = options
    const query = Object.keys(params).length ? `?${qs(params)}` : ""
    const url = `${path}${query}`

    for (let attempt = 0; ; attempt++) {
        try {
            const { data } = await doFetch<T>(url, { signal, timeoutMs, init })
            return data
        } catch (e) {
            if (!(shouldRetry(e) && attempt < retry)) throw e
            const backoff = retryBackoffMs * 2 ** attempt * (0.5 + Math.random())
            await new Promise(r => setTimeout(r, backoff))
        }
    }
}

/** GET with headers. */
export async function apiGetWithMeta<T>(
    path: string,
    options: GetOptions = {}
): Promise<{ data: T; headers: Headers }> {
    const { params = {}, signal, timeoutMs, retry = 0, retryBackoffMs = 300, init } = options
    const query = Object.keys(params).length ? `?${qs(params)}` : ""
    const url = `${path}${query}`

    for (let attempt = 0; ; attempt++) {
        try {
            return await doFetch<T>(url, { signal, timeoutMs, init })
        } catch (e) {
            if (!(shouldRetry(e) && attempt < retry)) throw e
            const backoff = retryBackoffMs * 2 ** attempt * (0.5 + Math.random())
            await new Promise(r => setTimeout(r, backoff))
        }
    }
}

/* ===== usePagedList (server-side pagination) ===== */
export type PagedListParams = Query

export interface UsePagedListOptions<T> {
    keepPreviousData?: boolean
    retry?: number
    timeoutMs?: number
    onSuccess?: (rows: T[]) => void
    onError?: (err: unknown) => void
}

/**
 * Server-paginated list hook.
 * - Cancels in-flight requests when dependencies change.
 * - totalCount from `X-Total-Count`, plus totalPages/hasNext/hasPrev.
 */
export function usePagedList<T>({
                                    path,
                                    params,
                                    page,
                                    pageSize,
                                    paramsKey,
                                    options = {},
                                }: {
    path: string
    params: PagedListParams
    page: number
    pageSize: number
    paramsKey?: string
    options?: UsePagedListOptions<T>
}) {
    const {
        keepPreviousData = true,
        retry = 0,
        timeoutMs,
        onSuccess,
        onError,
    } = options

    const [data, setData] = useState<T[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastCount, setLastCount] = useState(0)
    const [totalCount, setTotalCount] = useState<number | null>(null)

    const abortRef = useRef<AbortController | null>(null)

    const key = useMemo(
        () => paramsKey ?? stableStringify(params),
        [paramsKey, params]
    )

    const safePage = Math.max(1, Math.floor(page || 1))
    const safePageSize = Math.max(1, Math.min(500, Math.floor(pageSize || 1)))

    const fetcher = useCallback(async () => {
        abortRef.current?.abort()
        const ctl = new AbortController()
        abortRef.current = ctl

        if (!keepPreviousData) setData([])
        setLoading(true)
        setError(null)

        try {
            const { data: res, headers } = await apiGetWithMeta<T[]>(path, {
                params: { ...params, page: safePage, pageSize: safePageSize },
                signal: ctl.signal,
                retry,
                timeoutMs,
            })

            const arr = Array.isArray(res) ? res : []
            setData(arr)
            setLastCount(arr.length)

            const x = headers.get("X-Total-Count")
            setTotalCount(x != null ? Number(x) : null)

            onSuccess?.(arr)
        } catch (e) {
            if (!isAbort(e)) {
                setError(e instanceof Error ? e.message : "Er is iets misgegaan.")
                onError?.(e)
            }
        } finally {
            setLoading(false)
        }
    }, [path, key, safePage, safePageSize, retry, timeoutMs, keepPreviousData, onSuccess, onError])

    useEffect(() => {
        fetcher()
        return () => abortRef.current?.abort()
    }, [fetcher])

    const refresh = useCallback(() => { fetcher() }, [fetcher])

    const totalPages =
        totalCount != null ? Math.max(1, Math.ceil(totalCount / safePageSize)) : null
    const hasPrev = totalPages ? safePage > 1 : safePage > 1 && lastCount > 0
    const hasNext = totalPages != null ? safePage < totalPages : lastCount >= safePageSize

    return { data, loading, error, lastCount, totalCount, totalPages, hasPrev, hasNext, refresh }
}
