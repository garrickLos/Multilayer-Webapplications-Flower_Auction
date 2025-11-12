import { useCallback, useState, type FC } from 'react';
import { TAB_IDS } from './config';
import {
    FilterChip,
    SearchTableSection,
    VeilingModal,
    SelectStatusSm,
    UserBidsModal,
    type Column,
} from './ui/ui.ts';
import { useUserRows, useVeilingRows } from './hooks';
import type { TabKey, VeilingRow, UserRow } from './types/types.ts';

type SectionProps = {
    hidden: boolean;
};

type SectionConfig = {
    key: TabKey;
    label: string;
    Component: FC<SectionProps>;
};

const USER_COLUMNS: ReadonlyArray<Column<UserRow>> = [
    { key: 'gebruikerNr', header: '#', width: 80, className: 'text-nowrap', sortable: true },
    { key: 'naam', header: 'Naam', sortable: true },
    { key: 'email', header: 'E-mail', className: 'text-nowrap', sortable: true },
    { key: 'status', header: 'Status', className: 'text-nowrap', sortable: true },
    { key: 'rol', header: 'Rol(len)', sortable: true },
];

const STATUS_LABELS: Record<'alle' | 'actief' | 'inactief', string> = {
    alle: 'Alle',
    actief: 'Actief',
    inactief: 'Inactief',
};

const UsersSection: FC<SectionProps> = ({ hidden }) => {
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
    } = useUserRows();

    const [selectedUserId, setSelectedUserId] = useState<number | string | null>(null);

    const trimmedQuery = search.trim();

    const handleRowClick = useCallback(
        (row: UserRow) => {
            const identifier = row.gebruikerNr !== '' ? row.gebruikerNr : row.id;
            if (identifier !== '' && identifier !== null && identifier !== undefined) {
                setSelectedUserId(identifier);
            }
        },
        [],
    );

    const closeModal = useCallback(() => setSelectedUserId(null), []);

    return (
        <SearchTableSection<UserRow>
            panelId={TAB_IDS.users.panel}
            tabId={TAB_IDS.users.tab}
            hidden={hidden}
            className="mb-4"
            search={{
                id: 'user-search',
                label: 'Zoek in users',
                value: search,
                onChange: setSearch,
                placeholder: 'bijv. naam, e-mail, rol…',
                columnClassName: 'col-12 col-md-6',
            }}
            pageSize={{
                id: 'user-page-size',
                label: 'Per pagina',
                value: pageSize,
                onChange: setPageSize,
                columnClassName: 'col-12 col-md-3',
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
            tableProps={{
                onRowClick: handleRowClick,
                getRowKey: row => row.id,
                caption: 'Klik een gebruiker voor biedingen',
                columns: USER_COLUMNS,
            }}
        >
            {selectedUserId != null && (
                <UserBidsModal userId={selectedUserId} onClose={closeModal} />
            )}
        </SearchTableSection>
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
        status,
        setStatus,
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

    const filterChips =
        trimmedSearch || status !== 'alle' ? (
            <>
                {trimmedSearch && (
                    <FilterChip onClear={() => setSearch('')} title="Zoekfilter">
                        Zoek: “{trimmedSearch}”
                    </FilterChip>
                )}
                {status !== 'alle' && (
                    <FilterChip onClear={() => setStatus('alle')} title="Statusfilter">
                        Status: {STATUS_LABELS[status]}
                    </FilterChip>
                )}
            </>
        ) : undefined;

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
                <>
                    <SelectStatusSm
                        id="veiling-status"
                        value={status}
                        onChange={setStatus}
                        className="col-12 col-md-3"
                    />
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
                </>
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
            filterChips={filterChips}
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
    { key: 'users', label: 'Users', Component: UsersSection },
    { key: 'veilingen', label: 'Veilingen', Component: VeilingenSection },
];

export default function Veilingmeester() {
    const [tab, setTab] = useState<TabKey>('veilingen');

    return (
        <div className="container py-4">
            <section className="mb-4 rounded-4 p-4 p-md-5 shadow-sm bg-light">
                <h2 className="mb-1">Veilingmeester</h2>
                <p className="text-muted mb-0">Zoek, filter en bekijk gebruikers en veilingen.</p>
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
