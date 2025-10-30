import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "./data";
import { Empty, FilterChip, DataTable as ArrayTable, VeilingModal, fmt } from "./ui";

/* =============================== UI atoms =============================== */
const SIZES = [10, 25, 50, 100] as const;

const SelectSm = ({
                      value,
                      onChange,
                      values = SIZES,
                      id,
                      label,
                  }: {
    value: number;
    onChange: (n: number) => void;
    values?: readonly number[];
    id: string;
    label?: string;
}) => (
    <div>
        {label && (
            <label className="form-label mb-1" htmlFor={id}>
                {label}
            </label>
        )}
        <select
            id={id}
            className="form-select form-select-sm"
            value={value}
            onChange={(e) => onChange(+e.target.value)}
            aria-label={label || "Selecteer hoeveelheid per pagina"}
        >
            {values.map((n) => (
                <option key={n} value={n}>
                    {n}
                </option>
            ))}
        </select>
    </div>
);

const Pager = ({
                   page,
                   setPage,
                   hasNext,
                   loading,
                   total,
               }: {
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    hasNext: boolean;
    loading?: boolean;
    total?: number;
}) => (
    <div className="d-flex justify-content-between align-items-center mt-3" aria-live="polite">
        <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
            aria-label="Vorige pagina"
        >
            ← Vorige
        </button>
        <div className="small text-muted">
            Pagina {page}
            {typeof total === "number" && <span className="ms-2">• {total} getoond</span>}
        </div>
        <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || !hasNext}
            aria-label="Volgende pagina"
        >
            Volgende →
        </button>
    </div>
);

const Loading = () => (
    <div className="placeholder-glow" aria-live="polite" aria-busy="true">
        <div className="placeholder col-12 mb-2" />
        <div className="placeholder col-10 mb-2" />
        <div className="placeholder col-8" />
    </div>
);

const SearchInput = ({
                         id,
                         label,
                         value,
                         onChange,
                         placeholder,
                     }: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) => (
    <div>
        <label htmlFor={id} className="form-label mb-1">
            {label}
        </label>
        <input
            id={id}
            className="form-control form-control-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            inputMode="search"
            aria-label={label}
        />
    </div>
);

const ResetButton = ({
                         onClick,
                         disabled,
                         label = "Reset",
                     }: {
    onClick: () => void;
    disabled?: boolean;
    label?: string;
}) => (
    <button className="btn btn-outline-secondary btn-sm" onClick={onClick} disabled={disabled} aria-label={label}>
        {label}
    </button>
);

/* ============================ tiny data helpers ============================ */
const splitTokens = (q: string) => q.trim().toLowerCase().split(/\s+/).filter(Boolean);

/** heel simpele cache + in-flight guard om dubbele requests te voorkomen */
function useNameCache() {
    const [gebruikersMap, setGebruikersMap] = useState<Record<number, string>>({});
    const [veilingenMap, setVeilingenMap] = useState<Record<number, string>>({});
    const inFlightGebr = useRef<Set<number>>(new Set());
    const inFlightVeil = useRef<Set<number>>(new Set());

    const fetchGebruikers = async (ids: number[]) => {
        const todo = ids.filter((id) => !inFlightGebr.current.has(id) && gebruikersMap[id] === undefined);
        if (!todo.length) return;
        todo.forEach((id) => inFlightGebr.current.add(id));
        const pairs = await Promise.all(
            todo.map(async (id) => {
                try {
                    const g = await apiGet<{ gebruikerNr?: number; naam?: string }>(`/api/Gebruiker/${id}`);
                    return [id, g?.naam?.trim() || `Gebruiker ${id}`] as const;
                } catch {
                    return [id, `Gebruiker ${id}`] as const;
                }
            })
        );
        setGebruikersMap((p) => ({ ...p, ...Object.fromEntries(pairs) }));
        todo.forEach((id) => inFlightGebr.current.delete(id));
    };

    const fetchVeilingen = async (ids: number[]) => {
        const todo = ids.filter((id) => !inFlightVeil.current.has(id) && veilingenMap[id] === undefined);
        if (!todo.length) return;
        todo.forEach((id) => inFlightVeil.current.add(id));
        const pairs = await Promise.all(
            todo.map(async (nr) => {
                try {
                    const v = await apiGet<{ veilingNr?: number; product?: { naam?: string } }>(`/api/Veiling/${nr}`);
                    return [nr, v?.product?.naam ? `${v.veilingNr ?? nr} – ${v.product.naam}` : `Veiling ${nr}`] as const;
                } catch {
                    return [nr, `Veiling ${nr}`] as const;
                }
            })
        );
        setVeilingenMap((p) => ({ ...p, ...Object.fromEntries(pairs) }));
        todo.forEach((id) => inFlightVeil.current.delete(id));
    };

    return { gebruikersMap, veilingenMap, fetchGebruikers, fetchVeilingen };
}

