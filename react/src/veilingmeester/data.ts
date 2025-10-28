import { useCallback, useEffect, useRef, useState } from "react"

/** ===== Types ===== */
export type MaybeNumber = number | "" | null | undefined

export type Bieding = Record<string, unknown>
export type Veilingproduct = {
    id?: number
    naam?: string | null
    geplaatstDatum?: string
    fust?: number
    voorraad?: number
    startprijs?: number
    categorieNr?: number
} & Record<string, unknown>

export type Categorie = {
    id?: number
    categorieNr?: number
    naam?: string
    name?: string
} & Record<string, unknown>

/** ===== Small helpers ===== */
export const isNonEmpty = (v: unknown) => v !== undefined && v !== null && v !== ""

export const isAbort = (e: unknown) =>
    (e instanceof DOMException && e.name === "AbortError") ||
    (typeof e === "object" && e !== null && (e as any).name === "AbortError")

export const toIntOrUndefined = (v: MaybeNumber): number | undefined => {
    const n = Number(v)
    return Number.isFinite(n) && v !== "" ? n : undefined
}

export const getCategorieId = (c: Categorie): number | undefined =>
    (typeof c.id === "number" ? c.id : undefined) ??
    (typeof c.categorieNr === "number" ? c.categorieNr : undefined)

export const getCategorieNaam = (c: Categorie): string =>
    (typeof c.naam === "string" ? c.naam : undefined) ??
    (typeof c.name === "string" ? c.name : "") ??
    ""

/** Alle waarden (incl. nested & arrays) naar één zoekstring */
export function rowToSearchString(row: Record<string, unknown>): string {
    const out: string[] = []
    const stack: any[] = [row]
    const seen = new WeakSet<object>()
    let guard = 0
    while (stack.length && guard++ < 5000) {
        const cur = stack.pop()
        if (cur == null) continue
        if (typeof cur === "string" || typeof cur === "number" || typeof cur === "boolean") out.push(String(cur))
        else if (Array.isArray(cur)) for (const v of cur) stack.push(v)
        else if (typeof cur === "object") {
            if (seen.has(cur)) continue
            seen.add(cur)
            for (const v of Object.values(cur)) stack.push(v)
        }
    }
    return out.join(" ").toLowerCase()
}

/** ===== Debounce hook (stable timeout) ===== */
export function useDebounced<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value)
    const timeoutRef = useRef<number | null>(null)

    useEffect(() => {
        if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
        timeoutRef.current = window.setTimeout(() => setDebounced(value), delay)
        return () => {
            if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
        }
    }, [value, delay])

    return debounced
}

/** ===== API helper (robust JSON parsing) ===== */
export async function apiGet<T>(
    path: string,
    params: Record<string, string | number | undefined> = {},
    signal?: AbortSignal
): Promise<T> {
    const usp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (isNonEmpty(v)) usp.set(k, String(v))
    const url = `${path}${usp.toString() ? `?${usp.toString()}` : ""}`
    const res = await fetch(url, { signal })
    if (!res.ok) {
        let text = ""
        try { text = await res.text() } catch {}
        throw new Error(`GET ${path} failed: ${res.status} ${res.statusText} ${text}`)
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase()
    if (res.headers.get("content-length") === "0") return ([] as unknown) as T
    if (ct.includes("application/json")) return (await res.json()) as T
    const text = await res.text()
    return (text ? JSON.parse(text) : ([] as unknown)) as T
}

/**
 * ===== Generic paged fetch hook =====
 * Encapsuleert: aborts, loading, error, data, lastCount.
 * (Pagina-reset doe je in de container, zodat deze hook overal herbruikbaar is.)
 */
export function usePagedList<T>({
                                    path,
                                    params,
                                    page,
                                    pageSize,
                                }: {
    path: string
    params: Record<string, string | number | undefined>
    page: number
    pageSize: number
}) {
    const [data, setData] = useState<T[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastCount, setLastCount] = useState(0)
    const abortRef = useRef<AbortController | null>(null)

    const fetcher = useCallback(async () => {
        abortRef.current?.abort()
        const ctl = new AbortController()
        abortRef.current = ctl
        setLoading(true)
        setError(null)
        try {
            const res = await apiGet<T[]>(path, { ...params, page, pageSize }, ctl.signal)
            const arr = Array.isArray(res) ? res : []
            setLastCount(arr.length)
            setData(arr)
        } catch (e) {
            if (!isAbort(e)) setError(e instanceof Error ? e.message : "Er is iets misgegaan.")
        } finally {
            setLoading(false)
        }
    }, [path, JSON.stringify(params), page, pageSize])

    useEffect(() => { fetcher() }, [fetcher])
    useEffect(() => () => abortRef.current?.abort(), [])

    return { data, loading, error, lastCount }
}
