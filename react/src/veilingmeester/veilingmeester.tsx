import { useCallback, useEffect, useMemo, useState } from 'react';
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


/* Helpers
 * Datum- en valutaformatting + generieke hulpfuncties.
*/

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'short',
    timeStyle: 'short',
});
const currencyFormatter = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
});
const fmtDate = (d?: string | null) => (d ? dateFormatter.format(new Date(d)) : '');
const fmtEur = (n?: number | string | null) => {
    const value = typeof n === 'string' ? Number(n) : n;
    return value != null && !Number.isNaN(value) ? currencyFormatter.format(value) : '';
};
const splitTokens = (q: string) => q.trim().toLowerCase().split(/\s+/).filter(Boolean);
const isString = (v: unknown): v is string => typeof v === 'string';
const getProp = (o: unknown, k: string): unknown =>
    o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined;

const toErrorString = (rawError: unknown, fallback: string): string | null => {
    if (!rawError) return null;
    if (typeof rawError === 'string') return rawError;
    if (rawError instanceof Error) return rawError.message;
    return fallback;
};

const TAB_IDS = {
    biedingen: { tab: 'tab-biedingen', panel: 'panel-biedingen' },
    producten: { tab: 'tab-producten', panel: 'panel-producten' },
} as const;


/* Custom hooks
 * Ophalen en voorbereiden van data voor de UI.
*/

// Haalt categorieën op en bouwt een map {id -> naam}
function useCategories() {
    const [catsMap, setCatsMap] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const ctl = new AbortController();
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const cats = await apiGet<ReadonlyArray<Categorie>>('/api/Categorie?page=1&pageSize=1000', {
                    signal: ctl.signal,
                });
                const map: Record<number, string> = {};
                for (const c of cats) {
                    const id = getCategorieId(c);
                    const nm = getCategorieNaam(c);
                    if (id != null) map[id] = isString(nm) && nm ? nm : `Categorie ${id}`;
                }
                setCatsMap(map);
            } catch (e) {
                if (!isAbort(e)) setError('Kon categorieën niet laden');
            } finally {
                setLoading(false);
            }
        })();

        return () => ctl.abort();
    }, []);

    return { catsMap, loading, error };
}

