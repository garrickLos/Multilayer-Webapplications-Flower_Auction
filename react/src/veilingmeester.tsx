import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"

/**
 * ===== Types =====
 */
type MaybeNumber = number | "" | null | undefined

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

type Categorie = {
    id?: number
    categorieNr?: number
    naam?: string
    name?: string
} & Record<string, unknown>

/**
 * ===== Small helpers =====
 */
const isNonEmpty = (v: unknown) => v !== undefined && v !== null && v !== ""

function getCategorieId(c: Categorie): number | undefined {
    return (typeof c.id === "number" ? c.id : undefined) ??
        (typeof c.categorieNr === "number" ? c.categorieNr : undefined)
}
function getCategorieNaam(c: Categorie): string {
    return (typeof c.naam === "string" ? c.naam : undefined) ?? (typeof c.name === "string" ? c.name : "")
}

function toIntOrUndefined(v: MaybeNumber): number | undefined {
    const n = Number(v)
    return Number.isFinite(n) && v !== "" ? n : undefined
}

function firstExistingKey<T extends object>(rows: T[], candidates: string[]): string | undefined {
    // Prefer a key that actually has a non-empty value in at least one row
    return candidates.find(
        (k) => rows.some((r) => Object.prototype.hasOwnProperty.call(r, k) && isNonEmpty((r as any)[k]))
    )
}

// Maak van een rij 1 doorzoekbare string (alle velden, nested & arrays)
function rowToSearchString(row: Record<string, unknown>): string {
    const out: string[] = []
    const stack: any[] = [row]
    const seen = new WeakSet<object>()
    let guard = 0
    while (stack.length && guard++ < 5000) {
        const cur = stack.pop()
        if (cur == null) continue
        if (typeof cur === "string" || typeof cur === "number" || typeof cur === "boolean") {
            out.push(String(cur))
        } else if (Array.isArray(cur)) {
            for (const v of cur) stack.push(v)
        } else if (typeof cur === "object") {
            if (seen.has(cur)) continue
            seen.add(cur)
            for (const v of Object.values(cur)) stack.push(v)
        }
    }
    return out.join(" ").toLowerCase()
}

function matchesTokens(hay: string, q: string): boolean {
    const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return tokens.every((t) => hay.includes(t))
}

/**
 * ===== Debounce hook (stable timeout) =====
 */
function useDebounced<T>(value: T, delay = 300): T {
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

/**
 * ===== API helper (robust JSON parsing) =====
 */
async function apiGet<T>(
    path: string,
    params: Record<string, string | number | undefined> = {},
    signal?: AbortSignal
): Promise<T> {
    const usp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
        if (isNonEmpty(v)) usp.set(k, String(v))
    })
    const url = `${path}${usp.toString() ? `?${usp.toString()}` : ""}`
    const res = await fetch(url, { signal })

    if (!res.ok) {
        // Try get body text for debugging
        let text = ""
        try {
            text = await res.text()
        } catch {}
        throw new Error(`GET ${path} failed: ${res.status} ${res.statusText} ${text}`)
    }

    const contentLength = res.headers.get("content-length")
    const ct = (res.headers.get("content-type") || "").toLowerCase()

    if (contentLength === "0") return ([] as unknown) as T
    if (ct.includes("application/json")) {
        return (await res.json()) as T
    }
    // Fallback to text -> JSON if possible, else empty array
    const text = await res.text()
    return (text ? JSON.parse(text) : ([] as unknown)) as T
}

/**
 * ===== Component =====
 */
