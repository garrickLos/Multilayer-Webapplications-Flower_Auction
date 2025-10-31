// utils.ts — compact, typed, live-ready, erasable-safe
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/* ===== Types ===== */
export type MaybeNumber = number | "" | null | undefined

export type Bieding = Partial<{
    biedNr: number; bedragPerFust: number; aantalStuks: number; gebruikerNr: number; veilingNr: number
}> & Record<string, unknown>

export type Veilingproduct = Partial<{
    veilingProductNr: number; naam: string | null; geplaatstDatum: string; fust: number; voorraad: number; startprijs: number; categorieNr: number
}> & Record<string, unknown>

export type Categorie = Partial<{
    categorieNr: number; naam: string; id: number; name: string
}> & Record<string, unknown>

export const assertNever = (x: never, msg = "Unexpected variant"): never => { throw new Error(`${msg}: ${String(x)}`) }

/* ===== Small helpers ===== */
export const isNonEmpty = (v: unknown) => v !== undefined && v !== null && v !== ""
export const isAbort = (e: unknown): e is DOMException => {
    const a = e as { name?: unknown; code?: unknown }
    return a?.name === "AbortError" || a?.code === 20
}
export const toIntOrUndef = (v: MaybeNumber) => {
    if (v === "" || v == null) return undefined
    const n = Number(String(v).replace(/,(\d+)$/, (_m, g) => "." + g))
    return Number.isFinite(n) ? n : undefined
}
export const getCategorieId = (c: Categorie) =>
    (typeof c.categorieNr === "number" ? c.categorieNr : undefined) ?? (typeof c.id === "number" ? c.id : undefined)
export const getCategorieNaam = (c: Categorie) =>
    (typeof c.naam === "string" ? c.naam : undefined) ?? (typeof c.name === "string" ? c.name : "") ?? ""
export const normalizeForSearch = (s: string) =>
    s.normalize("NFKD").replace(/[\p{M}]/gu, "").replace(/\s+/g, " ").trim().toLowerCase()

export function rowToSearchString(row: Record<string, unknown>, max = 5000) {
    const out: string[] = [], st: unknown[] = [row], seen = new WeakSet<object>()
    const push = (v: unknown) => {
        if (v == null) return
        const t = typeof v
        if (t === "string" || t === "number" || t === "boolean" || t === "bigint") { out.push(String(v)); return }
        if (v instanceof Date && !isNaN(v.getTime())) { out.push(v.toISOString()); return }
        if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) st.push(v[i]); return }
        if (t === "object" && !seen.has(v as object)) { seen.add(v as object); for (const x of Object.values(v as Record<string, unknown>)) st.push(x) }
    }
    for (let i = 0; st.length && i < max; i++) push(st.pop())
    return normalizeForSearch(out.join(" "))
}

/* ===== Debounce ===== */
export function useDebounced<T>(value: T, delay = 300, { leading = false }: { leading?: boolean } = {}) {
    const [v, setV] = useState(value); const t = useRef<ReturnType<typeof setTimeout> | null>(null); const led = useRef(false)
    useEffect(() => {
        if (leading && !t.current) { setV(value); led.current = true }
        if (t.current) clearTimeout(t.current)
        t.current = setTimeout(() => { if (!leading || led.current) setV(value); t.current = null; led.current = false }, delay)
        return () => { if (t.current) clearTimeout(t.current); t.current = null; led.current = false }
    }, [value, delay, leading])
    return v
}

/* ===== Fetch (retry + timeout + conditional) ===== */
export type QueryValue =
    | string | number | boolean | Date
    | readonly (string | number | boolean | Date)[]
    | undefined
export type Query = Readonly<Record<string, QueryValue>>

export const stableStringify = (input: unknown) => {
    const seen = new WeakSet<object>()
    const walk = (v: unknown): unknown => {
        if (v instanceof Date) return { d: v.toISOString() }
        if (v === null || typeof v !== "object") return v
        if (seen.has(v as object)) return "[Circular]"
        seen.add(v as object)
        if (Array.isArray(v)) return v.map(walk)
        const rec = v as Record<string, unknown>
        return Object.fromEntries(Object.keys(rec).sort().map(k => [k, walk(rec[k])]))
    }
    return JSON.stringify(walk(input))
}

const qs = (p: Query) => {
    const s = new URLSearchParams()
    for (const [k, v] of Object.entries(p)) {
        if (!isNonEmpty(v)) continue
        if (Array.isArray(v)) for (const it of v) s.append(k, it instanceof Date ? it.toISOString() : String(it))
        else s.set(k, v instanceof Date ? v.toISOString() : String(v))
    }
    return s.toString()
}

