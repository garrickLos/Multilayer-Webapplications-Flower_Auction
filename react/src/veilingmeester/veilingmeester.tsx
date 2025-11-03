import { useEffect, useMemo, useState } from 'react';
import DataTable, { type RowBase } from './ui/DataTable';
import VeilingModal from './ui/VeilingModal';
import { SearchInput, SelectSm, Loading, Pager, Empty, FilterChip } from './ui/components';
import {
    apiGet,
    type Bieding,
    type Categorie,
    type Veilingproduct,
    getCategorieId,
    getCategorieNaam,
    isAbort,
    rowToSearchString,
    toIntOrUndef,
} from './data/utils';
import { useDebounced, useLivePagedList } from './data/live';
import { useLiveNameCache } from './data/liveNameCache';

/* ------------------------------ utils ------------------------------ */
const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short' }).format(d);
const localDT = (v?: string | null) => (v ? fmtDate(new Date(v)) : '');
const fmtEur = (n?: number | null) =>
    n == null || Number.isNaN(+n)
        ? ''
        : new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(+n);
const splitTokens = (q: string) => q.trim().toLowerCase().split(/\s+/).filter(Boolean);
const isString = (v: unknown): v is string => typeof v === 'string';
const getProp = (o: unknown, k: string): unknown => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined);
const asStr = (v: unknown) => (typeof v === 'string' ? v : '');
const asNum = (v: unknown) => (typeof v === 'number' ? v : 0);

