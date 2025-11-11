import { useCallback, useState, type FC } from 'react';
import { TAB_IDS } from './config';
import { FilterChip, SearchTableSection, VeilingModal } from './ui/ui.ts';
import { useBidRows, useVeilingRows } from './hooks';
import type { BidRow, TabKey, VeilingRow } from './types/types.ts';

type SectionProps = {
    hidden: boolean;
};

type SectionConfig = {
    key: TabKey;
    label: string;
    Component: FC<SectionProps>;
};

const BidsSection: FC<SectionProps> = ({ hidden }) => {
    const {
        rows,
        loading,
        error,
        hasNext,
        page,
        setPage,
        pageSize,
        setPageSize,
        search,
        setSearch,
    } = useBidRows();

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
                    <FilterChip onClear={() => setSearch('')} title="Zoekfilter">
                        Zoek: “{trimmedQuery}”
                    </FilterChip>
                ) : undefined
            }
        />
    );
};

const VeilingenSection: FC<SectionProps> = ({ hidden }) => {
    const {
        rows,
        loading,
        error,
        hasNext,
        page,
        setPage,
        pageSize,
        setPageSize,
        search,
        setSearch,
        reset,
    } = useVeilingRows();

    const [selectedVeilingId, setSelectedVeilingId] = useState<number | null>(null);
    const trimmedSearch = search.trim();

    const handleRowClick = useCallback(
        (row: VeilingRow) => {
            if (row.veilingNr != null) {
                setSelectedVeilingId(row.veilingNr);
            }
        },
        [],
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
                        onClick={() => reset()}
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
                    <FilterChip onClear={() => setSearch('')} title="Zoekfilter">
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
};

const SECTIONS: SectionConfig[] = [
    { key: 'biedingen', label: 'Biedingen', Component: BidsSection },
    { key: 'veilingen', label: 'Veilingen', Component: VeilingenSection },
];

export default function Veilingmeester() {
    const [tab, setTab] = useState<TabKey>('veilingen');

    return (
        <div className="container py-4">
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm bg-light">
                <h2 className="mb-1">Veilingmeester</h2>
                <p className="text-muted mb-0">Zoek, filter en bekijk biedingen en veilingen.</p>
            </section>

            <ul className="nav nav-pills mb-3 rounded-3 bg-light p-2 gap-2" role="tablist" aria-label="Hoofdtabbladen">
                {SECTIONS.map(({ key, label }) => (
                    <li key={key} className="nav-item" role="presentation">
                        <button
                            id={TAB_IDS[key].tab}
                            className={`nav-link ${tab === key ? 'active' : ''}`}
                            onClick={() => setTab(key)}
                            role="tab"
                            aria-selected={tab === key}
                            aria-controls={TAB_IDS[key].panel}
                        >
                            {label}
                        </button>
                    </li>
                ))}
            </ul>

            {SECTIONS.map(({ key, Component }) => (
                <Component key={key} hidden={tab !== key} />
            ))}
        </div>
    );
}
