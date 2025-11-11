import { useCallback, useState } from 'react';
import SearchTableSection from './ui/SearchTableSection';
import { FilterChip } from './ui/components';
import VeilingModal from './ui/VeilingModal';
import { useSearchPagination } from './hooks/useSearchPagination';
import { useSearchableLiveRows } from './hooks/useSearchableLiveRows';
import { useLiveNameCache } from './hooks/useLiveNameCache';
import { DEFAULT_PAGE_SIZE, TAB_IDS } from './constants';
import { formatCurrency, formatDateTime } from './utils/format';
import type { BidRow, TabKey, VeilingRow } from './types';
import type { Bieding, Veiling } from './data/utils';

type SectionProps = {
    hidden: boolean;
};

function BidsSection({ hidden }: SectionProps) {
    const { page, setPage, pageSize, setPageSize, search, setSearch } =
        useSearchPagination(DEFAULT_PAGE_SIZE);

    const { gebruikersMap, veilingenMap, fetchGebruikers, fetchVeilingen } =
        useLiveNameCache();

    const handleSourceChange = useCallback(
        (rows: readonly Bieding[]) => {
            if (!rows.length) return;
            const gebruikerIds = new Set<number>();
            const veilingIds = new Set<number>();

            rows.forEach(row => {
                if (typeof row.gebruikerNr === 'number') {
                    gebruikerIds.add(row.gebruikerNr);
                }
                if (typeof row.veilingNr === 'number') {
                    veilingIds.add(row.veilingNr);
                }
            });

            if (gebruikerIds.size) fetchGebruikers([...gebruikerIds]);
            if (veilingIds.size) fetchVeilingen([...veilingIds]);
        },
        [fetchGebruikers, fetchVeilingen],
    );

    const mapRow = useCallback(
        (row: Bieding, index: number): BidRow => {
            const gebruikerNr = row.gebruikerNr;
            const veilingNr = row.veilingNr;

            return {
                id: row.biedNr ?? index,
                biedNr: row.biedNr ?? '',
                gebruiker:
                    gebruikerNr != null
                        ? gebruikersMap[gebruikerNr] ?? gebruikerNr
                        : '',
                veiling:
                    veilingNr != null
                        ? veilingenMap[veilingNr] ?? veilingNr
                        : '',
                bedragPerFust: row.bedragPerFust ?? '',
                aantalStuks: row.aantalStuks ?? '',
            };
        },
        [gebruikersMap, veilingenMap],
    );

    const { rows, loading, error, hasNext } = useSearchableLiveRows<
        Bieding,
        BidRow
    >({
        page,
        pageSize,
        query: search,
        fetch: {
            path: '/api/Bieding',
            paramsKey: 'bids|all',
            refreshMs: 1_000,
            revalidateOnFocus: true,
        },
        mapRow,
        errorMessage: 'Kon biedingen niet laden',
        onSourceChange: handleSourceChange,
    });

    const trimmedQuery = search.trim();

    return (
        <SearchTableSection<BidRow>
            panelId={TAB_IDS.biedingen.panel}
            tabId={TAB_IDS.biedingen.tab}
            hidden={hidden}
            className="mb-4"
            search={{
                id: 'bid-search',
                label: 'Zoek in biedingen',
                value: search,
                onChange: setSearch,
                placeholder: 'zoek op gebruiker, veiling, bedrag, aantal, etc.',
            }}
            pageSize={{
                id: 'bid-page-size',
                label: 'Per pagina',
                value: pageSize,
                onChange: setPageSize,
            }}
            rows={rows}
            loading={loading}
            error={error}
            pagination={{
                page,
                setPage,
                hasNext,
                loading,
                total: rows.length,
            }}
            filterChips={
                trimmedQuery ? (
                    <FilterChip onClear={() => setSearch('')}>
                        Zoek: “{trimmedQuery}”
                    </FilterChip>
                ) : undefined
            }
        />
    );
}