/* ApiError as plain object (no class) */
export type ApiErrorLike = Error & { status: number; statusText: string; url: string; bodyText?: string }
const makeApiError = (res: Response, bodyText?: string): ApiErrorLike => {
    const err = new Error(`HTTP ${res.status} ${res.statusText} for ${res.url}`) as ApiErrorLike
    err.name = "ApiError"; err.status = res.status; err.statusText = res.statusText; err.url = res.url; err.bodyText = bodyText
    return err
}

export const mergeSignals = (...signals: (AbortSignal | undefined)[]) => {
    const v = signals.filter(Boolean) as AbortSignal[]; if (!v.length) return undefined
    const ctl = new AbortController(), on = () => ctl.abort()
    for (const s of v) { if (s.aborted) return AbortSignal.abort(); s.addEventListener("abort", on, { once: true }) }
    ctl.signal.addEventListener("abort", () => v.forEach(s => s.removeEventListener("abort", on)), { once: true })
    return ctl.signal
}
export const timeoutSignal = (ms: number) => {
    if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms)
    const ctl = new AbortController(); const id = setTimeout(() => ctl.abort(new DOMException("TimeoutError", "TimeoutError")), ms)
    ctl.signal.addEventListener("abort", () => clearTimeout(id), { once: true }); return ctl.signal
}

export type GetOptions = {
    params?: Query; signal?: AbortSignal; timeoutMs?: number; retry?: number; retryBackoffMs?: number; init?: RequestInit; acceptNotModified?: boolean
}
const isRetryable = (e: unknown) =>
    !isAbort(e) &&
    (e instanceof TypeError ||
        ((e as Partial<ApiErrorLike>)?.name === "ApiError" && typeof (e as Partial<ApiErrorLike>)?.status === "number" &&
            (e as ApiErrorLike).status >= 500 && (e as ApiErrorLike).status < 600))

async function doFetch<T>(url: string, o: { signal?: AbortSignal; timeoutMs?: number; init?: RequestInit; acceptNotModified?: boolean }) {
    const composed = mergeSignals(o.signal, o.timeoutMs ? timeoutSignal(o.timeoutMs) : undefined)
    const res = await fetch(url, { credentials: "same-origin", ...o.init, signal: composed })
    if (res.status === 304 && o.acceptNotModified) return { data: ([] as unknown as T), headers: res.headers, notModified: true }
    if (!res.ok) throw makeApiError(res, await res.text().catch(() => undefined))
    const ct = (res.headers.get("content-type") || "").toLowerCase()
    const data = ct.includes("application/json") ? ((await res.json()) as T) : ((await res.text()) as unknown as T)
    return { data, headers: res.headers, notModified: false }
}

export async function apiGet<T>(path: string, opt: GetOptions = {}): Promise<T> {
    const { params = {}, signal, timeoutMs, retry = 0, retryBackoffMs = 300, init, acceptNotModified } = opt
    const url = `${path}${Object.keys(params).length ? `?${qs(params)}` : ""}`
    for (let i = 0; ; i++) {
        try { return (await doFetch<T>(url, { signal, timeoutMs, init, acceptNotModified })).data }
        catch (e) { if (!(isRetryable(e) && i < retry)) throw e; await new Promise(r => setTimeout(r, retryBackoffMs * 2 ** i * (0.5 + Math.random()))) }
    }
}
export async function apiGetWithMeta<T>(path: string, opt: GetOptions = {}) {
    const { params = {}, signal, timeoutMs, retry = 0, retryBackoffMs = 300, init, acceptNotModified } = opt
    const url = `${path}${Object.keys(params).length ? `?${qs(params)}` : ""}`
    for (let i = 0; ; i++) {
        try { return await doFetch<T>(url, { signal, timeoutMs, init, acceptNotModified }) }
        catch (e) { if (!(isRetryable(e) && i < retry)) throw e; await new Promise(r => setTimeout(r, retryBackoffMs * 2 ** i * (0.5 + Math.random()))) }
    }
}

/* ===== Live support ===== */
const useActive = () => {
    const [vis, setVis] = useState(typeof document === "undefined" ? true : document.visibilityState !== "hidden")
    const [onl, setOnl] = useState(typeof navigator === "undefined" ? true : navigator.onLine)
    useEffect(() => {
        const v = () => setVis(document.visibilityState !== "hidden")
        const up = () => setOnl(true), dn = () => setOnl(false)
        document.addEventListener("visibilitychange", v)
        window.addEventListener("focus", v); window.addEventListener("online", up); window.addEventListener("offline", dn)
        return () => { document.removeEventListener("visibilitychange", v); window.removeEventListener("focus", v); window.removeEventListener("online", up); window.removeEventListener("offline", dn) }
    }, [])
    return vis && onl
}
const sseStart = (url: string, cb: () => void) => {
    if (typeof EventSource === "undefined") return () => {}
    const es = new EventSource(url, { withCredentials: true }); const h = () => cb()
    es.addEventListener("message", h); es.addEventListener("error", h)
    return () => { es.removeEventListener("message", h); es.removeEventListener("error", h); es.close() }
}

