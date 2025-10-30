import { useEffect, useMemo, useRef, useState } from "react"
import {
    apiGet,
    type Bieding,
    type Categorie,
    getCategorieId,
    getCategorieNaam,
    isAbort,
    rowToSearchString,
    toIntOrUndef,
    useDebounced,
    usePagedList,
    type Veilingproduct,
} from "./data"
import { Empty, FilterChip, DataTable as ArrayTable, VeilingModal, fmt } from "./ui"

type ApiGebruiker = { gebruikerNr?: number; naam?: string }
type ApiVeiling = { veilingNr?: number; product?: { naam?: string } }

export default function Veilingmeester() {
    const [tab, setTab] = useState<"biedingen" | "producten">("producten")

    // ===== Biedingen
    const [bPage, setBPage] = useState(1)
    const [bPageSize, setBPageSize] = useState(10)
    const [bQuery, setBQuery] = useState("")
    const dBQuery = useDebounced(bQuery, 250)

    const { data: biedingen = [], loading: bLoading, error: bError, lastCount: bLastCount } =
        usePagedList<Bieding>({ path: "/api/Bieding", params: {}, page: bPage, pageSize: bPageSize, paramsKey: "all" })
    useEffect(() => setBPage(1), [dBQuery, bPageSize])

    // ===== Producten
    const [q, setQ] = useState("")
    const [categorieNr, setCategorieNr] = useState<number | "" | null | undefined>("")
    const [vPage, setVPage] = useState(1)
    const [vPageSize, setVPageSize] = useState(10)
    const vParams = useMemo(() => ({ q: q || undefined, categorieNr: toIntOrUndef(categorieNr) }), [q, categorieNr])

    const { data: producten = [], loading: vLoading, error: vError, lastCount: vLastCount } =
        usePagedList<Veilingproduct>({
            path: "/api/Veilingproduct",
            params: vParams,
            page: vPage,
            pageSize: vPageSize,
            paramsKey: `${vParams.q ?? ""}|${vParams.categorieNr ?? ""}`,
        })
    useEffect(() => setVPage(1), [q, categorieNr, vPageSize])

    // ===== Categorieën
    const [catsMap, setCatsMap] = useState<Record<number, string>>({})
    const [catsLoading, setCatsLoading] = useState(false)
    const [catsError, setCatsError] = useState<string | null>(null)
    const catsAbort = useRef<AbortController | null>(null)
    useEffect(() => {
        catsAbort.current?.abort()
        const ctl = new AbortController()
        catsAbort.current = ctl
        setCatsLoading(true)
        setCatsError(null)
        ;(async () => {
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
        })()
        return () => ctl.abort()
    }, [])

    // ===== Naam-resolutie voor biedingen
    const [gebruikersMap, setGebruikersMap] = useState<Record<number, string>>({})
    const [veilingenMap, setVeilingenMap] = useState<Record<number, string>>({})
    const biedRec = useMemo(
        () => (Array.isArray(biedingen) ? (biedingen as ReadonlyArray<Record<string, unknown>>) : []),
        [biedingen]
    )
    const uniqNeeded = (key: "gebruikerNr" | "veilingNr", known: Record<number, string>) =>
        [...new Set(biedRec.map((r) => r[key]).filter((n) => typeof n === "number") as number[])].filter(
            (id) => known[id] === undefined
        )

    useEffect(() => {
        const ids = uniqNeeded("gebruikerNr", gebruikersMap)
        if (!ids.length) return
        let canceled = false
        ;(async () => {
            const pairs = await Promise.all(
                ids.map(async (id) => {
                    try {
                        const g = await apiGet<ApiGebruiker>(`/api/Gebruiker/${id}`)
                        return [id, g?.naam?.trim() || `Gebruiker ${id}`] as const
                    } catch {
                        return [id, `Gebruiker ${id}`] as const
                    }
                })
            )
            if (!canceled)
                setGebruikersMap((p) => ({ ...p, ...Object.fromEntries(pairs.filter(([id]) => p[id] === undefined)) }))
        })()
        return () => { canceled = true }
    }, [biedRec, gebruikersMap])

    useEffect(() => {
        const ids = uniqNeeded("veilingNr", veilingenMap)
        if (!ids.length) return
        let canceled = false
        ;(async () => {
            const pairs = await Promise.all(
                ids.map(async (nr) => {
                    try {
                        const v = await apiGet<ApiVeiling>(`/api/Veiling/${nr}`)
                        return [nr, v?.product?.naam ? `${v.veilingNr ?? nr} – ${v.product.naam}` : `Veiling ${nr}`] as const
                    } catch {
                        return [nr, `Veiling ${nr}`] as const
                    }
                })
            )
            if (!canceled)
                setVeilingenMap((p) => ({ ...p, ...Object.fromEntries(pairs.filter(([nr]) => p[nr] === undefined)) }))
        })()
        return () => { canceled = true }
    }, [biedRec, veilingenMap])

    // ===== Biedingen rows + filter
    const bidRows = useMemo(
        () =>
            biedRec.map((r) => {
                const g = r["gebruikerNr"] as number | undefined
                const v = r["veilingNr"] as number | undefined
                return {
                    biedNr: r["biedNr"] ?? "",
                    gebruiker: g != null ? gebruikersMap[g] ?? g : "",
                    veiling: v != null ? veilingenMap[v] ?? v : "",
                    bedragPerFust: r["bedragPerFust"] ?? "",
                    aantalStuks: r["aantalStuks"] ?? "",
                }
            }),
        [biedRec, gebruikersMap, veilingenMap]
    )
    const filteredBidRows = useMemo(() => {
        if (!bidRows.length || !dBQuery.trim()) return bidRows
        const tokens = dBQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
        return bidRows.filter((row) => tokens.every((t) => rowToSearchString(row).includes(t)))
    }, [bidRows, dBQuery])

    // ===== Product rows
    type ProductRow = {
        veilingProductNr?: number
        naam?: string
        geplaatst?: string
        fust?: number
        voorraad?: number
        startprijs?: string
        categorie?: string
    }
    const productRows = useMemo<ProductRow[]>(() => {
        const items = Array.isArray(producten) ? producten : []
        return items.map((p) => {
            const any = p as any
            return {
                veilingProductNr: p.veilingProductNr,
                naam: p.naam ?? "",
                geplaatst: fmt.localDateTime(p.geplaatstDatum),
                fust: p.fust ?? 0,
                voorraad: p.voorraad ?? 0,
                startprijs: fmt.eur(p.startprijs),
                categorie: any.categorie ?? any.categorieNaam ?? (any.categorieNr != null ? catsMap[any.categorieNr] ?? "" : ""),
            }
        })
    }, [producten, catsMap])

    // ===== Popup trigger
    const [productIdForModal, setProductIdForModal] = useState<number | null>(null)
    const bHasNext = bLastCount >= bPageSize
    const vHasNext = vLastCount >= vPageSize

    return (
        <div className="container py-4">
            {/* HERO */}
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm" style={{ background: "linear-gradient(135deg,#e6f3ea 0%,#ffffff 60%)" }}>
                <h2 className="mb-0" style={{ background: "linear-gradient(90deg,#2f4137,#4caf50)", WebkitBackgroundClip: "text", color: "transparent" }}>
                    Veilingmeester
                </h2>
                <p className="text-muted mb-0">Zoek, filter en bekijk biedingen en veilingproducten.</p>
            </section>

            {/* TABS */}
            <ul className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2">
                <li className="nav-item"><button className={`nav-link ${tab === "biedingen" ? "active" : ""}`} onClick={() => setTab("biedingen")}>Biedingen</button></li>
                <li className="nav-item"><button className={`nav-link ${tab === "producten" ? "active" : ""}`} onClick={() => setTab("producten")}>Producten</button></li>
            </ul>

            {/* BIEDINGEN */}
            {tab === "biedingen" && (
                <section className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body">
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-12 col-md-8">
                                <label className="form-label mb-1">Zoek in biedingen</label>
                                <input className="form-control form-control-sm" value={bQuery} onChange={(e) => setBQuery(e.target.value)} placeholder="zoek op gebruiker, veiling, bedrag, aantal, etc." />
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label mb-1">Per pagina</label>
                                <select className="form-select form-select-sm" value={bPageSize} onChange={(e) => { setBPageSize(+e.target.value); setBPage(1) }}>
                                    {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>

                        {bError && <div className="alert alert-danger">{bError}</div>}
                        {!bError && (bLoading ? (
                            <div className="placeholder-glow"><div className="placeholder col-12 mb-2" /><div className="placeholder col-10 mb-2" /><div className="placeholder col-8" /></div>
                        ) : (filteredBidRows.length > 0 ? <ArrayTable rows={filteredBidRows} /> : <Empty />))}

                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setBPage((p) => Math.max(1, p - 1))} disabled={bLoading || bPage <= 1}>← Vorige</button>
                            <div className="small text-muted">Totaal: {filteredBidRows.length} • Pagina {bPage} • Per pagina: {bPageSize}</div>
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setBPage((p) => p + 1)} disabled={bLoading || !bHasNext}>Volgende →</button>
                        </div>
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
                                <select className="form-select form-select-sm" value={vPageSize} onChange={(e) => { setVPageSize(+e.target.value); setVPage(1) }}>
                                    {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2 text-md-end">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => { setQ(""); setCategorieNr(""); setVPage(1); setVPageSize(10) }} disabled={vLoading}>Reset</button>
                            </div>
                        </div>

                        {vError && <div className="alert alert-danger">{vError}</div>}
                        {!vError && (vLoading ? (
                            <div className="placeholder-glow"><div className="placeholder col-12 mb-2" /><div className="placeholder col-10 mb-2" /><div className="placeholder col-8" /></div>
                        ) : (productRows.length > 0 ? (
                            <ArrayTable rows={productRows} onRowClick={(row) => row.veilingProductNr && setProductIdForModal(row.veilingProductNr)} />
                        ) : <Empty />))}

                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setVPage((p) => Math.max(1, p - 1))} disabled={vLoading || vPage <= 1}>← Vorige</button>
                            <div />
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setVPage((p) => p + 1)} disabled={vLoading || !vHasNext}>Volgende →</button>
                        </div>
                    </div>
                </section>
            )}

            {/* MODAL */}
            {productIdForModal != null && (
                <VeilingModal productId={productIdForModal} onClose={() => setProductIdForModal(null)} />
            )}
        </div>
    )
}
