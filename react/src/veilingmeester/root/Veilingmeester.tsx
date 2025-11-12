import { memo, useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { SearchTableSection } from "../SearchTableSection";
import { Empty, FilterChip, SelectStatusSm } from "../components";
import { useUserRows, useVeilingRows } from "../hooks";
import type { Column } from "../DataTable";
import type { UserRow, VeilingRow } from "../types";
import { UserBidsModal } from "../UserBidsModal";
import { VeilingModal } from "../VeilingModal";

const USER_COLUMNS: ReadonlyArray<Column<UserRow>> = [
    { key: "gebruikerNr", header: "#", sortable: true, className: "text-nowrap" },
    { key: "naam", header: "Naam", sortable: true },
    { key: "email", header: "E-mail", sortable: true, className: "text-nowrap" },
    { key: "kvk", header: "KVK", sortable: true, className: "text-nowrap" },
    {
        key: "soort",
        header: "Soort",
        sortable: true,
        className: "text-nowrap",
        render: (row) => <span className="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle">{row.soortLabel}</span>,
    },
    {
        key: "status",
        header: "Status",
        sortable: true,
        className: "text-nowrap",
        render: (row) => <span className={`badge ${row.statusVariant}`}>{row.statusLabel}</span>,
    },
];

const VEILING_COLUMNS: ReadonlyArray<Column<VeilingRow>> = [
    { key: "veilingNr", header: "#", sortable: true, className: "text-nowrap" },
    { key: "titel", header: "Titel", sortable: true },
    {
        key: "startLabel",
        header: "Start",
        sortable: true,
        className: "text-nowrap",
        render: (row) => row.startLabel,
    },
    {
        key: "endLabel",
        header: "Eind",
        sortable: true,
        className: "text-nowrap",
        render: (row) => row.endLabel,
    },
    {
        key: "statusLabel",
        header: "Status",
        sortable: true,
        className: "text-nowrap",
        render: (row) => <span className={`badge ${row.statusVariant}`}>{row.statusLabel}</span>,
    },
    {
        key: "productCount",
        header: "Producten",
        sortable: true,
        className: "text-nowrap",
    },
];

type TabKey = "users" | "veilingen";

type TabConfig = {
    key: TabKey;
    label: string;
    panelId: string;
    render: (hidden: boolean) => ReactElement;
};

const UsersSection = memo(function UsersSection({ hidden }: { hidden: boolean }): ReactElement {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, search, setSearch } = useUserRows();
    const [selectedUser, setSelectedUser] = useState<number | string | null>(null);

    useEffect(() => {
        if (hidden) {
            setSelectedUser(null);
        }
    }, [hidden]);

    const handleRowClick = useCallback((row: UserRow) => {
        if (row.gebruikerNr != null) {
            setSelectedUser(row.gebruikerNr);
        }
    }, []);

    const filterChip = useMemo(() => {
        const trimmed = search.trim();
        if (!trimmed) return null;
        return (
            <FilterChip title="Zoekfilter" onClear={() => setSearch("")}>
                Zoek: “{trimmed}”
            </FilterChip>
        );
    }, [search, setSearch]);

    return (
        <>
            <SearchTableSection<UserRow>
                panelId="veilingmeester-users"
                tabId="tab-users"
                hidden={hidden}
                rows={rows}
                columns={USER_COLUMNS}
                tableCaption="Klik een gebruiker voor biedingen"
                tableEmpty={<Empty title="Geen gebruikers gevonden" />}
                loading={loading}
                error={error}
                search={{
                    id: "user-search",
                    label: "Zoek in gebruikers",
                    value: search,
                    onChange: setSearch,
                    placeholder: "Zoek op naam of e-mail",
                }}
                pageSize={{
                    id: "user-page-size",
                    label: "Per pagina",
                    value: pageSize,
                    onChange: setPageSize,
                }}
                filterChips={filterChip ?? undefined}
                onRowClick={handleRowClick}
                getRowKey={(row) => row.id}
                pagination={{ page, setPage, hasNext, loading, total: totalResults }}
            />
            {selectedUser != null && (
                <UserBidsModal userId={selectedUser} onClose={() => setSelectedUser(null)} />
            )}
        </>
    );
});

