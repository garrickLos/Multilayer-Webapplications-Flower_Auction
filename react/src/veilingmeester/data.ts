// utils.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/* ========= Types (optioneel, maar handig) ========= */
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

/* ========= Tiny helpers ========= */
export const isNonEmpty = (v: unknown) => v !== undefined && v !== null && v !== ""
export const isAbort = (e: unknown): e is DOMException => (e as any)?.name === "AbortError"

export const toIntOrUndef = (v: MaybeNumber) => {
    if (v === "" || v == null) return undefined
    const n = Number(v); return Number.isFinite(n) ? n : undefined
}

export const getCategorieId = (c: Categorie) =>
    (typeof c.categorieNr === "number" ? c.categorieNr : undefined) ?? (typeof c.id === "number" ? c.id : undefined)

export const getCategorieNaam = (c: Categorie) =>
    (typeof c.naam === "string" ? c.naam : undefined) ?? (typeof c.name === "string" ? c.name : "") ?? ""

/** Platte zoekstring van willekeurig object (diepte-beperkt) */
export function rowToSearchString(row: Record<string, unknown>, max = 5000): string {
    const out: string[] = [], stack: unknown[] = [row]; const seen = new WeakSet<object>()
    const isPrim = (v: unknown): v is string | number | boolean => ["string","number","boolean"].includes(typeof v as any)
    for (let i = 0; stack.length && i < max; i++) {
        const cur = stack.pop(); if (cur == null) continue
        if (isPrim(cur)) out.push(String(cur))
        else if (Array.isArray(cur)) stack.push(...cur)
        else if (typeof cur === "object") { if (seen.has(cur as object)) continue; seen.add(cur as object); stack.push(...Object.values(cur as any)) }
    }
    return out.join(" ").toLowerCase()
}

/* ========= Debounce ========= */
export function useDebounced<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value)
    const ref = useRef<number>()
    useEffect(() => {
        if (ref.current) clearTimeout(ref.current)
        ref.current = window.setTimeout(() => setDebounced(value), delay)
        return () => { if (ref.current) clearTimeout(ref.current) }
    }, [value, delay])
    return debounced
}

/* ========= API client (simpel & sterk) ========= */
type Query = Record<string, string | number | undefined>
const qs = (p: Query) => {
    const s = new URLSearchParams()
    for (const [k, v] of Object.entries(p)) if (isNonEmpty(v)) s.set(k, String(v))
    return s.toString()
}

export async function apiGet<T>(path: string, params: Query = {}, signal?: AbortSignal): Promise<T> {
    const url = `${path}${(Object.keys(params).length ? `?${qs(params)}` : "")}`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`GET ${path} ${res.status} ${res.statusText}`)
    const ct = (res.headers.get("content-type") || "").toLowerCase()
    if (ct.includes("application/json")) return res.json() as Promise<T>
    const text = await res.text()
    return (text ? JSON.parse(text) : []) as T
}

export async function apiGetWithMeta<T>(path: string, params: Query = {}, signal?: AbortSignal) {
    const url = `${path}${(Object.keys(params).length ? `?${qs(params)}` : "")}`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`GET ${path} ${res.status} ${res.statusText}`)
    const ct = (res.headers.get("content-type") || "").toLowerCase()
    const data = ct.includes("application/json") ? ((await res.json()) as T) : ((await res.text()) ? (JSON.parse(await res.text()) as T) : ([] as unknown as T))
    return { data, headers: res.headers }
}

/* ========= usePagedList (server-paginatie) ========= */
export type PagedListParams = Query
export function usePagedList<T>({
                                    path, params, page, pageSize, paramsKey,
                                }: {
    path: string; params: PagedListParams; page: number; pageSize: number; paramsKey?: string
}) {
    const [data, setData] = useState<T[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastCount, setLastCount] = useState(0)
    const [totalCount, setTotalCount] = useState<number | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    // Stabiele dependency bij params-wijzigingen
    const key = paramsKey ?? useMemo(() => JSON.stringify(params, Object.keys(params).sort()), [params])

    const fetcher = useCallback(async () => {
        abortRef.current?.abort()
        const ctl = new AbortController()
        abortRef.current = ctl
        setLoading(true); setError(null)
        try {
            const { data: res, headers } = await apiGetWithMeta<T[]>(path, { ...params, page, pageSize }, ctl.signal)
            const arr = Array.isArray(res) ? res : []
            setData(arr); setLastCount(arr.length)
            const x = headers.get("X-Total-Count"); setTotalCount(x ? Number(x) : null)
        } catch (e) {
            if (!isAbort(e)) setError(e instanceof Error ? e.message : "Er is iets misgegaan.")
        } finally { setLoading(false) }
    }, [path, page, pageSize, key])

    useEffect(() => { fetcher(); return () => abortRef.current?.abort() }, [fetcher])

    const refresh = useCallback(() => fetcher(), [fetcher])

    return { data, loading, error, lastCount, totalCount, refresh }
}