// Haalt biedingen op, verrijkt met namen en filtert op zoekterm
function useBidRows(page: number, pageSize: number, query: string) {
    const dQuery = useDebounced(query, 250);

    const {
        data = [],
        loading,
        error: rawError,
        lastCount,
    } = useLivePagedList<Bieding>({
        path: '/api/Bieding',
        params: {},
        page,
        pageSize,
        paramsKey: 'all',
        refreshMs: 1_000,
        revalidateOnFocus: true,
    });

    const error = toErrorString(rawError, 'Kon biedingen niet laden');

    const { gebruikersMap, veilingenMap, fetchGebruikers, fetchVeilingen } = useLiveNameCache();

    const rowsAsObjects = useMemo(
        () => (Array.isArray(data) ? (data as ReadonlyArray<Record<string, unknown>>) : []),
        [data],
    );

    // Voor alle rijen bijbehorende gebruikers/veilingen ophalen
    useEffect(() => {
        const gIds = [...new Set(rowsAsObjects.map(r => r['gebruikerNr']).filter((n): n is number => typeof n === 'number'))];
        const vIds = [...new Set(rowsAsObjects.map(r => r['veilingNr']).filter((n): n is number => typeof n === 'number'))];
        if (gIds.length) fetchGebruikers(gIds);
        if (vIds.length) fetchVeilingen(vIds);
    }, [rowsAsObjects, fetchGebruikers, fetchVeilingen]);

    // Rijen zoals getoond in de tabel
    const bidRows = useMemo(
        () =>
            rowsAsObjects.map(r => {
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
        [rowsAsObjects, gebruikersMap, veilingenMap],
    );

    // Client-side filtering op zoekterm
    const filteredRows = useMemo(() => {
        const tokens = splitTokens(dQuery);
        if (!tokens.length) return bidRows;
        return bidRows.filter(row => tokens.every(t => rowToSearchString(row).includes(t)));
    }, [bidRows, dQuery]);

    const hasNext = lastCount >= pageSize;
    return { rows: filteredRows, loading, error, hasNext };
}

// Haalt veilingproducten op (met server-side zoek/filters)
function useProductRows(
    page: number,
    pageSize: number,
    search: string,
    categorieNr: number | '' | null | undefined,
    catsMap: Record<number, string>,
) {
    const dSearch = useDebounced(search, 250);

    const params = useMemo(
        () => ({ q: dSearch || undefined, categorieNr: toIntOrUndef(categorieNr) }),
        [dSearch, categorieNr],
    );

    const {
        data = [],
        loading,
        error: rawError,
        lastCount,
    } = useLivePagedList<Veilingproduct>({
        path: '/api/Veilingproduct',
        params,
        page,
        pageSize,
        paramsKey: `${params.q ?? ''}|${params.categorieNr ?? ''}`,
        refreshMs: 5_000,
        revalidateOnFocus: true,
    });

    const error = toErrorString(rawError, 'Kon producten niet laden');

    // Rijen zoals getoond in de producten-tabel
    const productRows = useMemo(
        () =>
            (Array.isArray(data) ? data : []).map(p => {
                let categorieName = isString(getProp(p, 'categorieNaam')) ? (getProp(p, 'categorieNaam') as string) : '';

                if (!categorieName && p.categorie && typeof p.categorie === 'object') {
                    const nm = getCategorieNaam(p.categorie as Categorie);
                    if (isString(nm) && nm) categorieName = nm;
                }
                if (!categorieName && p.categorieNr != null) {
                    const lookedUp = catsMap[p.categorieNr];
                    if (isString(lookedUp) && lookedUp) categorieName = lookedUp;
                }

                return {
                    veilingProductNr: p.veilingProductNr,
                    naam: isString(getProp(p, 'naam')) ? (getProp(p, 'naam') as string) : '',
                    geplaatst: fmtDate(
                        isString(getProp(p, 'geplaatstDatum')) ? (getProp(p, 'geplaatstDatum') as string) : undefined,
                    ),
                    fust: typeof getProp(p, 'fust') === 'number' ? (getProp(p, 'fust') as number) : 0,
                    voorraad: typeof getProp(p, 'voorraad') === 'number' ? (getProp(p, 'voorraad') as number) : 0,
                    startprijs: fmtEur(getProp(p, 'startprijs') as number | string | null | undefined),
                    categorie: categorieName ?? '',
                };
            }),
        [data, catsMap],
    );

    const hasNext = lastCount >= pageSize;
    return { rows: productRows, loading, error, hasNext };
}


/* Subcomponent: Biedingen-tab
 * Tabel met biedingen + zoek- en paginering.
*/

type BidsSectionProps = {
    hidden: boolean;
};

function BidsSection({ hidden }: BidsSectionProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [query, setQuery] = useState('');
    const { rows, loading, error, hasNext } = useBidRows(page, pageSize, query);

    const trimmedQuery = query.trim();

    return (
        <section
            id="panel-biedingen"
            role="tabpanel"
            aria-labelledby="tab-biedingen"
            hidden={hidden}
            className="card border-0 shadow-sm rounded-4 mb-4"
        >
            <div className="card-body">
                <div className="row g-2 align-items-end mb-2">
                    <div className="col-12 col-md-8">
                        <SearchInput
                            id="bid-search"
                            label="Zoek in biedingen"
                            value={query}
                            onChange={value => {
                                setQuery(value);
                                setPage(1);
                            }}
                            placeholder="zoek op gebruiker, veiling, bedrag, aantal, etc."
                        />
                    </div>
                    <div className="col-12 col-md-4">
                        <SelectSm
                            id="bid-page-size"
                            label="Per pagina"
                            value={pageSize}
                            onChange={n => {
                                setPageSize(n);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {!error && (loading ? <Loading /> : rows.length ? <DataTable rows={rows} /> : <Empty />)}

                <div className="d-flex flex-wrap gap-2 mt-3">
                    {trimmedQuery && <FilterChip onClear={() => setQuery('')}>Zoek: “{trimmedQuery}”</FilterChip>}
                </div>

                <Pager page={page} setPage={setPage} hasNext={hasNext} loading={loading} total={rows.length} />
            </div>
        </section>
    );
}


/* Subcomponent: Producten-tab
 * Tabel met veilingproducten, filters en modal met veilingen per product.
*/

type ProductsSectionProps = {
    hidden: boolean;
};

function ProductsSection({ hidden }: ProductsSectionProps) {
    const [search, setSearch] = useState('');
    const [categorieNr, setCategorieNr] = useState<number | '' | null | undefined>('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

    const { catsMap, loading: catsLoading, error: catsError } = useCategories();
    const { rows, loading, error, hasNext } = useProductRows(page, pageSize, search, categorieNr, catsMap);

    const trimmedSearch = search.trim();

    const handleRowClick = useCallback((row: RowBase & { veilingProductNr?: number }) => {
        if (row.veilingProductNr) setSelectedProductId(row.veilingProductNr);
    }, []);

    return (
        <section
            id="panel-producten"
            role="tabpanel"
            aria-labelledby="tab-producten"
            hidden={hidden}
            className="card border-0 shadow-sm rounded-4"
        >
            <div className="card-body">
                {/* Filters boven de tabel */}
                <div className="row g-2 align-items-end mb-2">
                    <div className="col-md-5">
                        <SearchInput
                            id="product-zoekterm"
                            label="Zoekterm"
                            value={search}
                            onChange={value => {
                                setSearch(value);
                                setPage(1);
                            }}
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
                            onChange={e => {
                                setCategorieNr(e.target.value === '' ? '' : Number(e.target.value));
                                setPage(1);
                            }}
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
                            value={pageSize}
                            onChange={n => {
                                setPageSize(n);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="col-md-2 text-md-end">
                        <label className="form-label mb-1 d-block">&nbsp;</label>
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setSearch('');
                                setCategorieNr('');
                                setPage(1);
                                setPageSize(25);
                            }}
                            disabled={loading}
                            aria-label="Reset"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Actieve filters als chips */}
                <div className="d-flex flex-wrap gap-2 mb-2">
                    {trimmedSearch && <FilterChip onClear={() => setSearch('')}>Zoek: “{trimmedSearch}”</FilterChip>}
                    {categorieNr !== '' && typeof categorieNr === 'number' && (
                        <FilterChip onClear={() => setCategorieNr('')}>
                            Categorie: {catsMap[categorieNr] ?? categorieNr}
                        </FilterChip>
                    )}
                </div>

                {/* Tabel met producten */}
                {error && <div className="alert alert-danger">{error}</div>}
                {!error &&
                    (loading ? (
                        <Loading />
                    ) : rows.length ? (
                        <DataTable rows={rows} onRowClick={handleRowClick} caption="Klik een rij voor details" />
                    ) : (
                        <Empty />
                    ))}

                <Pager page={page} setPage={setPage} hasNext={hasNext} loading={loading} total={rows.length} />
            </div>

            {selectedProductId != null && (
                <VeilingModal productId={selectedProductId} onClose={() => setSelectedProductId(null)} />
            )}
        </section>
    );
}


/* Hoofdcomponent: Veilingmeester
 * Pagina met twee tabbladen: Biedingen en Producten.
*/

export default function Veilingmeester() {
    const [tab, setTab] = useState<'biedingen' | 'producten'>('producten');

    return (
        <div className="container py-4">
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm bg-light">
                <h2 className="mb-1">Veilingmeester</h2>
                <p className="text-muted mb-0">Zoek, filter en bekijk biedingen en veilingproducten.</p>
            </section>

            <ul className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2" role="tablist" aria-label="Hoofdtabbladen">
                {(['biedingen', 'producten'] as const).map(t => (
                    <li key={t} className="nav-item" role="presentation">
                        <button
                            id={TAB_IDS[t].tab}
                            className={`nav-link ${tab === t ? 'active' : ''}`}
                            onClick={() => setTab(t)}
                            role="tab"
                            aria-selected={tab === t}
                            aria-controls={TAB_IDS[t].panel}
                        >
                            {t[0].toUpperCase() + t.slice(1)}
                        </button>
                    </li>
                ))}
            </ul>

            <BidsSection hidden={tab !== 'biedingen'} />
            <ProductsSection hidden={tab !== 'producten'} />
        </div>
    );
}