/* ================================ page ================================ */
export default function Veilingmeester() {
    const [tab, setTab] = useState<'biedingen' | 'producten'>('producten');
    /* -------- Biedingen -------- */
    const [bPage, setBPage] = useState(1);
    const [bPageSize, setBPageSize] = useState(25);
    const [bQuery, setBQuery] = useState('');
    const dBQuery = useDebounced(bQuery, 250);
    const {
        data: biedingen = [],
        loading: bLoading,
        error: bError,
        lastCount: bLastCount,
    } = useLivePagedList<Bieding>({
        path: '/api/Bieding',
        params: {},
        page: bPage,
        pageSize: bPageSize,
        paramsKey: 'all',
        refreshMs: 60_000,
        revalidateOnFocus: true,
    });
    useEffect(() => setBPage(1), [dBQuery, bPageSize]);
    /* -------- Producten -------- */
    const [q, setQ] = useState('');
    // Debounce product search query to avoid triggering pagination resets on every keystroke
    const dQ = useDebounced(q, 250);
    const [categorieNr, setCategorieNr] = useState<number | '' | null | undefined>('');
    const [vPage, setVPage] = useState(1);
    const [vPageSize, setVPageSize] = useState(25);
    const vParams = useMemo(() => ({ q: dQ || undefined, categorieNr: toIntOrUndef(categorieNr) }), [dQ, categorieNr]);
    const {
        data: producten = [],
        loading: vLoading,
        error: vError,
        lastCount: vLastCount,
    } = useLivePagedList<Veilingproduct>({
        path: '/api/Veilingproduct',
        params: vParams,
        page: vPage,
        pageSize: vPageSize,
        paramsKey: `${vParams.q ?? ''}|${vParams.categorieNr ?? ''}`,
        refreshMs: 60_000,
        revalidateOnFocus: true,
    });
    useEffect(() => setVPage(1), [dQ, categorieNr, vPageSize]);
    /* -------- Categorieën -------- */
    const [catsMap, setCatsMap] = useState<Record<number, string>>({});
    const [catsLoading, setCatsLoading] = useState(false);
    const [catsError, setCatsError] = useState<string | null>(null);
    useEffect(() => {
        const ctl = new AbortController();
        setCatsLoading(true);
        setCatsError(null);
        (async () => {
            try {
                const cats = await apiGet<ReadonlyArray<Categorie>>('/api/Categorie?page=1&pageSize=1000', { signal: ctl.signal });
                const map: Record<number, string> = {};
                for (const c of cats) {
                    const id = getCategorieId(c);
                    const nm = getCategorieNaam(c);
                    if (id != null) map[id] = isString(nm) && nm ? nm : `Categorie ${id}`;
                }
                setCatsMap(map);
            } catch (e) {
                if (!isAbort(e)) setCatsError('Kon categorieën niet laden');
            } finally {
                setCatsLoading(false);
            }
        })();
        return () => ctl.abort();
    }, []);
    /* -------- Naam-resolutie met live cache -------- */
    const { gebruikersMap, veilingenMap, fetchGebruikers, fetchVeilingen } = useLiveNameCache();
    const biedingenAsRows = useMemo(() => (Array.isArray(biedingen) ? (biedingen as ReadonlyArray<Record<string, unknown>>) : []), [biedingen]);
    useEffect(() => {
        const gIds = [...new Set(biedingenAsRows.map(r => r['gebruikerNr']).filter((n): n is number => typeof n === 'number'))];
        const vIds = [...new Set(biedingenAsRows.map(r => r['veilingNr']).filter((n): n is number => typeof n === 'number'))];
        if (gIds.length) fetchGebruikers(gIds);
        if (vIds.length) fetchVeilingen(vIds);
    }, [biedingenAsRows, fetchGebruikers, fetchVeilingen]);
    /* -------- Biedingen-rows & filter -------- */
    const bidRows = useMemo(
        () =>
            biedingenAsRows.map(r => {
                const g = r['gebruikerNr'] as number | undefined;
                const v = r['veilingNr'] as number | undefined;
                return {
                    biedNr: r['biedNr'] ?? '',
                    gebruiker: g != null ? gebruikersMap[g] ?? g : '',
                    veiling: v != null ? veilingenMap[v] ?? v : '',
                    bedragPerFust: r['bedragPerFust'] ?? '',
                    aantalStuks: r['aantalStuks'] ?? '',
                };
            }),
        [biedingenAsRows, gebruikersMap, veilingenMap],
    );
    const filteredBidRows = useMemo(() => {
        const tokens = splitTokens(dBQuery);
        return !bidRows.length || !tokens.length
            ? bidRows
            : bidRows.filter(row => tokens.every(t => rowToSearchString(row).includes(t)));
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
            (Array.isArray(producten) ? producten : []).map((p: Veilingproduct) => {
                let categorieName = asStr(getProp(p, 'categorieNaam'));
                if (!categorieName && p.categorie && typeof p.categorie === 'object') {
                    const nm = getCategorieNaam(p.categorie as Categorie);
                    if (isString(nm) && nm) categorieName = nm;
                }
                if (!categorieName && p.categorieNr != null) {
                    const lookedUp = catsMap[p.categorieNr];
                    if (isString(lookedUp) && lookedUp) categorieName = lookedUp;
                }
                const geplaatstRaw = getProp(p, 'geplaatstDatum');
                const geplaatst = isString(geplaatstRaw) ? localDT(geplaatstRaw) : '';
                const startprijsRaw = getProp(p, 'startprijs');
                const startprijs =
                    typeof startprijsRaw === 'number'
                        ? fmtEur(startprijsRaw)
                        : isString(startprijsRaw) && !Number.isNaN(Number(startprijsRaw))
                            ? fmtEur(Number(startprijsRaw))
                            : '';
                return {
                    veilingProductNr: p.veilingProductNr,
                    naam: asStr(getProp(p, 'naam')),
                    geplaatst,
                    fust: asNum(getProp(p, 'fust')),
                    voorraad: asNum(getProp(p, 'voorraad')),
                    startprijs,
                    categorie: categorieName ?? '',
                };
            }),
        [producten, catsMap],
    );
    /* -------- Modal & paging -------- */
    const [productIdForModal, setProductIdForModal] = useState<number | null>(null);
    const bHasNext = bLastCount >= bPageSize;
    const vHasNext = vLastCount >= vPageSize;
    const tabIds = useMemo(
        () => ({
            biedingen: { tab: 'tab-biedingen', panel: 'panel-biedingen' },
            producten: { tab: 'tab-producten', panel: 'panel-producten' },
        } as const),
        [],
    );
    return (
        <div className="container py-4">
            {/* HERO */}
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm bg-light">
                <h2 className="mb-1">Veilingmeester</h2>
                <p className="text-muted mb-0">Zoek, filter en bekijk biedingen en veilingproducten.</p>
            </section>
            {/* TABS */}
            <ul className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2" role="tablist" aria-label="Hoofdtabbladen">
                {(['biedingen', 'producten'] as const).map(t => (
                    <li key={t} className="nav-item" role="presentation">
                        <button
                            id={tabIds[t].tab}
                            className={`nav-link ${tab === t ? 'active' : ''}`}
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
                hidden={tab !== 'biedingen'}
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
                                onChange={n => {
                                    setBPageSize(n);
                                    setBPage(1);
                                }}
                            />
                        </div>
                    </div>
                    {bError && <div className="alert alert-danger">{bError}</div>}
                    {!bError && (bLoading ? <Loading /> : filteredBidRows.length ? <DataTable rows={filteredBidRows} /> : <Empty />)}
                    <div className="d-flex flex-wrap gap-2 mt-3">
                        {dBQuery.trim() && <FilterChip onClear={() => setBQuery('')}>Zoek: “{dBQuery.trim()}”</FilterChip>}
                    </div>
                    <Pager page={bPage} setPage={setBPage} hasNext={bHasNext} loading={bLoading} total={filteredBidRows.length} />
                </div>
            </section>
            {/* PRODUCTEN */}
            <section
                id={tabIds.producten.panel}
                role="tabpanel"
                aria-labelledby={tabIds.producten.tab}
                hidden={tab !== 'producten'}
                className="card border-0 shadow-sm rounded-4"
            >
                <div className="card-body">
                    <div className="row g-2 align-items-end mb-2">
                        <div className="col-md-5">
                            <SearchInput id="product-zoekterm" label="Zoekterm" value={q} onChange={setQ} placeholder="bijv. roos, tulp…" />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label mb-1" htmlFor="product-categorie">
                                Categorie
                            </label>
                            <select
                                id="product-categorie"
                                className="form-select form-select-sm"
                                value={String(categorieNr)}
                                onChange={e => setCategorieNr(e.target.value === '' ? '' : Number(e.target.value))}
                                disabled={catsLoading}
                                aria-busy={catsLoading || undefined}
                            >
                                <option value="">(alle)</option>
                                {Object.entries(catsMap).map(([catId, naam]) => (
                                    <option key={catId} value={catId}>
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
                                onChange={n => {
                                    setVPageSize(n);
                                    setVPage(1);
                                }}
                            />
                        </div>
                        <div className="col-md-2 text-md-end">
                            <label className="form-label mb-1 d-block">&nbsp;</label>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                    setQ('');
                                    setCategorieNr('');
                                    setVPage(1);
                                    setVPageSize(25);
                                }}
                                disabled={vLoading}
                                aria-label="Reset"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                        {q.trim() && <FilterChip onClear={() => setQ('')}>Zoek: “{q.trim()}”</FilterChip>}
                        {categorieNr !== '' && typeof categorieNr === 'number' && (
                            <FilterChip onClear={() => setCategorieNr('')}>
                                Categorie: {catsMap[categorieNr] ?? categorieNr}
                            </FilterChip>
                        )}
                    </div>
                    {vError && <div className="alert alert-danger">{vError}</div>}
                    {!vError && (
                        vLoading ? (
                            <Loading />
                        ) : productRows.length ? (
                            <DataTable
                                rows={productRows}
                                onRowClick={(row: RowBase & { veilingProductNr?: number }) => {
                                    if (row.veilingProductNr) setProductIdForModal(row.veilingProductNr);
                                }}
                                caption="Klik een rij voor details"
                            />
                        ) : (
                            <Empty />
                        )
                    )}
                    <Pager page={vPage} setPage={setVPage} hasNext={vHasNext} loading={vLoading} total={productRows.length} />
                </div>
            </section>
            {productIdForModal != null && <VeilingModal productId={productIdForModal} onClose={() => setProductIdForModal(null)} />}
        </div>
    );
}