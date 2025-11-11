import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable, { type RowBase } from './ui/DataTable';
import VeilingModal from './ui/VeilingModal';
import {
    SearchInput,
    SelectSm,
    Loading,
    Pager,
    Empty,
    FilterChip,
} from './ui/components';
import { type Bieding, type Veiling, rowToSearchString } from './data/utils';
import { useDebounced, useLivePagedList } from './data/live';
import { useLiveNameCache } from './data/liveNameCache';

/* Helpers: datum / valuta / search */

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'short',
    timeStyle: 'short',
});

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
});

const fmtDate = (d?: string | null) => {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return dateFormatter.format(date);
};

const fmtEur = (n?: number | string | null) => {
    if (n == null || n === '') return '';
    const raw =
        typeof n === 'string'
            // haal duizendtallen weg en vervang komma door punt
            ? n.replace(/\./g, '').replace(',', '.')
            : n;
    const value = Number(raw);
    return Number.isFinite(value) ? currencyFormatter.format(value) : '';
};

const splitTokens = (q: string) =>
    q
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

const toErrorString = (rawError: unknown, fallback: string): string | null => {
    if (!rawError) return null;
    if (typeof rawError === 'string') return rawError;
    if (rawError instanceof Error) return rawError.message;
    return fallback;
};

const TAB_IDS = {
    biedingen: { tab: 'tab-biedingen', panel: 'panel-biedingen' },
    veilingen: { tab: 'tab-veilingen', panel: 'panel-veilingen' },
} as const;

/* Types voor tabel-rijen
   Laat ze RowBase extenden zodat DataTable type-safe is. */

type BidRow = RowBase & {
    biedNr: number | string;
    gebruiker: string | number;
    veiling: string | number;
    bedragPerFust: number | string;
    aantalStuks: number | string;
};

type VeilingRow = RowBase & {
    veilingNr: number | undefined;
    begintijd: string;
    eindtijd: string;
    status: string | undefined;
    minimumprijs: string;
    aantalProducten: number;
};

/* Custom hooks
 * Ophalen en voorbereiden van data voor de UI.
*/

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
        paramsKey: 'bids|all',
        refreshMs: 1_000,
        revalidateOnFocus: true,
    });

    const error = toErrorString(rawError, 'Kon biedingen niet laden');

    const {
        gebruikersMap,
        veilingenMap,
        fetchGebruikers,
        fetchVeilingen,
    } = useLiveNameCache();

    const rowsAsObjects = useMemo(
        () =>
            Array.isArray(data)
                ? (data as readonly Bieding[])
                : ([] as readonly Bieding[]),
        [data],
    );

    // Voor alle rijen bijbehorende gebruikers/veilingen ophalen
    useEffect(() => {
        if (!rowsAsObjects.length) return;

        const gIds = [
            ...new Set(
                rowsAsObjects
                    .map(r => r.gebruikerNr)
                    .filter((n): n is number => typeof n === 'number'),
            ),
        ];

        const vIds = [
            ...new Set(
                rowsAsObjects
                    .map(r => r.veilingNr)
                    .filter((n): n is number => typeof n === 'number'),
            ),
        ];

        if (gIds.length) fetchGebruikers(gIds);
        if (vIds.length) fetchVeilingen(vIds);
    }, [rowsAsObjects, fetchGebruikers, fetchVeilingen]);

    // Rijen zoals getoond in de tabel
    const bidRows: BidRow[] = useMemo(
        () =>
            rowsAsObjects.map((r, index): BidRow => {
                const g = r.gebruikerNr;
                const v = r.veilingNr;
                return {
                    // RowBase key/id fallback
                    id: r.biedNr ?? index,
                    biedNr: r.biedNr ?? '',
                    gebruiker: g != null ? gebruikersMap[g] ?? g : '',
                    veiling: v != null ? veilingenMap[v] ?? v : '',
                    bedragPerFust: r.bedragPerFust ?? '',
                    aantalStuks: r.aantalStuks ?? '',
                };
            }),
        [rowsAsObjects, gebruikersMap, veilingenMap],
    );

    // Client-side filtering op zoekterm
    const filteredRows = useMemo(() => {
        const tokens = splitTokens(dQuery);
        if (!tokens.length) return bidRows;
        return bidRows.filter(row => {
            const s = rowToSearchString(
                row as unknown as Record<string, unknown>,
            ).toLowerCase();
            return tokens.every(t => s.includes(t));
        });
    }, [bidRows, dQuery]);

    const hasNext = (lastCount ?? 0) >= pageSize;
    return { rows: filteredRows, loading, error, hasNext };
}