/* ================================== Main ================================== */
export default function Veilingmeester() {
    const [tab, setTab] = useState<"biedingen" | "producten">("producten");

    /* -------- Biedingen -------- */
    const [bPage, setBPage] = useState(1);
    const [bPageSize, setBPageSize] = useState(25);
    const [bQuery, setBQuery] = useState("");
    const dBQuery = useDebounced(bQuery, 250);

    const {
        data: biedingen = [],
        loading: bLoading,
        error: bError,
        lastCount: bLastCount,
    } = usePagedList<Bieding>({
        path: "/api/Bieding",
        params: {},
        page: bPage,
        pageSize: bPageSize,
        paramsKey: "all",
    });

    useEffect(() => setBPage(1), [dBQuery, bPageSize]);

    /* -------- Producten -------- */
    const [q, setQ] = useState("");
    const [categorieNr, setCategorieNr] = useState<number | "" | null | undefined>("");
    const [vPage, setVPage] = useState(1);
    const [vPageSize, setVPageSize] = useState(25);

    const vParams = useMemo(
        () => ({ q: q || undefined, categorieNr: toIntOrUndef(categorieNr) }),
        [q, categorieNr]
    );

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
    });

    useEffect(() => setVPage(1), [q, categorieNr, vPageSize]);

    /* -------- Categorieën (abortable) -------- */
    const [catsMap, setCatsMap] = useState<Record<number, string>>({});
    const [catsLoading, setCatsLoading] = useState(false);
    const [catsError, setCatsError] = useState<string | null>(null);
    const catsAbort = useRef<AbortController | null>(null);

    useEffect(() => {
        catsAbort.current?.abort();
        const ctl = new AbortController();
        catsAbort.current = ctl;
        setCatsLoading(true);
        setCatsError(null);
        (async () => {
            try {
                const cats = await apiGet<Categorie[]>("/api/Categorie", { page: 1, pageSize: 1000 }, ctl.signal);
                const map: Record<number, string> = {};
                for (const c of cats) {
                    const id = getCategorieId(c);
                    if (id != null) map[id] = getCategorieNaam(c) || `Categorie ${id}`;
                }
                setCatsMap(map);
            } catch (e) {
                if (!isAbort(e)) setCatsError(e instanceof Error ? e.message : "Kon categorieën niet laden");
            } finally {
                setCatsLoading(false);
            }
        })();
        return () => ctl.abort();
    }, []);

    /* -------- Naam-resolutie met cache -------- */
    const { gebruikersMap, veilingenMap, fetchGebruikers, fetchVeilingen } = useNameCache();
    const biedingenAsRows = useMemo(
        () => (Array.isArray(biedingen) ? (biedingen as ReadonlyArray<Record<string, unknown>>) : []),
        [biedingen]
    );

    useEffect(() => {
        const gIds = [...new Set(biedingenAsRows.map((r) => r["gebruikerNr"]).filter((n): n is number => typeof n === "number"))];
        const vIds = [...new Set(biedingenAsRows.map((r) => r["veilingNr"]).filter((n): n is number => typeof n === "number"))];
        if (gIds.length) fetchGebruikers(gIds);
        if (vIds.length) fetchVeilingen(vIds);
    }, [biedingenAsRows, fetchGebruikers, fetchVeilingen]); // fetchers zijn stabiel via hook

    /* -------- Biedingen-rows & filter -------- */
    const bidRows = useMemo(
        () =>
            biedingenAsRows.map((r) => {
                const g = r["gebruikerNr"] as number | undefined;
                const v = r["veilingNr"] as number | undefined;
                return {
                    biedNr: r["biedNr"] ?? "",
                    gebruiker: g != null ? gebruikersMap[g] ?? g : "",
                    veiling: v != null ? veilingenMap[v] ?? v : "",
                    bedragPerFust: r["bedragPerFust"] ?? "",
                    aantalStuks: r["aantalStuks"] ?? "",
                };
            }),
        [biedingenAsRows, gebruikersMap, veilingenMap]
    );

    const filteredBidRows = useMemo(() => {
        const base = bidRows;
        const tokens = splitTokens(dBQuery);
        if (!base.length || !tokens.length) return base;
        return base.filter((row) => tokens.every((t) => rowToSearchString(row).includes(t)));
    }, [bidRows, dBQuery]);

    /* -------- Product-rows -------- */
    type ProductRow = {
        veilingProductNr?: number;
        naam?: string;
        geplaatst?: string;
        fust?: number;
        voorraad?: number;
        startprijs?: string;
        categorie?: string;
    };

    const productRows = useMemo<ProductRow[]>(
        () =>
            (Array.isArray(producten) ? producten : []).map((p: any) => ({
                veilingProductNr: p.veilingProductNr,
                naam: p.naam ?? "",
                geplaatst: fmt.localDateTime(p.geplaatstDatum),
                fust: p.fust ?? 0,
                voorraad: p.voorraad ?? 0,
                startprijs: fmt.eur(p.startprijs),
                categorie: p.categorie ?? p.categorieNaam ?? (p.categorieNr != null ? catsMap[p.categorieNr] ?? "" : ""),
            })),
        [producten, catsMap]
    );

    /* -------- Modal & paging -------- */
    const [productIdForModal, setProductIdForModal] = useState<number | null>(null);
    const bHasNext = bLastCount >= bPageSize;
    const vHasNext = vLastCount >= vPageSize;

    /* -------- Tab IDs for a11y -------- */
    const tabIds = {
        biedingen: { tab: "tab-biedingen", panel: "panel-biedingen" },
        producten: { tab: "tab-producten", panel: "panel-producten" },
    } as const;

    return (
        <div className="container py-4">
            {/* HERO */}
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm bg-light">
                <h2 className="mb-1">Veilingmeester</h2>
                <p className="text-muted mb-0">Zoek, filter en bekijk biedingen en veilingproducten.</p>
            </section>

            {/* TABS */}
            <ul className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2" role="tablist" aria-label="Hoofdtabbladen">
                {(["biedingen", "producten"] as const).map((t) => (
                    <li key={t} className="nav-item" role="presentation">
                        <button
                            id={tabIds[t].tab}
                            className={`nav-link ${tab === t ? "active" : ""}`}
                            onClick={() => setTab(t)}
                            role="tab"
                            aria-selected={tab === t}
                            aria-controls={tabIds[t].panel}
                        >
                            {t[0].toUpperCase() + t.slice(1)}
                        </button>
                    </li>
                ))}
            </ul>

            {/* BIEDINGEN */}
            <section
                id={tabIds.biedingen.panel}
                role="tabpanel"
                aria-labelledby={tabIds.biedingen.tab}
                hidden={tab !== "biedingen"}
                className="card border-0 shadow-sm rounded-4 mb-4"
            >
                <div className="card-body">
                    <div className="row g-2 align-items-end mb-2">
                        <div className="col-12 col-md-8">
                            <SearchInput
                                id="bid-search"
                                label="Zoek in biedingen"
                                value={bQuery}
                                onChange={setBQuery}
                                placeholder="zoek op gebruiker, veiling, bedrag, aantal, etc."
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <SelectSm
                                id="bid-page-size"
                                label="Per pagina"
                                value={bPageSize}
                                onChange={(n) => {
                                    setBPageSize(n);
                                    setBPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {bError && <div className="alert alert-danger">{bError}</div>}
                    {!bError &&
                        (bLoading ? <Loading /> : filteredBidRows.length ? <ArrayTable rows={filteredBidRows} /> : <Empty />)}

                    <div className="d-flex flex-wrap gap-2 mt-3">
                        {dBQuery.trim() && <FilterChip onClear={() => setBQuery("")}>Zoek: “{dBQuery.trim()}”</FilterChip>}
                    </div>

                    <Pager page={bPage} setPage={setBPage} hasNext={bHasNext} loading={bLoading} total={filteredBidRows.length} />
                </div>
            </section>

            {/* PRODUCTEN */}
            <section
                id={tabIds.producten.panel}
                role="tabpanel"
                aria-labelledby={tabIds.producten.tab}
                hidden={tab !== "producten"}
                className="card border-0 shadow-sm rounded-4"
            >
                <div className="card-body">
                    <div className="row g-2 align-items-end mb-2">
                        <div className="col-md-5">
                            <SearchInput
                                id="product-zoekterm"
                                label="Zoekterm"
                                value={q}
                                onChange={setQ}
                                placeholder="bijv. roos, tulp…"
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label mb-1" htmlFor="product-categorie">
                                Categorie
                            </label>
                            <select
                                id="product-categorie"
                                className="form-select form-select-sm"
                                value={String(categorieNr)}
                                onChange={(e) => setCategorieNr(e.target.value === "" ? "" : Number(e.target.value))}
                                disabled={catsLoading}
                                aria-busy={catsLoading || undefined}
                            >
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
                            <SelectSm
                                id="product-page-size"
                                label="Per pagina"
                                value={vPageSize}
                                onChange={(n) => {
                                    setVPageSize(n);
                                    setVPage(1);
                                }}
                            />
                        </div>
                        <div className="col-md-2 text-md-end">
                            <label className="form-label mb-1 d-block">&nbsp;</label>
                            <ResetButton
                                onClick={() => {
                                    setQ("");
                                    setCategorieNr("");
                                    setVPage(1);
                                    setVPageSize(25);
                                }}
                                disabled={vLoading}
                            />
                        </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-2">
                        {q.trim() && <FilterChip onClear={() => setQ("")}>Zoek: “{q.trim()}”</FilterChip>}
                        {categorieNr !== "" && typeof categorieNr === "number" && (
                            <FilterChip onClear={() => setCategorieNr("")}>
                                Categorie: {catsMap[categorieNr] ?? categorieNr}
                            </FilterChip>
                        )}
                    </div>

                    {vError && <div className="alert alert-danger">{vError}</div>}
                    {!vError &&
                        (vLoading ? (
                            <Loading />
                        ) : productRows.length ? (
                            <ArrayTable
                                rows={productRows}
                                onRowClick={(row) => row.veilingProductNr && setProductIdForModal(row.veilingProductNr)}
                                caption="Klik een rij voor details"
                            />
                        ) : (
                            <Empty />
                        ))}

                    <Pager page={vPage} setPage={setVPage} hasNext={vHasNext} loading={vLoading} total={productRows.length} />
                </div>
            </section>

            {productIdForModal != null && (
                <VeilingModal productId={productIdForModal} onClose={() => setProductIdForModal(null)} />
            )}
        </div>
    );
}