export default function Veilingmeester() {
    // Tabs
    const [tab, setTab] = useState<"biedingen" | "producten">("biedingen")

    // Biedingen filters + paging
    const [gebruikerNr, setGebruikerNr] = useState<MaybeNumber>("")
    const [veilingNr, setVeilingNr] = useState<MaybeNumber>("")
    const [bPage, setBPage] = useState(1)
    const [bPageSize, setBPageSize] = useState(10)
    const [biedingen, setBiedingen] = useState<Bieding[] | null>(null)
    const [bLoading, setBLoading] = useState(false)
    const [bError, setBError] = useState<string | null>(null)
    const [bLastCount, setBLastCount] = useState(0)
    // Biedingen: client-side zoekbalk
    const [bQuery, setBQuery] = useState("")
    const dBQuery = useDebounced(bQuery)

    // Producten filters + paging
    const [q, setQ] = useState<string>("")
    const [categorieNr, setCategorieNr] = useState<MaybeNumber>("")
    const [vPage, setVPage] = useState(1)
    const [vPageSize, setVPageSize] = useState(10)
    const [producten, setProducten] = useState<Veilingproduct[] | null>(null)
    const [vLoading, setVLoading] = useState(false)
    const [vError, setVError] = useState<string | null>(null)
    const [vLastCount, setVLastCount] = useState(0)

    // Categorieën
    const [catsMap, setCatsMap] = useState<Record<number, string>>({})
    const [catsLoading, setCatsLoading] = useState(false)
    const [catsError, setCatsError] = useState<string | null>(null)

    // Abort
    const biedingAbort = useRef<AbortController | null>(null)
    const productAbort = useRef<AbortController | null>(null)
    const catsAbort = useRef<AbortController | null>(null)

    const isAbort = (e: unknown) =>
        (e instanceof DOMException && e.name === "AbortError") ||
        (typeof e === "object" && e !== null && (e as any).name === "AbortError")

    // Debounced filters (avoid hammering API)
    const dGebruikerNr = useDebounced(gebruikerNr)
    const dVeilingNr = useDebounced(veilingNr)
    const dQ = useDebounced(q)
    const dCategorieNr = useDebounced(categorieNr)

    // Fetchers (useCallback for stable identities)
    const fetchBiedingen = useCallback(async () => {
        biedingAbort.current?.abort()
        const ctl = new AbortController()
        biedingAbort.current = ctl
        setBLoading(true)
        setBError(null)
        try {
            const data = await apiGet<Bieding[]>(
                "/api/Bieding",
                {
                    gebruikerNr: toIntOrUndefined(dGebruikerNr),
                    veilingNr: toIntOrUndefined(dVeilingNr),
                    page: bPage,
                    pageSize: bPageSize,
                },
                ctl.signal
            )
            const arr = Array.isArray(data) ? data : []
            setBLastCount(arr.length)
            if (arr.length === 0 && bPage > 1) {
                // Try one step back to avoid dead-end page
                setBPage((p) => Math.max(1, p - 1))
                return
            }
            setBiedingen(arr)
        } catch (e) {
            if (!isAbort(e)) setBError(e instanceof Error ? e.message : "Er is iets misgegaan.")
        } finally {
            setBLoading(false)
        }
    }, [dGebruikerNr, dVeilingNr, bPage, bPageSize])

    const fetchProducten = useCallback(async () => {
        productAbort.current?.abort()
        const ctl = new AbortController()
        productAbort.current = ctl
        setVLoading(true)
        setVError(null)
        try {
            const data = await apiGet<Veilingproduct[]>(
                "/api/Veilingproduct",
                { q: dQ || undefined, categorieNr: toIntOrUndefined(dCategorieNr), page: vPage, pageSize: vPageSize },
                ctl.signal
            )
            const arr = Array.isArray(data) ? data : []
            setVLastCount(arr.length)
            if (arr.length === 0 && vPage > 1) {
                setVPage((p) => Math.max(1, p - 1))
                return
            }
            setProducten(arr)
        } catch (e) {
            if (!isAbort(e)) setVError(e instanceof Error ? e.message : "Er is iets misgegaan.")
        } finally {
            setVLoading(false)
        }
    }, [dQ, dCategorieNr, vPage, vPageSize])

    const fetchCategorieen = useCallback(async () => {
        catsAbort.current?.abort()
        const ctl = new AbortController()
        catsAbort.current = ctl
        setCatsLoading(true)
        setCatsError(null)
        try {
            const cats = await apiGet<Categorie[]>("/api/Categorie", { page: 1, pageSize: 1000 }, ctl.signal)
            const map: Record<number, string> = {}
            for (const c of cats) {
                const id = getCategorieId(c)
                if (id != null) map[id] = getCategorieNaam(c) || `Categorie ${id}`
            }
            setCatsMap(map)
        } catch (e) {
            if (!isAbort(e)) setCatsError(e instanceof Error ? e.message : "Kon categorieën niet laden")
        } finally {
            setCatsLoading(false)
        }
    }, [])

    // Initial
    useEffect(() => {
        fetchCategorieen()
        return () => {
            catsAbort.current?.abort()
            biedingAbort.current?.abort()
            productAbort.current?.abort()
        }
    }, [fetchCategorieen])

    // Reset page naar 1 bij filter changes
    useEffect(() => {
        setBPage(1)
    }, [dGebruikerNr, dVeilingNr, bPageSize])

    useEffect(() => {
        setVPage(1)
    }, [dQ, dCategorieNr, vPageSize])

    // Auto-fetch
    useEffect(() => {
        fetchBiedingen()
    }, [fetchBiedingen])

    useEffect(() => {
        fetchProducten()
    }, [fetchProducten])

    // Biedingen: client-side filter
    const filteredBiedingen = useMemo(() => {
        if (!Array.isArray(biedingen) || !dBQuery.trim()) return biedingen ?? []
        const tokens = dBQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
        return (biedingen as Record<string, unknown>[]).filter((row) => {
            const hay = rowToSearchString(row)
            return tokens.every((t) => hay.includes(t))
        })
    }, [biedingen, dBQuery])

    // Producten: slimme kolommen
    const productenTable = useMemo(() => {
        if (!producten?.length) return null
        const idKey = firstExistingKey(producten, ["veilingNr", "biedNr", "id", "veilingProductNr", "productNr"]) ?? "id"
        const looksLike = producten.some((p) => "naam" in p || "startprijs" in p || "geplaatstDatum" in p)

        const formatDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "")

        return (
            <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                    <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                    <tr>
                        <th className="text-nowrap">{idKey}</th>
                        {looksLike && (
                            <>
                                <th className="text-nowrap">Naam</th>
                                <th className="text-nowrap">Geplaatst</th>
                                <th className="text-nowrap">Fust</th>
                                <th className="text-nowrap">Voorraad</th>
                                <th className="text-nowrap">Startprijs</th>
                                <th className="text-nowrap">Categorie</th>
                            </>
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {producten.map((p, i) => (
                        <tr key={(p as any)[idKey] ?? i}>
                            <td>{(p as any)[idKey] ?? ""}</td>
                            {looksLike && (
                                <>
                                    <td>{(p as any).naam ?? ""}</td>
                                    <td>{formatDateTime((p as any).geplaatstDatum)}</td>
                                    <td>{(p as any).fust ?? ""}</td>
                                    <td>{(p as any).voorraad ?? ""}</td>
                                    <td>{(p as any).startprijs ?? ""}</td>
                                    <td>
                                        {(p as any).categorieNr != null && catsMap[(p as any).categorieNr]
                                            ? catsMap[(p as any).categorieNr]
                                            : (p as any).categorieNr ?? ""}
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        )
    }, [producten, catsMap])

    // UI bits
    const helpBtnId = useId()
    const newBtnId = useId()

    const SpinnerInline = ({ text = "Laden…" }: { text?: string }) => (
        <span className="d-inline-flex align-items-center gap-2 text-muted" aria-live="polite">
      <span className="spinner-border spinner-border-sm" role="status" aria-label="laden" />
      <span>{text}</span>
    </span>
    )

    const Empty = ({ label = "Geen resultaten." }: { label?: string }) => (
        <div className="text-center text-muted py-5" role="status" aria-live="polite">
            <div className="display-6 mb-2">🌿</div>
            <p className="m-0">{label}</p>
        </div>
    )

    const FilterChip = ({ children, onClear }: { children: React.ReactNode; onClear: () => void }) => (
        <span className="badge rounded-pill bg-light text-body-secondary border d-inline-flex align-items-center gap-2">
      <span className="ps-2">{children}</span>
      <button className="btn btn-sm btn-link text-body-secondary py-0 pe-2" onClick={onClear} aria-label="Verwijder filter">
        ×
      </button>
    </span>
    )

    // Derived booleans for paging controls
    const bHasNext = bLastCount >= bPageSize
    const vHasNext = vLastCount >= vPageSize

    return (
        <div className="container py-4">
            {/* HERO */}
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm" style={{ background: "linear-gradient(135deg, #e6f3ea 0%, #ffffff 60%)" }}>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div>
                        <h2 className="mb-1" style={{ background: "linear-gradient(90deg,#2f4137,#4caf50)", WebkitBackgroundClip: "text", color: "transparent" }}>
                            Veilingmeester
                        </h2>
                        <p className="text-muted mb-0">Zoek, filter en bekijk biedingen en veilingproducten.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button id={helpBtnId} className="btn btn-outline-secondary" type="button" aria-describedby={helpBtnId + "-desc"}>
                            Handleiding
                        </button>
                        <span id={helpBtnId + "-desc"} className="visually-hidden">
              Open de handleiding in een nieuw venster
            </span>
                        <button id={newBtnId} className="btn btn-success" type="button">
                            Nieuwe veiling
                        </button>
                    </div>
                </div>
            </section>

            {/* TABS */}
            <ul className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2" role="tablist">
                <li className="nav-item">
                    <button className={`nav-link ${tab === "biedingen" ? "active" : ""}`} onClick={() => setTab("biedingen")} role="tab" aria-selected={tab === "biedingen"}>
                        Biedingen
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === "producten" ? "active" : ""}`} onClick={() => setTab("producten")} role="tab" aria-selected={tab === "producten"}>
                        Producten
                    </button>
                </li>
            </ul>

            {/* BIEDINGEN */}
            {tab === "biedingen" && (
                <section className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body">
                        {/* Filters + Reset op dezelfde rij */}
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Gebruiker</label>
                                <input
                                    className="form-control form-control-sm"
                                    type="number"
                                    value={String(gebruikerNr)}
                                    onChange={(e) => setGebruikerNr(e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="ID"
                                    inputMode="numeric"
                                />
                            </div>
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Veiling</label>
                                <input
                                    className="form-control form-control-sm"
                                    type="number"
                                    value={String(veilingNr)}
                                    onChange={(e) => setVeilingNr(e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="ID"
                                    inputMode="numeric"
                                />
                            </div>
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Per pagina</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={bPageSize}
                                    onChange={(e) => {
                                        setBPageSize(Number(e.target.value))
                                        setBPage(1)
                                    }}
                                >
                                    {[10, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-12 col-md-3 text-md-end">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => {
                                        setGebruikerNr("")
                                        setVeilingNr("")
                                        setBQuery("")
                                        setBPage(1)
                                        setBPageSize(10)
                                    }}
                                    disabled={bLoading}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Client-side zoekbalk */}
                        <div className="row g-2 align-items-end mb-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label mb-1">Zoek in resultaten</label>
                                <input className="form-control form-control-sm" value={bQuery} onChange={(e) => setBQuery(e.target.value)} placeholder="bijv. 12.5 jan gebruiker123 ..." />
                                <div className="form-text">Zoekt in alle kolommen; hoofdletters en volgorde maken niet uit.</div>
                            </div>
                            <div className="col d-flex align-items-end justify-content-md-end">
                                <span className="text-muted small">{bLoading ? "Laden…" : `Totaal: ${filteredBiedingen?.length ?? 0}`}</span>
                            </div>
                        </div>

                        {/* Actieve filters (server-side) */}
                        <div className="d-flex flex-wrap gap-2 mb-2">
                            {gebruikerNr !== "" && <FilterChip onClear={() => setGebruikerNr("")}>Gebruiker: {gebruikerNr}</FilterChip>}
                            {veilingNr !== "" && <FilterChip onClear={() => setVeilingNr("")}>Veiling: {veilingNr}</FilterChip>}
                        </div>

                        {/* Content */}
                        {bError && (
                            <div className="alert alert-danger" role="alert">
                                {bError}
                            </div>
                        )}
                        {!bError && (
                            <div className="mt-2">
                                {bLoading && (
                                    <div className="placeholder-glow">
                                        <div className="placeholder col-12 mb-2" />
                                        <div className="placeholder col-10 mb-2" />
                                        <div className="placeholder col-8" />
                                    </div>
                                )}
                                {!bLoading && (Array.isArray(filteredBiedingen) && filteredBiedingen.length > 0 ? renderArrayAsTable(filteredBiedingen as Record<string, unknown>[]) : <Empty />)}

                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setBPage((p) => Math.max(1, p - 1))} disabled={bLoading || bPage <= 1}>
                                        ← Vorige
                                    </button>
                                    <div className="small text-muted">Pagina {bPage} • Per pagina: {bPageSize}</div>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setBPage((p) => p + 1)} disabled={bLoading || !bHasNext}>
                                        Volgende →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* PRODUCTEN */}
            {tab === "producten" && (
                <section className="card border-0 shadow-sm rounded-4">
                    <div className="card-body">
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-md-5">
                                <label className="form-label mb-1">Zoekterm</label>
                                <input className="form-control form-control-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="bijv. roos, tulp…" />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label mb-1">Categorie</label>
                                <select className="form-select form-select-sm" value={String(categorieNr)} onChange={(e) => setCategorieNr(e.target.value === "" ? "" : Number(e.target.value))} disabled={catsLoading}>
                                    <option value="">(alle)</option>
                                    {Object.entries(catsMap).map(([id, naam]) => (
                                        <option key={id} value={id}>
                                            {naam}
                                        </option>
                                    ))}
                                </select>
                                {catsError && <div className="form-text text-danger">{catsError}</div>}
                            </div>
                            <div className="col-md-2">
                                <label className="form-label mb-1">Per pagina</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={vPageSize}
                                    onChange={(e) => {
                                        setVPageSize(Number(e.target.value))
                                        setVPage(1)
                                    }}
                                >
                                    {[10, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2 text-md-end">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => { setQ(""); setCategorieNr(""); setVPage(1); setVPageSize(10) }} disabled={vLoading}>
                                    Reset
                                </button>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex flex-wrap gap-2">
                                {q && <FilterChip onClear={() => setQ("")}>Zoekterm: {q}</FilterChip>}
                                {categorieNr !== "" && <FilterChip onClear={() => setCategorieNr("")}>Categorie: {catsMap[Number(categorieNr)] ?? categorieNr}</FilterChip>}
                            </div>
                            <span className="text-muted small">Pagina {vPage} • Per pagina: {vPageSize}</span>
                        </div>

                        {vError && (
                            <div className="alert alert-danger" role="alert">
                                {vError}
                            </div>
                        )}
                        {!vError && (
                            <div className="mt-2">
                                {vLoading && (
                                    <div className="placeholder-glow">
                                        <div className="placeholder col-12 mb-2" />
                                        <div className="placeholder col-10 mb-2" />
                                        <div className="placeholder col-8" />
                                    </div>
                                )}
                                {!vLoading && (productenTable || (Array.isArray(producten) && producten.length > 0 ? renderArrayAsTable(producten as Record<string, unknown>[]) : <Empty />))}

                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setVPage((p) => Math.max(1, p - 1))} disabled={vLoading || vPage <= 1}>
                                        ← Vorige
                                    </button>
                                    <div />
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setVPage((p) => p + 1)} disabled={vLoading || !vHasNext}>
                                        Volgende →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}

/**
 * ===== Fallback table =====
 */
function renderArrayAsTable(rows: Record<string, unknown>[]) {
    if (!rows.length) return <div className="text-center text-muted py-5">Geen resultaten.</div>
    const cols = Array.from(
        rows.reduce<Set<string>>((acc, r) => {
            Object.keys(r).forEach((k) => acc.add(k))
            return acc
        }, new Set())
    ).slice(0, 10)

    return (
        <div className="table-responsive">
            <table className="table table-sm table-striped table-hover align-middle">
                <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                <tr>{cols.map((c) => <th key={c} className="text-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody>
                {rows.map((r, i) => (
                    <tr key={i}>
                        {cols.map((c) => (
                            <td key={c}>{formatCell((r as any)[c])}</td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

function formatCell(v: unknown) {
    if (v == null) return ""
    if (typeof v === "string") return v
    if (typeof v === "number" || typeof v === "boolean") return String(v)
    try {
        return JSON.stringify(v)
    } catch {
        return String(v)
    }
}