// Haalt veilingen op, filtert client-side op zoekterm
function useVeilingRows(page: number, pageSize: number, query: string) {
    const dQuery = useDebounced(query, 250);

    const {
        data = [],
        loading,
        error: rawError,
        lastCount,
    } = useLivePagedList<Veiling>({
        path: '/api/Veiling',
        params: {},
        page,
        pageSize,
        paramsKey: 'auctions|all',
        refreshMs: 5_000,
        revalidateOnFocus: true,
    });

    const error = toErrorString(rawError, 'Kon veilingen niet laden');

    const rows: VeilingRow[] = useMemo(
        () =>
            (Array.isArray(data) ? data : []).map((v, index): VeilingRow => ({
                // RowBase key/id fallback
                id: v.veilingNr ?? index,
                veilingNr: v.veilingNr,
                begintijd: fmtDate(v.begintijd),
                eindtijd: fmtDate(v.eindtijd),
                status: v.status,
                minimumprijs: fmtEur(v.minimumprijs),
                aantalProducten: Array.isArray(v.producten)
                    ? v.producten.length
                    : 0,
            })),
        [data],
    );

    const filteredRows = useMemo(() => {
        const tokens = splitTokens(dQuery);
        if (!tokens.length) return rows;
        return rows.filter(row => {
            const s = rowToSearchString(
                row as unknown as Record<string, unknown>,
            ).toLowerCase();
            return tokens.every(t => s.includes(t));
        });
    }, [rows, dQuery]);

    const hasNext = (lastCount ?? 0) >= pageSize;
    return { rows: filteredRows, loading, error, hasNext };
}

/* Subcomponent: Biedingen-tab */

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
                            onChange={(n: number) => {
                                setPageSize(n);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {!error &&
                    (loading ? (
                        <Loading />
                    ) : rows.length ? (
                        <DataTable<BidRow> rows={rows} />
                    ) : (
                        <Empty />
                    ))}

                <div className="d-flex flex-wrap gap-2 mt-3">
                    {trimmedQuery && (
                        <FilterChip onClear={() => setQuery('')}>
                            Zoek: “{trimmedQuery}”
                        </FilterChip>
                    )}
                </div>

                <Pager
                    page={page}
                    setPage={setPage}
                    hasNext={hasNext}
                    loading={loading}
                    total={rows.length}
                />
            </div>
        </section>
    );
}

/* Subcomponent: Veilingen-tab */

type VeilingenSectionProps = {
    hidden: boolean;
};

function VeilingenSection({ hidden }: VeilingenSectionProps) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [selectedVeilingId, setSelectedVeilingId] = useState<number | null>(
        null,
    );

    const { rows, loading, error, hasNext } = useVeilingRows(
        page,
        pageSize,
        search,
    );

    const trimmedSearch = search.trim();

    const handleRowClick = useCallback(
        (row: VeilingRow & RowBase) => {
            if (row.veilingNr != null) {
                setSelectedVeilingId(row.veilingNr);
            }
        },
        [setSelectedVeilingId],
    );

    return (
        <section
            id="panel-veilingen"
            role="tabpanel"
            aria-labelledby="tab-veilingen"
            hidden={hidden}
            className="card border-0 shadow-sm rounded-4"
        >
            <div className="card-body">
                {/* Filters boven de tabel */}
                <div className="row g-2 align-items-end mb-2">
                    <div className="col-md-6">
                        <SearchInput
                            id="veiling-zoekterm"
                            label="Zoek in veilingen"
                            value={search}
                            onChange={value => {
                                setSearch(value);
                                setPage(1);
                            }}
                            placeholder="bijv. status, nummer, bedrag…"
                        />
                    </div>
                    <div className="col-md-3">
                        <SelectSm
                            id="veiling-page-size"
                            label="Per pagina"
                            value={pageSize}
                            onChange={(n: number) => {
                                setPageSize(n);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="col-md-3 text-md-end">
                        <label className="form-label mb-1 d-block">&nbsp;</label>
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setSearch('');
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
                    {trimmedSearch && (
                        <FilterChip onClear={() => setSearch('')}>
                            Zoek: “{trimmedSearch}”
                        </FilterChip>
                    )}
                </div>

                {/* Tabel met veilingen */}
                {error && <div className="alert alert-danger">{error}</div>}

                {!error &&
                    (loading ? (
                        <Loading />
                    ) : rows.length ? (
                        <DataTable<VeilingRow>
                            rows={rows}
                            onRowClick={handleRowClick}
                            caption="Klik een veiling voor producten"
                        />
                    ) : (
                        <Empty />
                    ))}

                <Pager
                    page={page}
                    setPage={setPage}
                    hasNext={hasNext}
                    loading={loading}
                    total={rows.length}
                />
            </div>

            {selectedVeilingId != null && (
                <VeilingModal
                    veilingId={selectedVeilingId}
                    onClose={() => setSelectedVeilingId(null)}
                />
            )}
        </section>
    );
}

/* Hoofdcomponent: Veilingmeester */

export default function Veilingmeester() {
    const [tab, setTab] = useState<'biedingen' | 'veilingen'>('veilingen');

    return (
        <div className="container py-4">
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm bg-light">
                <h2 className="mb-1">Veilingmeester</h2>
                <p className="text-muted mb-0">
                    Zoek, filter en bekijk biedingen en veilingen.
                </p>
            </section>

            <ul
                className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2"
                role="tablist"
                aria-label="Hoofdtabbladen"
            >
                {(['biedingen', 'veilingen'] as const).map(t => (
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
            <VeilingenSection hidden={tab !== 'veilingen'} />
        </div>
    );
}