/* ===== usePagedList (server pagination + live) ===== */
export type PagedListParams = Query
export type UsePagedListOptions<T> = {
    keepPreviousData?: boolean; retry?: number; timeoutMs?: number;
    onSuccess?: (rows: T[]) => void; onError?: (err: unknown) => void;
    live?: { intervalMs?: number; sseUrl?: string; throttleMs?: number }
}

export function usePagedList<T>({
                                    path, params, page, pageSize, paramsKey, options = {},
                                }: {
    path: string; params: PagedListParams; page: number; pageSize: number; paramsKey?: string; options?: UsePagedListOptions<T>
}) {
    const { keepPreviousData = true, retry = 0, timeoutMs, onSuccess, onError, live } = options
    const [data, setData] = useState<T[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null)
    const [lastCount, setLastCount] = useState(0); const [totalCount, setTotalCount] = useState<number | null>(null)
    const etag = useRef<string | null>(null), lastMod = useRef<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)
    const key = useMemo(() => paramsKey ?? stableStringify(params), [paramsKey, params])
    const p = Math.max(1, Math.floor(page || 1)), ps = Math.max(1, Math.min(500, Math.floor(pageSize || 1)))
    const active = useActive()

    const doReq = useCallback(async (ctl: AbortController, accept304: boolean) => {
        const headersIn: Record<string, string> = {}
        if (etag.current) headersIn["If-None-Match"] = etag.current
        if (lastMod.current) headersIn["If-Modified-Since"] = lastMod.current
        const r = await apiGetWithMeta<T[]>(path, {
            params: { ...params, page: p, pageSize: ps }, signal: ctl.signal, retry, timeoutMs, acceptNotModified: accept304, init: { headers: headersIn },
        })
        const et = r.headers.get("ETag"); if (et) etag.current = et
        const lm = r.headers.get("Last-Modified"); if (lm) lastMod.current = lm
        const x = r.headers.get("X-Total-Count"); setTotalCount(x != null ? Number(x) : null)
        return r
    }, [path, params, p, ps, retry, timeoutMs])

    const fetcher = useCallback(async (accept304 = false) => {
        abortRef.current?.abort(); const ctl = new AbortController(); abortRef.current = ctl
        if (!keepPreviousData) setData([]); setLoading(true); setError(null)
        try {
            const r = await doReq(ctl, accept304)
            if (!r.notModified) {
                const arr = Array.isArray(r.data) ? r.data : []
                setData(arr); setLastCount(arr.length); onSuccess?.(arr)
            }
        } catch (e) {
            if (!isAbort(e)) { setError(e instanceof Error ? e.message : "Er is iets misgegaan."); onError?.(e) }
        } finally { setLoading(false) }
    }, [doReq, keepPreviousData, onSuccess, onError])

    useEffect(() => { fetcher(false); return () => abortRef.current?.abort() }, [fetcher, key])
    const refresh = useCallback(() => fetcher(true), [fetcher])

    // Polling (visible+online) — interval narrowed to number
    useEffect(() => {
        const interval = live?.intervalMs
        if (typeof interval !== "number" || !active) return
        let stop = false
        let id = window.setTimeout(tick, interval)
        function tick() {
            if (stop) return
            refresh()
            const next = interval * (0.9 + Math.random() * 0.2)
            id = window.setTimeout(tick, next)
        }
        return () => { stop = true; window.clearTimeout(id) }
    }, [live?.intervalMs, active, refresh])

    // SSE (throttled)
    useEffect(() => {
        const url = live?.sseUrl; if (!url || !active) return
        const gap = Math.max(250, live?.throttleMs ?? 1500); let last = 0; let pend = false
        const now = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now())
        const sched = () => {
            const t = now(), diff = t - last
            if (diff >= gap) { last = t; refresh() }
            else if (!pend) { pend = true; const id = window.setTimeout(() => { pend = false; last = now(); refresh() }, gap - diff); cleaners.push(() => window.clearTimeout(id)) }
        }
        const cleaners: Array<() => void> = []; cleaners.push(sseStart(url, sched))
        return () => cleaners.forEach(fn => fn())
    }, [live?.sseUrl, live?.throttleMs, active, refresh])

    const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / ps)) : null
    const hasPrev = totalPages ? p > 1 : p > 1 && lastCount > 0
    const hasNext = totalPages != null ? p < totalPages : lastCount >= ps

    return { data, loading, error, lastCount, totalCount, totalPages, hasPrev, hasNext, refresh }
}
