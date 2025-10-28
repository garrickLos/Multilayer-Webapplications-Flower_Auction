import { useEffect, useId, useMemo, useRef, useState } from "react"
import {
    apiGet, type Bieding, type Categorie, getCategorieId, getCategorieNaam,
    isAbort, rowToSearchString, toIntOrUndefined, useDebounced, usePagedList, type Veilingproduct
} from "./data"
import { Empty, FilterChip, ArrayTable } from "./ui"

const fmtDate = (iso?: string) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d.getTime()) ? "" : d.toLocaleString() }
type ApiGebruiker = { gebruikerNr?: number; naam?: string }
type ApiVeiling = { veilingNr?: number; product?: { naam?: string } | null }

export default function Veilingmeester() {
    const [tab, setTab] = useState<"biedingen"|"producten">("biedingen")

    // Biedingen
    const [bPage, setBPage] = useState(1), [bPageSize, setBPageSize] = useState(10)
    const [bQuery, setBQuery] = useState(""); const dBQuery = useDebounced(bQuery)
    const { data: biedingen = [], loading: bLoading, error: bError, lastCount: bLastCount } =
        usePagedList<Bieding>({ path: "/api/Bieding", params: {}, page: bPage, pageSize: bPageSize, paramsKey: "all" })
    useEffect(() => setBPage(1), [dBQuery, bPageSize])

    // Producten
    const [q, setQ] = useState(""), [categorieNr, setCategorieNr] = useState<number|""|null|undefined>("")
    const [vPage, setVPage] = useState(1), [vPageSize, setVPageSize] = useState(10)
    const vParams = useMemo(() => ({ q: q || undefined, categorieNr: toIntOrUndefined(categorieNr) }), [q, categorieNr])
    const { data: producten = [], loading: vLoading, error: vError, lastCount: vLastCount } =
        usePagedList<Veilingproduct>({ path: "/api/Veilingproduct", params: vParams, page: vPage, pageSize: vPageSize, paramsKey: `${vParams.q ?? ""}|${vParams.categorieNr ?? ""}` })
    useEffect(() => setVPage(1), [q, categorieNr, vPageSize])

    // Categorieën
    const [catsMap, setCatsMap] = useState<Record<number,string>>({}), [catsLoading, setCatsLoading] = useState(false)
    const [catsError, setCatsError] = useState<string|null>(null); const catsAbort = useRef<AbortController|null>(null)
    useEffect(() => {
        catsAbort.current?.abort(); const ctl = new AbortController(); catsAbort.current = ctl
        setCatsLoading(true); setCatsError(null)
        ;(async () => {
            try {
                const cats = await apiGet<Categorie[]>("/api/Categorie", { page:1, pageSize:1000 }, ctl.signal)
                const map: Record<number,string> = {}; for (const c of cats) { const id = getCategorieId(c); if (id!=null) map[id] = getCategorieNaam(c) || `Categorie ${id}` }
                setCatsMap(map)
            } catch (e) { if (!isAbort(e)) setCatsError(e instanceof Error ? e.message : "Kon categorieën niet laden") }
            finally { setCatsLoading(false) }
        })()
        return () => ctl.abort()
    }, [])

    // Naam-resolutie (gebruikers & veilingen) op basis van alle biedingen uit de pagina
    const [gebruikersMap, setGebruikersMap] = useState<Record<number,string>>({})
    const [veilingenMap, setVeilingenMap] = useState<Record<number,string>>({})
    const biedRec = useMemo(() => (Array.isArray(biedingen) ? (biedingen as ReadonlyArray<Record<string,unknown>>) : []), [biedingen])
    const collectMissing = (key:"gebruikerNr"|"veilingNr", known:Record<number,string>) => {
        const s = new Set<number>(); for (const r of biedRec) { const n = r[key] as number|undefined; if (typeof n==="number") s.add(n) }
        return [...s].filter(id => known[id]===undefined)
    }
    const pendingGebr = useMemo(() => collectMissing("gebruikerNr", gebruikersMap), [biedRec, gebruikersMap])
    const pendingVeil = useMemo(() => collectMissing("veilingNr", veilingenMap),   [biedRec, veilingenMap])

    useEffect(() => { if (!pendingGebr.length) return; let cancel=false
    ;(async () => {
        const pairs = await Promise.all(pendingGebr.map(async id => {
            try { const g = await apiGet<ApiGebruiker>(`/api/Gebruiker/${id}`); return [id, (g?.naam?.trim()) || `Gebruiker ${id}`] as const }
            catch { return [id, `Gebruiker ${id}`] as const }
        }))
        if (!cancel) setGebruikersMap(p => ({ ...p, ...Object.fromEntries(pairs.filter(([id]) => p[id]===undefined)) }))
    })(); return () => { cancel = true }
    }, [pendingGebr])

    useEffect(() => { if (!pendingVeil.length) return; let cancel=false
    ;(async () => {
        const pairs = await Promise.all(pendingVeil.map(async nr => {
            try { const v = await apiGet<ApiVeiling>(`/api/Veiling/${nr}`); return [nr, v?.product?.naam ? `${v.veilingNr ?? nr} – ${v.product.naam}` : `Veiling ${nr}`] as const }
            catch { return [nr, `Veiling ${nr}`] as const }
        }))
        if (!cancel) setVeilingenMap(p => ({ ...p, ...Object.fromEntries(pairs.filter(([nr]) => p[nr]===undefined)) }))
    })(); return () => { cancel = true }
    }, [pendingVeil])

    // Verrijk → filter (zo werkt zoeken op namen)
    const bidRows = useMemo(() => biedRec.map(r => {
        const g = r["gebruikerNr"] as number|undefined, v = r["veilingNr"] as number|undefined
        return {
            biedNr: r["biedNr"] ?? "",
            gebruiker: g!=null && gebruikersMap[g]!=null ? gebruikersMap[g] : (g ?? ""),
            veiling:   v!=null && veilingenMap[v]!=null ? veilingenMap[v] : (v ?? ""),
            bedragPerFust: r["bedragPerFust"] ?? "",
            aantalStuks: r["aantalStuks"] ?? ""
        }
    }), [biedRec, gebruikersMap, veilingenMap])

    const filteredBidRows = useMemo(() => {
        if (!bidRows.length || !dBQuery.trim()) return bidRows
        const tokens = dBQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
        return bidRows.filter(row => tokens.every(t => rowToSearchString(row).includes(t)))
    }, [bidRows, dBQuery])

    // Product rows
    const productRows = useMemo(() => {
        const items = Array.isArray(producten) ? producten : []
        return items.map(p => {
            const r = p as Record<string,unknown>
            const id = (r["veilingNr"] ?? r["biedNr"] ?? (p as any).id ?? r["veilingProductNr"] ?? r["productNr"]) ?? ""
            return {
                id, naam: p.naam ?? "", geplaatst: fmtDate(p.geplaatstDatum),
                fust: p.fust ?? "", voorraad: p.voorraad ?? "", startprijs: p.startprijs ?? "",
                categorie: p.categorieNr != null ? (catsMap[p.categorieNr] ?? p.categorieNr) : ""
            }
        })
    }, [producten, catsMap])

    const helpBtnId = useId(), newBtnId = useId()
    const bHasNext = bLastCount >= bPageSize, vHasNext = vLastCount >= vPageSize

    return (
        <div className="container py-4">
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm" style={{background:"linear-gradient(135deg,#e6f3ea 0%,#ffffff 60%)"}}>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div>
                        <h2 className="mb-1" style={{background:"linear-gradient(90deg,#2f4137,#4caf50)",WebkitBackgroundClip:"text",color:"transparent"}}>Veilingmeester</h2>
                        <p className="text-muted mb-0">Zoek, filter en bekijk biedingen en veilingproducten.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button id={helpBtnId} className="btn btn-outline-secondary" type="button" aria-describedby={helpBtnId+"-desc"}>Handleiding</button>
                        <span id={helpBtnId+"-desc"} className="visually-hidden">Open de handleiding in een nieuw venster</span>
                        <button id={newBtnId} className="btn btn-success" type="button">Nieuwe veiling</button>
                    </div>
                </div>
            </section>

            <ul className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2" role="tablist">
                <li className="nav-item"><button type="button" className={`nav-link ${tab==="biedingen"?"active":""}`} onClick={()=>setTab("biedingen")} role="tab" aria-selected={tab==="biedingen"}>Biedingen</button></li>
                <li className="nav-item"><button type="button" className={`nav-link ${tab==="producten"?"active":""}`} onClick={()=>setTab("producten")} role="tab" aria-selected={tab==="producten"}>Producten</button></li>
            </ul>

            {tab==="biedingen" && (
                <section className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body">
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-12 col-md-8">
                                <label className="form-label mb-1">Zoek in biedingen</label>
                                <input className="form-control form-control-sm" value={bQuery} onChange={e=>setBQuery(e.target.value)} placeholder="zoek op gebruiker, veiling, bedrag, aantal, etc." />
                                <div className="form-text">Zoekt in alle kolommen (incl. gebruikers- en veilingnaam).</div>
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label mb-1">Per pagina</label>
                                <select className="form-select form-select-sm" value={bPageSize} onChange={e=>{ setBPageSize(+e.target.value); setBPage(1) }}>
                                    {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>

                        {bError && <div className="alert alert-danger" role="alert">{bError}</div>}
                        {!bError && (
                            <>
                                {bLoading ? (
                                    <div className="placeholder-glow"><div className="placeholder col-12 mb-2"/><div className="placeholder col-10 mb-2"/><div className="placeholder col-8"/></div>
                                ) : filteredBidRows.length>0 ? <ArrayTable rows={filteredBidRows}/> : <Empty/>}

                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>setBPage(p=>Math.max(1,p-1))} disabled={bLoading || bPage<=1}>← Vorige</button>
                                    <div className="small text-muted">Totaal: {filteredBidRows.length} • Pagina {bPage} • Per pagina: {bPageSize}</div>
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>setBPage(p=>p+1)} disabled={bLoading || !bHasNext}>Volgende →</button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}

            {tab==="producten" && (
                <section className="card border-0 shadow-sm rounded-4">
                    <div className="card-body">
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-md-5">
                                <label className="form-label mb-1">Zoekterm</label>
                                <input className="form-control form-control-sm" value={q} onChange={e=>setQ(e.target.value)} placeholder="bijv. roos, tulp…" />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label mb-1">Categorie</label>
                                <select className="form-select form-select-sm" value={String(categorieNr)} onChange={e=>setCategorieNr(e.target.value===""?"":Number(e.target.value))} disabled={catsLoading}>
                                    <option value="">(alle)</option>
                                    {Object.entries(catsMap).map(([id, naam]) => <option key={id} value={id}>{naam}</option>)}
                                </select>
                                {catsError && <div className="form-text text-danger">{catsError}</div>}
                            </div>
                            <div className="col-md-2">
                                <label className="form-label mb-1">Per pagina</label>
                                <select className="form-select form-select-sm" value={vPageSize} onChange={e=>{ setVPageSize(+e.target.value); setVPage(1) }}>
                                    {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div className="col-md-2 text-md-end">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>{ setQ(""); setCategorieNr(""); setVPage(1); setVPageSize(10) }} disabled={vLoading}>Reset</button>
                            </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex flex-wrap gap-2">
                                {q && <FilterChip onClear={()=>setQ("")}>Zoekterm: {q}</FilterChip>}
                                {categorieNr!=="" && <FilterChip onClear={()=>setCategorieNr("")}>Categorie: {catsMap[Number(categorieNr)] ?? categorieNr}</FilterChip>}
                            </div>
                            <span className="text-muted small">Pagina {vPage} • Per pagina: {vPageSize}</span>
                        </div>

                        {vError && <div className="alert alert-danger" role="alert">{vError}</div>}
                        {!vError && (
                            <>
                                {vLoading ? (
                                    <div className="placeholder-glow"><div className="placeholder col-12 mb-2"/><div className="placeholder col-10 mb-2"/><div className="placeholder col-8"/></div>
                                ) : productRows.length>0 ? <ArrayTable rows={productRows}/> : <Empty/>}

                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>setVPage(p=>Math.max(1,p-1))} disabled={vLoading || vPage<=1}>← Vorige</button>
                                    <div />
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>setVPage(p=>p+1)} disabled={vLoading || !vHasNext}>Volgende →</button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}
