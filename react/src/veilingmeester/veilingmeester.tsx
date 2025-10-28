import { useEffect, useId, useMemo, useRef, useState } from "react"
import {
    apiGet, type Bieding, type Categorie, getCategorieId, getCategorieNaam,
    isAbort, rowToSearchString, toIntOrUndefined, useDebounced, usePagedList, type Veilingproduct
} from "./data"
import { Empty, FilterChip, ArrayTable } from "./ui"

const fmtDate = (iso?: string) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d.getTime()) ? "" : d.toLocaleString() }
const eur = (v: unknown) => (v==null || isNaN(Number(v))) ? "" : new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"}).format(Number(v))

type ApiGebruiker = { gebruikerNr?: number; naam?: string }
type ApiVeiling = { veilingNr?: number; begintijd?: string; eindtijd?: string; status?: string; afbeelding?: string; product?: { veilingNr?: number; naam?: string; startprijs?: number; voorraad?: number } }

export default function Veilingmeester() {
    const [tab, setTab] = useState<"biedingen"|"producten">("producten")

    // ===== Biedingen (client search)
    const [bPage, setBPage] = useState(1), [bPageSize, setBPageSize] = useState(10)
    const [bQuery, setBQuery] = useState(""); const dBQuery = useDebounced(bQuery)
    const { data: biedingen = [], loading: bLoading, error: bError, lastCount: bLastCount } =
        usePagedList<Bieding>({ path: "/api/Bieding", params: {}, page: bPage, pageSize: bPageSize, paramsKey: "all" })
    useEffect(()=>setBPage(1),[dBQuery,bPageSize])

    // ===== Producten (server filters + paging)
    const [q, setQ] = useState(""), [categorieNr, setCategorieNr] = useState<number|""|null|undefined>("")
    const [vPage, setVPage] = useState(1), [vPageSize, setVPageSize] = useState(10)
    const vParams = useMemo(()=>({ q: q || undefined, categorieNr: toIntOrUndefined(categorieNr) }),[q,categorieNr])
    const { data: producten = [], loading: vLoading, error: vError, lastCount: vLastCount } =
        usePagedList<Veilingproduct>({ path: "/api/Veilingproduct", params: vParams, page: vPage, pageSize: vPageSize, paramsKey: `${vParams.q ?? ""}|${vParams.categorieNr ?? ""}` })
    useEffect(()=>setVPage(1),[q,categorieNr,vPageSize])

    // ===== Categorieën (alleen voor fallback)
    const [catsMap, setCatsMap] = useState<Record<number,string>>({}), [catsLoading, setCatsLoading] = useState(false)
    const [catsError, setCatsError] = useState<string|null>(null); const catsAbort = useRef<AbortController|null>(null)
    useEffect(()=>{ catsAbort.current?.abort(); const ctl=new AbortController(); catsAbort.current=ctl; setCatsLoading(true); setCatsError(null);
        (async()=>{ try{
            const cats=await apiGet<Categorie[]>("/api/Categorie",{page:1,pageSize:1000},ctl.signal)
            const map:Record<number,string>={}; for(const c of cats){ const id=getCategorieId(c); if(id!=null) map[id]=getCategorieNaam(c)||`Categorie ${id}` } setCatsMap(map)
        }catch(e){ if(!isAbort(e)) setCatsError(e instanceof Error?e.message:"Kon categorieën niet laden") } finally{ setCatsLoading(false) } })()
        return ()=>ctl.abort()
    },[])

    // ===== Naam-resolutie (biedingen) – kort
    const [gebruikersMap,setGebruikersMap]=useState<Record<number,string>>({}), [veilingenMap,setVeilingenMap]=useState<Record<number,string>>({})
    const biedRec = useMemo(()=>Array.isArray(biedingen)? (biedingen as ReadonlyArray<Record<string,unknown>>) : [],[biedingen])
    const need = (key:"gebruikerNr"|"veilingNr", known:Record<number,string>) => [...new Set(biedRec.map(r=>r[key]).filter(n=>typeof n==="number") as number[])].filter(id=>known[id]===undefined)
    useEffect(()=>{ const ids=need("gebruikerNr",gebruikersMap); if(!ids.length) return; let c=false;(async()=>{const pairs=await Promise.all(ids.map(async id=>{try{const g=await apiGet<ApiGebruiker>(`/api/Gebruiker/${id}`);return[id,g?.naam?.trim()||`Gebruiker ${id}`] as const}catch{return[id,`Gebruiker ${id}`] as const}})); if(!c) setGebruikersMap(p=>({...p,...Object.fromEntries(pairs.filter(([id])=>p[id]===undefined))}))})(); return()=>{c=true}},[biedRec,gebruikersMap])
    useEffect(()=>{ const ids=need("veilingNr",veilingenMap); if(!ids.length) return; let c=false;(async()=>{const pairs=await Promise.all(ids.map(async nr=>{try{const v=await apiGet<ApiVeiling>(`/api/Veiling/${nr}`);return[nr, v?.product?.naam?`${v.veilingNr ?? nr} – ${v.product.naam}`:`Veiling ${nr}`] as const}catch{return[nr,`Veiling ${nr}`] as const}})); if(!c) setVeilingenMap(p=>({...p,...Object.fromEntries(pairs.filter(([nr])=>p[nr]===undefined))}))})(); return()=>{c=true}},[biedRec,veilingenMap])

    // ===== Biedingen: verrijken → filter
    const bidRows = useMemo(()=>biedRec.map(r=>{
        const g=r["gebruikerNr"] as number|undefined, v=r["veilingNr"] as number|undefined
        return { biedNr:r["biedNr"]??"", gebruiker:g!=null?(gebruikersMap[g]??g):"", veiling:v!=null?(veilingenMap[v]??v):"", bedragPerFust:r["bedragPerFust"]??"", aantalStuks:r["aantalStuks"]??"" }
    }),[biedRec,gebruikersMap,veilingenMap])
    const filteredBidRows = useMemo(()=>{ if(!bidRows.length || !dBQuery.trim()) return bidRows; const tokens=dBQuery.trim().toLowerCase().split(/\s+/).filter(Boolean); return bidRows.filter(row=>tokens.every(t=>rowToSearchString(row).includes(t))) },[bidRows,dBQuery])

    // ===== Producten: zichtbare kolommen + € + categorie-naam (geen ID)
    type ProductRow = { veilingNr?: number; naam?: string; geplaatst?: string; fust?: number; voorraad?: number; startprijs?: string; categorie?: string }
    const productRows = useMemo<ProductRow[]>(()=> {
        const items = Array.isArray(producten) ? producten : []
        return items.map(p=>{
            const any = p as any
            return {
                veilingNr: any.veilingNr,                                   // zichtbaar en te klikken (via onRowClick)
                naam: p.naam ?? "",
                geplaatst: fmtDate(p.geplaatstDatum),
                fust: p.fust ?? 0,
                voorraad: p.voorraad ?? 0,
                startprijs: eur(p.startprijs),
                categorie: any.categorie ?? (any.categorieNaam ?? (any.categorieNr!=null ? (catsMap[any.categorieNr] ?? "") : "")),
            }
        })
    },[producten,catsMap])

    // ===== Popup veilingdetail
    const [show,setShow]=useState(false)
    const [detail,setDetail]=useState<ApiVeiling|null|{error?:true;notFound?:true}>(null)
    const openDetail = async (row: ProductRow) => {
        if (!row.veilingNr) return
        setShow(true); setDetail(null)
        try {
            const res = await apiGet<ApiVeiling[]|ApiVeiling>("/api/Veiling")
            const found = Array.isArray(res) ? res.find(v=>v.product?.veilingNr===row.veilingNr) : (res?.product?.veilingNr===row.veilingNr ? res : undefined)
            setDetail(found ?? {notFound:true})
        } catch { setDetail({error:true}) }
    }

    const helpBtnId = useId(), newBtnId = useId()
    const bHasNext = bLastCount >= bPageSize, vHasNext = vLastCount >= vPageSize

    return (
        <div className="container py-4">
            {/* HERO */}
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm" style={{background:"linear-gradient(135deg,#e6f3ea 0%,#ffffff 60%)"}}>
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div>
                        <h2 className="mb-1" style={{background:"linear-gradient(90deg,#2f4137,#4caf50)",WebkitBackgroundClip:"text",color:"transparent"}}>Veilingmeester</h2>
                        <p className="text-muted mb-0">Zoek, filter en bekijk biedingen en veilingproducten.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button id={helpBtnId} className="btn btn-outline-secondary" type="button" aria-describedby={helpBtnId+"-desc"}>Handleiding</button>
                        <span id={helpBtnId+"-desc"} className="visually-hidden">Open de handleiding</span>
                        <button id={newBtnId} className="btn btn-success" type="button">Nieuwe veiling</button>
                    </div>
                </div>
            </section>

            {/* TABS */}
            <ul className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2" role="tablist">
                <li className="nav-item"><button type="button" className={`nav-link ${tab==="biedingen"?"":" "}`} onClick={()=>setTab("biedingen")} role="tab" aria-selected={tab==="biedingen"}>Biedingen</button></li>
                <li className="nav-item"><button type="button" className={`nav-link ${tab==="producten"?"active":""}`} onClick={()=>setTab("producten")} role="tab" aria-selected={tab==="producten"}>Producten</button></li>
            </ul>

            {/* BIEDINGEN */}
            {tab==="biedingen" && (
                <section className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body">
                        <div className="row g-2 align-items-end mb-2">
                            <div className="col-12 col-md-8">
                                <label className="form-label mb-1">Zoek in biedingen</label>
                                <input className="form-control form-control-sm" value={bQuery} onChange={e=>setBQuery(e.target.value)} placeholder="zoek op gebruiker, veiling, bedrag, aantal, etc." />
                                <div className="form-text">Zoekt in alle kolommen (incl. namen).</div>
                            </div>
                            <div className="col-12 col-md-4">
                                <label className="form-label mb-1">Per pagina</label>
                                <select className="form-select form-select-sm" value={bPageSize} onChange={e=>{ setBPageSize(+e.target.value); setBPage(1) }}>
                                    {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>

                        {bError && <div className="alert alert-danger" role="alert">{bError}</div>}
                        {!bError && (bLoading ? (
                            <div className="placeholder-glow"><div className="placeholder col-12 mb-2"/><div className="placeholder col-10 mb-2"/><div className="placeholder col-8"/></div>
                        ) : (filteredBidRows.length>0 ? <ArrayTable rows={filteredBidRows}/> : <Empty/>))}

                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <button className="btn btn-outline-secondary btn-sm" onClick={()=>setBPage(p=>Math.max(1,p-1))} disabled={bLoading || bPage<=1}>← Vorige</button>
                            <div className="small text-muted">Totaal: {filteredBidRows.length} • Pagina {bPage} • Per pagina: {bPageSize}</div>
                            <button className="btn btn-outline-secondary btn-sm" onClick={()=>setBPage(p=>p+1)} disabled={bLoading || !(bHasNext)}>Volgende →</button>
                        </div>
                    </div>
                </section>
            )}

            {/* PRODUCTEN */}
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
                                <button className="btn btn-outline-secondary btn-sm" onClick={()=>{ setQ(""); setCategorieNr(""); setVPage(1); setVPageSize(10) }} disabled={vLoading}>Reset</button>
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
                        {!vError && (vLoading ? (
                            <div className="placeholder-glow"><div className="placeholder col-12 mb-2"/><div className="placeholder col-10 mb-2"/><div className="placeholder col-8"/></div>
                        ) : (productRows.length>0 ? <ArrayTable rows={productRows} onRowClick={openDetail}/> : <Empty/>))}

                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <button className="btn btn-outline-secondary btn-sm" onClick={()=>setVPage(p=>Math.max(1,p-1))} disabled={vLoading || vPage<=1}>← Vorige</button>
                            <div />
                            <button className="btn btn-outline-secondary btn-sm" onClick={()=>setVPage(p=>p+1)} disabled={vLoading || !(vHasNext)}>Volgende →</button>
                        </div>
                    </div>
                </section>
            )}

            {/* MODAL */}
            {show && (
                <div className="position-fixed top-0 start-0 w-100 h-100" style={{background:"rgba(0,0,0,.4)", zIndex:1050}} onClick={()=>setShow(false)}>
                    <div className="card shadow-lg position-absolute top-50 start-50 translate-middle" style={{maxWidth:720, width:"96%"}} onClick={e=>e.stopPropagation()}>
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <strong>Veilingdetail</strong>
                            <button className="btn btn-sm btn-outline-secondary" onClick={()=>setShow(false)}>Sluiten</button>
                        </div>
                        <div className="card-body">
                            {!detail && <div className="placeholder-glow"><div className="placeholder col-12 mb-2"/><div className="placeholder col-10"/></div>}
                            {detail && "error" in detail && detail.error && <div className="alert alert-danger">Kon veiling niet laden.</div>}
                            {detail && "notFound" in detail && detail.notFound && <div className="alert alert-warning">Geen veiling gevonden voor dit product.</div>}
                            {detail && !("error" in detail) && !("notFound" in detail) && (
                                <div className="row g-3">
                                    {detail.afbeelding && <div className="col-md-5"><img src={detail.afbeelding} alt={detail.product?.naam ?? "product"} className="img-fluid rounded" /></div>}
                                    <div className={detail.afbeelding ? "col-md-7" : "col-12"}>
                                        <h5 className="mb-1">{detail.product?.naam}</h5>
                                        <div className="text-muted mb-2">Veiling #{detail.veilingNr} • {detail.status ?? "Status onbekend"}</div>
                                        <dl className="row mb-0">
                                            <dt className="col-5 col-md-4">Startprijs</dt><dd className="col-7 col-md-8">{eur(detail.product?.startprijs)}</dd>
                                            <dt className="col-5 col-md-4">Voorraad</dt><dd className="col-7 col-md-8">{detail.product?.voorraad ?? ""}</dd>
                                            <dt className="col-5 col-md-4">Begintijd</dt><dd className="col-7 col-md-8">{detail.begintijd ?? ""}</dd>
                                            <dt className="col-5 col-md-4">Eindtijd</dt><dd className="col-7 col-md-8">{detail.eindtijd ?? ""}</dd>
                                        </dl>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