const VeilingenSection = memo(function VeilingenSection({ hidden }: { hidden: boolean }): ReactElement {
    const {
        rows,
        loading,
        error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext,
        totalResults,
        status,
        setStatus,
        from,
        setFrom,
        to,
        setTo,
    } = useVeilingRows();
    const [selectedVeiling, setSelectedVeiling] = useState<number | null>(null);

    const handleRowClick = useCallback((row: VeilingRow) => {
        if (row.veilingNr != null) setSelectedVeiling(row.veilingNr);
    }, []);

    useEffect(() => {
        if (hidden) {
            setSelectedVeiling(null);
        }
    }, [hidden]);

    const statusChip = useMemo(() => {
        if (status === "alle") return null;
        return (
            <FilterChip title="Statusfilter" onClear={() => setStatus("alle")}>
                Status: {status === "actief" ? "Actief" : "Inactief"}
            </FilterChip>
        );
    }, [setStatus, status]);

    const fromError = useMemo(() => {
        if (!from || !to) return false;
        const start = new Date(from);
        const end = new Date(to);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        return end < start;
    }, [from, to]);

    const handleDateChange = useCallback(
        (setter: (value?: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value || undefined;
            setter(value);
            setPage(1);
        },
        [setPage],
    );

    return (
        <>
            <SearchTableSection<VeilingRow>
                panelId="veilingmeester-veiling"
                tabId="tab-veilingen"
                hidden={hidden}
                rows={rows}
                columns={VEILING_COLUMNS}
                tableCaption="Klik een veiling voor details"
                tableEmpty={<Empty title="Geen veilingen gevonden" />}
                loading={loading}
                error={error}
                pageSize={{
                    id: "veiling-page-size",
                    label: "Per pagina",
                    value: pageSize,
                    onChange: setPageSize,
                }}
                extraFilterColumns={
                    <>
                        <SelectStatusSm
                            id="veiling-status"
                            value={status}
                            onChange={setStatus}
                            className="col-12 col-md-3"
                        />
                        <div className="col-12 col-md-3">
                            <label htmlFor="veiling-from" className="form-label">Vanaf</label>
                            <input
                                id="veiling-from"
                                type="date"
                                className="form-control form-control-sm"
                                value={from ?? ""}
                                onChange={handleDateChange(setFrom)}
                                aria-invalid={fromError}
                                aria-describedby={fromError ? "veiling-date-error" : undefined}
                            />
                        </div>
                        <div className="col-12 col-md-3">
                            <label htmlFor="veiling-to" className="form-label">Tot en met</label>
                            <input
                                id="veiling-to"
                                type="date"
                                className="form-control form-control-sm"
                                value={to ?? ""}
                                onChange={handleDateChange(setTo)}
                                aria-invalid={fromError}
                                aria-describedby={fromError ? "veiling-date-error" : undefined}
                            />
                        </div>
                    </>
                }
                filterChips={statusChip ?? undefined}
                getRowKey={(row) => row.id}
                onRowClick={handleRowClick}
                pagination={{ page, setPage, hasNext, loading, total: totalResults }}
            />
            {!hidden && fromError && (
                <div className="alert alert-warning mt-3" role="alert" id="veiling-date-error">
                    Kies een einddatum die gelijk is aan of na de begindatum.
                </div>
            )}
            {selectedVeiling != null && (
                <VeilingModal veilingNr={selectedVeiling} onClose={() => setSelectedVeiling(null)} />
            )}
        </>
    );
});

const TABS: TabConfig[] = [
    { key: "users", label: "Gebruikers", panelId: "veilingmeester-users", render: (hidden) => <UsersSection hidden={hidden} /> },
    { key: "veilingen", label: "Veilingen", panelId: "veilingmeester-veiling", render: (hidden) => <VeilingenSection hidden={hidden} /> },
];

export default function Veilingmeester(): ReactElement {
    const [activeTab, setActiveTab] = useState<TabKey>("users");

    return (
        <div className="container py-4">
            <header className="mb-4">
                <h1 className="h3 mb-1">Veilingmeester</h1>
                <p className="text-muted mb-0">Beheer gebruikers, biedingen en veilingen.</p>
            </header>
            <div role="tablist" aria-label="Veilingmeester navigatie" className="nav nav-tabs mb-4">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        id={`tab-${tab.key}`}
                        role="tab"
                        type="button"
                        className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                        aria-selected={activeTab === tab.key}
                        aria-controls={tab.panelId}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {TABS.map((tab) => tab.render(activeTab !== tab.key))}
        </div>
    );
}
