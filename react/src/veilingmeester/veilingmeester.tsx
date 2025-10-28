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
import { Empty, FilterChip, renderArrayAsTable, SpinnerInline } from "./ui"

export default function Veilingmeester() {
    // Tabs
    const [tab, setTab] = useState<"biedingen" | "producten">("biedingen")

    // Biedingen filters + paging
    const [gebruikerNr, setGebruikerNr] = useState<MaybeNumber>("")
    const [veilingNr, setVeilingNr] = useState<MaybeNumber>("")
    const [bPage, setBPage] = useState(1)
    const [bPageSize, setBPageSize] = useState(10)
    const [bQuery, setBQuery] = useState("")
    const dBQuery = useDebounced(bQuery)

    // Producten filters + paging
    const [q, setQ] = useState("")
    const [categorieNr, setCategorieNr] = useState<MaybeNumber>("")
    const [vPage, setVPage] = useState(1)
    const [vPageSize, setVPageSize] = useState(10)

    // Debounced filters (server-side)
    const dGebruikerNr = useDebounced(gebruikerNr)
    const dVeilingNr = useDebounced(veilingNr)
    const dQ = useDebounced(q)
    const dCategorieNr = useDebounced(categorieNr)

    // Categorieën
    const [catsMap, setCatsMap] = useState<Record<number, string>>({})
    const [catsLoading, setCatsLoading] = useState(false)
    const [catsError, setCatsError] = useState<string | null>(null)
    const catsAbort = useRef<AbortController | null>(null)

    // Fetch categorieën
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

    useEffect(() => {
        fetchCategorieen()
        return () => catsAbort.current?.abort()
    }, [fetchCategorieen])

    // Reset page bij filter changes
    useEffect(() => { setBPage(1) }, [dGebruikerNr, dVeilingNr, bPageSize])
    useEffect(() => { setVPage(1) }, [dQ, dCategorieNr, vPageSize])

    // Server data hooks
    const {
        data: biedingen = [],
        loading: bLoading,
        error: bError,
        lastCount: bLastCount,
    } = usePagedList<Bieding>({
        path: "/api/Bieding",
        params: { gebruikerNr: toIntOrUndefined(dGebruikerNr), veilingNr: toIntOrUndefined(dVeilingNr) },
        page: bPage,
        pageSize: bPageSize,
    })

    const {
        data: producten = [],
        loading: vLoading,
        error: vError,
        lastCount: vLastCount,
    } = usePagedList<Veilingproduct>({
        path: "/api/Veilingproduct",
        params: { q: dQ || undefined, categorieNr: toIntOrUndefined(dCategorieNr) },
        page: vPage,
        pageSize: vPageSize,
    })

    // Biedingen: client-side filter
    const filteredBiedingen = useMemo(() => {
        if (!biedingen?.length || !dBQuery.trim()) return biedingen as Record<string, unknown>[]
        const tokens = dBQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
        return (biedingen as Record<string, unknown>[]).filter((row) => {
            const hay = rowToSearchString(row)
            return tokens.every((t) => hay.includes(t))
        })
    }, [biedingen, dBQuery])

    // Producten: slimme kolommen
    const productenTable = useMemo(() => {
        if (!producten?.length) return null
        const idKeyCandidates = ["veilingNr", "biedNr", "id", "veilingProductNr", "productNr"]
        const idKey = idKeyCandidates.find((k) => producten.some((p: any) => p[k] != null && p[k] !== "")) || "id"
        const looksLike = producten.some((p: any) => "naam" in p || "startprijs" in p || "geplaatstDatum" in p)
        const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "")

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
                    {producten.map((p: any, i: number) => (
                        <tr key={p[idKey] ?? i}>
                            <td>{p[idKey] ?? ""}</td>
                            {looksLike && (
                                <>
                                    <td>{p.naam ?? ""}</td>
                                    <td>{fmtDate(p.geplaatstDatum)}</td>
                                    <td>{p.fust ?? ""}</td>
                                    <td>{p.voorraad ?? ""}</td>
                                    <td>{p.startprijs ?? ""}</td>
                                    <td>{p.categorieNr != null && catsMap[p.categorieNr] ? catsMap[p.categorieNr] : (p.categorieNr ?? "")}</td>
                                </>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        )
    }, [producten, catsMap])

    // UI ids
    const helpBtnId = useId()
    const newBtnId = useId()

    // Paging flags
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
                        <button id={helpBtnId} className="btn btn-outline-secondary" type="button" aria-describedby={helpBtnId + "-desc"}>Handleiding</button>
                        <span id={helpBtnId + "-desc"} className="visually-hidden">Open de handleiding in een nieuw venster</span>
                        <button id={newBtnId} className="btn btn-success" type="button">Nieuwe veiling</button>
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
                        {/* Filters + Reset */}
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Gebruiker</label>
                                <input className="form-control form-control-sm" type="number" value={String(gebruikerNr)} onChange={(e) => setGebruikerNr(e.target.value === "" ? "" : Number(e.target.value))} placeholder="ID" inputMode="numeric" />
                            </div>
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Veiling</label>
                                <input className="form-control form-control-sm" type="number" value={String(veilingNr)} onChange={(e) => setVeilingNr(e.target.value === "" ? "" : Number(e.target.value))} placeholder="ID" inputMode="numeric" />
                            </div>
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Per pagina</label>
                                <select className="form-select form-select-sm" value={bPageSize} onChange={(e) => { setBPageSize(Number(e.target.value)); setBPage(1) }}>
                                    {[10, 25, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
                                </select>
                            </div>
                            <div className="col-12 col-md-3 text-md-end">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => { setGebruikerNr(""); setVeilingNr(""); setBQuery(""); setBPage(1); setBPageSize(10) }} disabled={bLoading}>Reset</button>
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
                                <span className="text-muted small">{bLoading ? <SpinnerInline /> : `Totaal: ${filteredBiedingen?.length ?? 0}`}</span>
                            </div>
                        </div>

                        {/* Actieve filters */}
                        <div className="d-flex flex-wrap gap-2 mb-2">
                            {gebruikerNr !== "" && <FilterChip onClear={() => setGebruikerNr("")}>Gebruiker: {gebruikerNr}</FilterChip>}
                            {veilingNr !== "" && <FilterChip onClear={() => setVeilingNr("")}>Veiling: {veilingNr}</FilterChip>}
                        </div>

                        {/* Content */}
                        {bError && (<div className="alert alert-danger" role="alert">{bError}</div>)}
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
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setBPage((p) => Math.max(1, p - 1))} disabled={bLoading || bPage <= 1}>← Vorige</button>
                                    <div className="small text-muted">Pagina {bPage} • Per pagina: {bPageSize}</div>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setBPage((p) => p + 1)} disabled={bLoading || !(bLastCount >= bPageSize)}>Volgende →</button>
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
                                    {Object.entries(catsMap).map(([id, naam]) => (<option key={id} value={id}>{naam}</option>))}
                                </select>
                                {catsError && <div className="form-text text-danger">{catsError}</div>}
                            </div>
                            <div className="col-md-2">
                                <label className="form-label mb-1">Per pagina</label>
                                <select className="form-select form-select-sm" value={vPageSize} onChange={(e) => { setVPageSize(Number(e.target.value)); setVPage(1) }}>
                                    {[10, 25, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
                                </select>
                            </div>
                            <div className="col-md-2 text-md-end">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => { setQ(""); setCategorieNr(""); setVPage(1); setVPageSize(10) }} disabled={vLoading}>Reset</button>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex flex-wrap gap-2">
                                {q && <FilterChip onClear={() => setQ("")}>Zoekterm: {q}</FilterChip>}
                                {categorieNr !== "" && <FilterChip onClear={() => setCategorieNr("")}>Categorie: {catsMap[Number(categorieNr)] ?? categorieNr}</FilterChip>}
                            </div>
                            <span className="text-muted small">Pagina {vPage} • Per pagina: {vPageSize}</span>
                        </div>

                        {vError && (<div className="alert alert-danger" role="alert">{vError}</div>)}
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
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setVPage((p) => Math.max(1, p - 1))} disabled={vLoading || vPage <= 1}>← Vorige</button>
                                    <div />
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setVPage((p) => p + 1)} disabled={vLoading || !(vLastCount >= vPageSize)}>Volgende →</button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}