function VeilingenSection({ hidden }: SectionProps) {
    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        search,
        setSearch,
        reset,
    } = useSearchPagination(DEFAULT_PAGE_SIZE);
    const [selectedVeilingId, setSelectedVeilingId] = useState<number | null>(
        null,
    );

    const mapRow = useCallback(
        (row: Veiling, index: number): VeilingRow => ({
            id: row.veilingNr ?? index,
            veilingNr: row.veilingNr,
            begintijd: formatDateTime(row.begintijd),
            eindtijd: formatDateTime(row.eindtijd),
            status: row.status ?? undefined,
            minimumprijs: formatCurrency(row.minimumprijs),
            aantalProducten: Array.isArray(row.producten)
                ? row.producten.length
                : 0,
        }),
        [],
    );

    const { rows, loading, error, hasNext } = useSearchableLiveRows<
        Veiling,
        VeilingRow
    >({
        page,
        pageSize,
        query: search,
        fetch: {
            path: '/api/Veiling',
            paramsKey: 'auctions|all',
            refreshMs: 5_000,
            revalidateOnFocus: true,
        },
        mapRow,
        errorMessage: 'Kon veilingen niet laden',
    });

    const trimmedSearch = search.trim();

    const handleRowClick = useCallback(
        (row: VeilingRow) => {
            if (row.veilingNr != null) {
                setSelectedVeilingId(row.veilingNr);
            }
        },
        [setSelectedVeilingId],
    );

    return (
        <SearchTableSection<VeilingRow>
            panelId={TAB_IDS.veilingen.panel}
            tabId={TAB_IDS.veilingen.tab}
            hidden={hidden}
            search={{
                id: 'veiling-search',
                label: 'Zoek in veilingen',
                value: search,
                onChange: setSearch,
                placeholder: 'bijv. status, nummer, bedrag…',
                columnClassName: 'col-12 col-md-6',
            }}
            pageSize={{
                id: 'veiling-page-size',
                label: 'Per pagina',
                value: pageSize,
                onChange: setPageSize,
                columnClassName: 'col-12 col-md-3',
            }}
            extraFilterColumns={
                <div className="col-12 col-md-3 text-md-end">
                    <label className="form-label mb-1 d-block">&nbsp;</label>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                            reset();
                        }}
                        disabled={loading}
                        aria-label="Reset"
                    >
                        Reset
                    </button>
                </div>
            }
            rows={rows}
            loading={loading}
            error={error}
            pagination={{
                page,
                setPage,
                hasNext,
                loading,
                total: rows.length,
            }}
            filterChips={
                trimmedSearch ? (
                    <FilterChip onClear={() => setSearch('')}>
                        Zoek: “{trimmedSearch}”
                    </FilterChip>
                ) : undefined
            }
            tableProps={{
                onRowClick: handleRowClick,
                caption: 'Klik een veiling voor producten',
            }}
        >
            {selectedVeilingId != null && (
                <VeilingModal
                    veilingId={selectedVeilingId}
                    onClose={() => setSelectedVeilingId(null)}
                />
            )}
        </SearchTableSection>
    );
}

export default function Veilingmeester() {
    const [tab, setTab] = useState<TabKey>('veilingen');

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
                {(['biedingen', 'veilingen'] as const).map(key => (
                    <li key={key} className="nav-item" role="presentation">
                        <button
                            id={TAB_IDS[key].tab}
                            className={`nav-link ${tab === key ? 'active' : ''}`}
                            onClick={() => setTab(key)}
                            role="tab"
                            aria-selected={tab === key}
                            aria-controls={TAB_IDS[key].panel}
                        >
                            {key[0].toUpperCase() + key.slice(1)}
                        </button>
                    </li>
                ))}
            </ul>

            <BidsSection hidden={tab !== 'biedingen'} />
            <VeilingenSection hidden={tab !== 'veilingen'} />
        </div>
    );
}
