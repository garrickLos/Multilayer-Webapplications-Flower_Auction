import type { JSX } from "react";
import { DataTable, EmptyState, FilterChip, InlineAlert, LoadingPlaceholder, Pager, SearchField, SmallSelectField, StatusBadge } from "../components/ui.tsx";
import { appConfig } from "../config";
import { Modal } from "../Modal";
import { useUserBids, useUsers } from "../hooks";
import type { UserRow } from "../types";
import { cx, formatCurrency, formatDateTime } from "../utils";

export type UsersTabProps = {
    readonly onSelectBidUser: (user: UserRow) => void;
    readonly onSelectGrower: (user: UserRow) => void;
};

const soortClass: Record<UserRow["soort"], string> = {
    koper: "text-bg-primary",
    kweker: "text-bg-success",
    veilingmeester: "text-bg-secondary",
    onbekend: "text-bg-secondary",
};

export function UsersTab({ onSelectBidUser, onSelectGrower }: UsersTabProps): JSX.Element {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, search, setSearch } = useUsers();
    const perPage = appConfig.pagination.table.map((size) => ({ value: size, label: String(size) }));

    const columns = [
        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
        {
            key: "naam",
            header: "Naam",
            sortable: true,
            render: (row: UserRow) => (
                <div className="d-flex flex-column">
                    <span className="fw-semibold text-break">{row.naam}</span>
                    <span className="text-muted small">#{row.id}</span>
                </div>
            ),
            getValue: (row: UserRow) => row.naam,
        },
        {
            key: "email",
            header: "E-mail",
            sortable: true,
            render: (row: UserRow) => (row.email ? <span className="text-break">{row.email}</span> : <span className="text-muted">—</span>),
            getValue: (row: UserRow) => row.email ?? "",
        },
        {
            key: "kvk",
            header: "KVK",
            sortable: true,
            render: (row: UserRow) => <span className="font-monospace">{row.kvk ?? "—"}</span>,
            getValue: (row: UserRow) => row.kvk ?? "",
        },
        {
            key: "soort",
            header: "Soort",
            sortable: true,
            render: (row: UserRow) => <span className={cx("badge", "rounded-pill", soortClass[row.soort])}>{row.soort}</span>,
            getValue: (row: UserRow) => row.soort,
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row: UserRow) => <StatusBadge status={row.status} />,
            getValue: (row: UserRow) => row.status,
        },
    ];

    const handleRowClick = (row: UserRow) => {
        if (row.soort === "koper") onSelectBidUser(row);
        if (row.soort === "kweker") onSelectGrower(row);
    };

    return (
        <section className="d-flex flex-column gap-3" aria-label="Gebruikersbeheer">
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-6 col-lg-4">
                            <SearchField label="Zoeken" value={search} onChange={setSearch} placeholder="Naam of e-mail" />
                        </div>
                        <div className="col-6 col-md-3 col-lg-2">
                            <SmallSelectField<number>
                                label="Per pagina"
                                value={pageSize}
                                onChange={setPageSize}
                                options={perPage}
                                parse={(raw) => Number(raw)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {search && <FilterChip label={`Zoek: ${search}`} onRemove={() => setSearch("")} />}

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : rows.length === 0 ? (
                <EmptyState message="Geen gebruikers gevonden." />
            ) : (
                <DataTable
                    columns={columns}
                    rows={rows}
                    totalResults={totalResults}
                    empty={<EmptyState message="Geen gebruikers gevonden." />}
                    getRowKey={(row) => String(row.id)}
                    onRowClick={handleRowClick}
                    isRowInteractive={(row) => row.soort === "koper" || row.soort === "kweker"}
                />
            )}

            <Pager
                page={page}
                pageSize={pageSize}
                hasNext={hasNext}
                onPrevious={() => setPage(Math.max(1, page - 1))}
                onNext={() => setPage(page + 1)}
                totalResults={totalResults}
            />
        </section>
    );
}

export type BidsModalProps = { readonly user: UserRow; readonly onClose: () => void };

export function BidsModal({ user, onClose }: BidsModalProps): JSX.Element {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, from, setFrom, to, setTo } = useUserBids(user.id);
    const perPage = appConfig.pagination.modal.map((size) => ({ value: size, label: String(size) }));

    const columns = [
        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
        {
            key: "bedragPerFust",
            header: "Bedrag per fust",
            sortable: true,
            render: (row: { bedragPerFust: number }) => formatCurrency(row.bedragPerFust),
            getValue: (row: { bedragPerFust: number }) => row.bedragPerFust,
        },
        {
            key: "aantalStuks",
            header: "Stuks",
            sortable: true,
            render: (row: { aantalStuks: number }) => row.aantalStuks,
            getValue: (row: { aantalStuks: number }) => row.aantalStuks,
        },
        {
            key: "datumIso",
            header: "Datum",
            sortable: true,
            render: (row: { datumIso?: string }) => formatDateTime(row.datumIso),
            getValue: (row: { datumIso?: string }) => row.datumIso ?? "",
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row: { status: UserRow["status"] }) => <StatusBadge status={row.status} />,
            getValue: (row: { status: UserRow["status"] }) => row.status,
        },
    ];

    return (
        <Modal
            title={
                <div>
                    <div className="fw-semibold">Biedingen koper {user.naam}</div>
                    <div className="text-muted small">#{user.id}</div>
                </div>
            }
            onClose={onClose}
            size="xl"
            footer={
                <button type="button" className="btn btn-success" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <div className="row g-3 align-items-end mb-3">
                <div className="col-6 col-lg-3">
                    <SmallSelectField<number>
                        label="Per pagina"
                        value={pageSize}
                        onChange={setPageSize}
                        options={perPage}
                        parse={(raw) => Number(raw)}
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <label htmlFor="bids-from" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Vanaf
                    </label>
                    <input
                        id="bids-from"
                        type="date"
                        className="form-control form-control-sm border-success-subtle"
                        value={from}
                        onChange={(event) => setFrom(event.target.value)}
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <label htmlFor="bids-to" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Tot en met
                    </label>
                    <input
                        id="bids-to"
                        type="date"
                        className="form-control form-control-sm border-success-subtle"
                        value={to}
                        onChange={(event) => setTo(event.target.value)}
                    />
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Actieve filters">
                {from && <FilterChip label={`Vanaf: ${from}`} onRemove={() => setFrom("")} />}
                {to && <FilterChip label={`Tot: ${to}`} onRemove={() => setTo("")} />}
                {!from && !to && <span className="text-muted small">Geen extra filters actief.</span>}
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : rows.length === 0 ? (
                <EmptyState message="Geen biedingen gevonden." />
            ) : (
                <DataTable
                    columns={columns}
                    rows={rows}
                    totalResults={totalResults}
                    empty={<EmptyState message="Geen biedingen gevonden." />}
                    getRowKey={(row) => String(row.id)}
                />
            )}

            <Pager
                page={page}
                pageSize={pageSize}
                hasNext={hasNext}
                onPrevious={() => setPage(Math.max(1, page - 1))}
                onNext={() => setPage(page + 1)}
                totalResults={totalResults}
            />
        </Modal>
    );
}
