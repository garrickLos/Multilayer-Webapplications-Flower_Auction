import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import {
    apiGet,
    type Bieding,
    type Categorie,
    getCategorieId,
    getCategorieNaam,
    isAbort,
    type MaybeNumber,
    rowToSearchString,
    toIntOrUndefined,
    useDebounced,
    usePagedList,
    type Veilingproduct,
} from "./data"
import { Empty, FilterChip, ArrayTable, SpinnerInline } from "./ui"

/** veilige datumformat */
function fmtDate(iso?: string) {
    if (!iso) return ""
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString()
}

/** API types voor naam-resolutie */
type ApiGebruiker = { gebruikerNr?: number; naam?: string } & Record<string, unknown>
type ApiVeiling = { veilingNr?: number; product?: { naam?: string } | null } & Record<string, unknown>

export default function Veilingmeester() {
    const [tab, setTab] = useState<"biedingen" | "producten">("biedingen")

    // ===== Biedingen filters + paging
    const [gebruikerNr, setGebruikerNr] = useState<MaybeNumber>("")
    const [veilingNr, setVeilingNr] = useState<MaybeNumber>("")
    const [bPage, setBPage] = useState(1)
    const [bPageSize, setBPageSize] = useState(10)
    const [bQuery, setBQuery] = useState("")
    const dBQuery = useDebounced(bQuery)

    const bParams = useMemo(
        () => ({ gebruikerNr: toIntOrUndefined(gebruikerNr), veilingNr: toIntOrUndefined(veilingNr) }),
        [gebruikerNr, veilingNr]
    )
    const {
        data: biedingen = [],
        loading: bLoading,
        error: bError,
        lastCount: bLastCount,
    } = usePagedList<Bieding>({
        path: "/api/Bieding",
        params: bParams,
        page: bPage,
        pageSize: bPageSize,
        paramsKey: `${bParams.gebruikerNr ?? ""}|${bParams.veilingNr ?? ""}`,
    })

    // Null-safe filtering
    const filteredBiedingen = useMemo(() => {
        const items = Array.isArray(biedingen)
            ? (biedingen as ReadonlyArray<Record<string, unknown>>)
            : ([] as ReadonlyArray<Record<string, unknown>>)

        if (!items.length || !dBQuery.trim()) return items
        const tokens = dBQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
        return items.filter((row) => tokens.every((t) => rowToSearchString(row).includes(t)))
    }, [biedingen, dBQuery])

    // ===== Producten filters + paging
    const [q, setQ] = useState("")
    const [categorieNr, setCategorieNr] = useState<MaybeNumber>("")
    const [vPage, setVPage] = useState(1)
    const [vPageSize, setVPageSize] = useState(10)

    const vParams = useMemo(
        () => ({ q: q || undefined, categorieNr: toIntOrUndefined(categorieNr) }),
        [q, categorieNr]
    )
    const {
        data: producten = [],
        loading: vLoading,
        error: vError,
        lastCount: vLastCount,
    } = usePagedList<Veilingproduct>({
        path: "/api/Veilingproduct",
        params: vParams,
        page: vPage,
        pageSize: vPageSize,
        paramsKey: `${vParams.q ?? ""}|${vParams.categorieNr ?? ""}`,
    })

    // ===== Categorieën (map)
    const [catsMap, setCatsMap] = useState<Record<number, string>>({})
    const [catsLoading, setCatsLoading] = useState(false)
    const [catsError, setCatsError] = useState<string | null>(null)
    const catsAbort = useRef<AbortController | null>(null)

    const fetchCategorieen = useCallback(async () => {
        catsAbort.current?.abort()
        const ctl = new AbortController()
        catsAbort.current = ctl
        setCatsLoading(true); setCatsError(null)
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

    useEffect(() => {
        fetchCategorieen()
        return () => catsAbort.current?.abort()
    }, [fetchCategorieen])

    // Page reset bij filterwijziging
    useEffect(() => { setBPage(1) }, [gebruikerNr, veilingNr, bPageSize])
    useEffect(() => { setVPage(1) }, [q, categorieNr, vPageSize])

    // ===== Naam-resolutie (gebruikers en veilingen)
    const [gebruikersMap, setGebruikersMap] = useState<Record<number, string>>({})
    const [veilingenMap, setVeilingenMap] = useState<Record<number, string>>({})

    // Verzamel unieke ids uit biedingen (null-safe) en uit filters (indien ingevuld)
    const pendingGebruikers = useMemo(() => {
        const set = new Set<number>()
        for (const r of filteredBiedingen) {
            const n = (r["gebruikerNr"] as number | undefined)
            if (typeof n === "number") set.add(n)
        }
        const f = toIntOrUndefined(gebruikerNr)
        if (typeof f === "number") set.add(f)
        // filter al bekende
        return [...set].filter((id) => gebruikersMap[id] === undefined)
    }, [filteredBiedingen, gebruikerNr, gebruikersMap])

    const pendingVeilingen = useMemo(() => {
        const set = new Set<number>()
        for (const r of filteredBiedingen) {
            const n = (r["veilingNr"] as number | undefined)
            if (typeof n === "number") set.add(n)
        }
        const f = toIntOrUndefined(veilingNr)
        if (typeof f === "number") set.add(f)
        return [...set].filter((id) => veilingenMap[id] === undefined)
    }, [filteredBiedingen, veilingNr, veilingenMap])

    // Batch-resolve onbekende gebruikers/veilingen zodra nodig
    useEffect(() => {
        if (!pendingGebruikers.length) return
        let cancelled = false
        ;(async () => {
            try {
                const entries = await Promise.all(
                    pendingGebruikers.map(async (id) => {
                        try {
                            const g = await apiGet<ApiGebruiker>(`/api/Gebruiker/${id}`)
                            const naam = (typeof g?.naam === "string" && g.naam.trim()) ? g.naam : `Gebruiker ${id}`
                            return [id, naam] as const
                        } catch { return [id, `Gebruiker ${id}`] as const }
                    })
                )
                if (!cancelled) {
                    setGebruikersMap((prev) => {
                        const next = { ...prev }
                        for (const [id, naam] of entries) if (next[id] === undefined) next[id] = naam
                        return next
                    })
                }
            } catch { /* noop */ }
        })()
        return () => { cancelled = true }
    }, [pendingGebruikers])

    useEffect(() => {
        if (!pendingVeilingen.length) return
        let cancelled = false
        ;(async () => {
            try {
                const entries = await Promise.all(
                    pendingVeilingen.map(async (nr) => {
                        try {
                            const v = await apiGet<ApiVeiling>(`/api/Veiling/${nr}`)
                            const label = v?.product?.naam ? `${v.veilingNr ?? nr} – ${v.product.naam}` : `Veiling ${nr}`
                            return [nr, label] as const
                        } catch { return [nr, `Veiling ${nr}`] as const }
                    })
                )
                if (!cancelled) {
                    setVeilingenMap((prev) => {
                        const next = { ...prev }
                        for (const [nr, label] of entries) if (next[nr] === undefined) next[nr] = label
                        return next
                    })
                }
            } catch { /* noop */ }
        })()
        return () => { cancelled = true }
    }, [pendingVeilingen])

    // Biedingen → platte rijen met namen
    const bidRowsWithNames = useMemo(() => {
        const items = filteredBiedingen
        return items.map((r) => {
            const gNr = r["gebruikerNr"] as number | undefined
            const vNr = r["veilingNr"] as number | undefined
            const gebruiker = (gNr != null && gebruikersMap[gNr] != null) ? gebruikersMap[gNr] : (gNr ?? "")
            const veiling = (vNr != null && veilingenMap[vNr] != null) ? veilingenMap[vNr] : (vNr ?? "")
            return {
                biedNr: r["biedNr"] ?? "",
                gebruiker,
                veiling,
                bedragPerFust: r["bedragPerFust"] ?? "",
                aantalStuks: r["aantalStuks"] ?? "",
            } as Record<string, unknown>
        })
    }, [filteredBiedingen, gebruikersMap, veilingenMap])

    // Producten → platte rijen voor ArrayTable (null-safe)
    const productRows = useMemo(() => {
        const items = Array.isArray(producten) ? producten : []
        const pickId = (p: Veilingproduct) => {
            const r = p as Record<string, unknown>
            return r["veilingNr"] ?? r["biedNr"] ?? p.id ?? r["veilingProductNr"] ?? r["productNr"] ?? ""
        }
        return items.map((p) => ({
            id: pickId(p),
            naam: p.naam ?? "",
            geplaatst: fmtDate(p.geplaatstDatum),
            fust: p.fust ?? "",
            voorraad: p.voorraad ?? "",
            startprijs: p.startprijs ?? "",
            categorie: p.categorieNr != null ? (catsMap[p.categorieNr] ?? p.categorieNr) : "",
        })) as ReadonlyArray<Record<string, unknown>>
    }, [producten, catsMap])

    const helpBtnId = useId()
    const newBtnId = useId()
    const bHasNext = bLastCount >= bPageSize
    const vHasNext = vLastCount >= vPageSize

    return (
        <div className="container py-4">
            {/* HERO */}
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm" style={{ background: "linear-gradient(135deg, #e6f3ea 0%, #ffffff 60%)" }}>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div>
                        <h2 className="mb-1" style={{ background: "linear-gradient(90deg,#2f4137,#4caf50)", WebkitBackgroundClip: "text", color: "transparent" }}>Veilingmeester</h2>
                        <p className="text-muted mb-0">Zoek, filter en bekijk biedingen en veilingproducten.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button id={helpBtnId} className="btn btn-outline-secondary" type="button" aria-describedby={helpBtnId + "-desc"}>Handleiding</button>
                        <span id={helpBtnId + "-desc"} className="visually-hidden">Open de handleiding in een nieuw venster</span>
                        <button id={newBtnId} className="btn btn-success" type="button">Nieuwe veiling</button>
                    </div>
                </div>
            </section>

            {/* TABS */}
            <ul className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2" role="tablist">
                <li className="nav-item">
                    <button type="button" className={`nav-link ${tab === "biedingen" ? "active" : ""}`} onClick={() => setTab("biedingen")} role="tab" aria-selected={tab === "biedingen"}>Biedingen</button>
                </li>
                <li className="nav-item">
                    <button type="button" className={`nav-link ${tab === "producten" ? "active" : ""}`} onClick={() => setTab("producten")} role="tab" aria-selected={tab === "producten"}>Producten</button>
                </li>
            </ul>

            {/* BIEDINGEN */}
            {tab === "biedingen" && (
                <section className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body">
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Gebruiker</label>
                                <input className="form-control form-control-sm" type="number" value={String(gebruikerNr)} onChange={(e) => setGebruikerNr(e.target.value === "" ? "" : Number(e.target.value))} placeholder="ID" inputMode="numeric" />
                                {toIntOrUndefined(gebruikerNr) != null && gebruikersMap[toIntOrUndefined(gebruikerNr)!] && (
                                    <div className="form-text">→ {gebruikersMap[toIntOrUndefined(gebruikerNr)!]}</div>
                                )}
                            </div>
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Veiling</label>
                                <input className="form-control form-control-sm" type="number" value={String(veilingNr)} onChange={(e) => setVeilingNr(e.target.value === "" ? "" : Number(e.target.value))} placeholder="ID" inputMode="numeric" />
                                {toIntOrUndefined(veilingNr) != null && veilingenMap[toIntOrUndefined(veilingNr)!] && (
                                    <div className="form-text">→ {veilingenMap[toIntOrUndefined(veilingNr)!]}</div>
                                )}
                            </div>
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Per pagina</label>
                                <select className="form-select form-select-sm" value={bPageSize} onChange={(e) => { setBPageSize(Number(e.target.value)); setBPage(1) }}>
                                    {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div className="col-12 col-md-3 text-md-end">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setGebruikerNr(""); setVeilingNr(""); setBQuery(""); setBPage(1); setBPageSize(10) }} disabled={bLoading}>Reset</button>
                            </div>
                        </div>

                        <div className="row g-2 align-items-end mb-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label mb-1">Zoek in resultaten</label>
                                <input className="form-control form-control-sm" value={bQuery} onChange={(e) => setBQuery(e.target.value)} placeholder="bijv. 12.5 jan gebruiker123 ..." />
                                <div className="form-text">Zoekt in alle kolommen; hoofdletters en volgorde maken niet uit.</div>
                            </div>
                            <div className="col d-flex align-items-end justify-content-md-end">
                                <span className="text-muted small">{bLoading ? <SpinnerInline /> : `Totaal: ${bidRowsWithNames.length}`}</span>
                            </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2 mb-2">
                            {gebruikerNr !== "" && (
                                <FilterChip onClear={() => setGebruikerNr("")}>
                                    Gebruiker: {gebruikersMap[toIntOrUndefined(gebruikerNr)!] ?? gebruikerNr}
                                </FilterChip>
                            )}
                            {veilingNr !== "" && (
                                <FilterChip onClear={() => setVeilingNr("")}>
                                    Veiling: {veilingenMap[toIntOrUndefined(veilingNr)!] ?? veilingNr}
                                </FilterChip>
                            )}
                        </div>

                        {bError && <div className="alert alert-danger" role="alert">{bError}</div>}
                        {!bError && (
                            <>
                                {bLoading ? (
                                    <div className="placeholder-glow">
                                        <div className="placeholder col-12 mb-2" />
                                        <div className="placeholder col-10 mb-2" />
                                        <div className="placeholder col-8" />
                                    </div>
                                ) : (
                                    bidRowsWithNames.length > 0 ? <ArrayTable rows={bidRowsWithNames} /> : <Empty />
                                )}

                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setBPage((p) => Math.max(1, p - 1))} disabled={bLoading || bPage <= 1}>← Vorige</button>
                                    <div className="small text-muted">Pagina {bPage} • Per pagina: {bPageSize}</div>
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setBPage((p) => p + 1)} disabled={bLoading || !(bLastCount >= bPageSize)}>Volgende →</button>
                                </div>
                            </>
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
                                    {Object.entries(catsMap).map(([id, naam]) => <option key={id} value={id}>{naam}</option>)}
                                </select>
                                {catsError && <div className="form-text text-danger">{catsError}</div>}
                            </div>
                            <div className="col-md-2">
                                <label className="form-label mb-1">Per pagina</label>
                                <select className="form-select form-select-sm" value={vPageSize} onChange={(e) => { setVPageSize(Number(e.target.value)); setVPage(1) }}>
                                    {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2 text-md-end">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setQ(""); setCategorieNr(""); setVPage(1); setVPageSize(10) }} disabled={vLoading}>Reset</button>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex flex-wrap gap-2">
                                {q && <FilterChip onClear={() => setQ("")}>Zoekterm: {q}</FilterChip>}
                                {categorieNr !== "" && <FilterChip onClear={() => setCategorieNr("")}>Categorie: {catsMap[Number(categorieNr)] ?? categorieNr}</FilterChip>}
                            </div>
                            <span className="text-muted small">Pagina {vPage} • Per pagina: {vPageSize}</span>
                        </div>

                        {vError && <div className="alert alert-danger" role="alert">{vError}</div>}
                        {!vError && (
                            <>
                                {vLoading ? (
                                    <div className="placeholder-glow">
                                        <div className="placeholder col-12 mb-2" />
                                        <div className="placeholder col-10 mb-2" />
                                        <div className="placeholder col-8" />
                                    </div>
                                ) : (
                                    productRows.length > 0 ? <ArrayTable rows={productRows} /> : <Empty />
                                )}

                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setVPage((p) => Math.max(1, p - 1))} disabled={vLoading || vPage <= 1}>← Vorige</button>
                                    <div />
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setVPage((p) => p + 1)} disabled={vLoading || !(vLastCount >= vPageSize)}>Volgende →</button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}
