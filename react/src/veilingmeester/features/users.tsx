import { useCallback, useMemo, type JSX } from "react";
import {
    DataTable,
    EmptyState,
    FilterChip,
    InlineAlert,
    LoadingPlaceholder,
    Pager,
    SearchField,
    SmallSelectField,
    StatusBadge,
} from "../components";
import { appConfig } from "../config";
import { Modal } from "../Modal";
import { useUserBids, useUserRows } from "../hooks";
import type { UserRow } from "../types";
import { cx, formatCurrency, formatDateTime, parseIsoDate } from "../utils";

export type UsersTabProps = {
    readonly onSelectBidUser: (user: UserRow) => void;
    readonly onSelectGrower: (user: UserRow) => void;
};

const soortBadgeClass: Record<UserRow["soort"], string> = {
    koper: "text-bg-primary",
    kweker: "text-bg-success",
    veilingmeester: "text-bg-secondary",
    onbekend: "text-bg-secondary",
};

/**
 * Renders the beheer view voor gebruikers met filters, paginatie en acties.
 */
export function UsersTab({ onSelectBidUser, onSelectGrower }: UsersTabProps): JSX.Element {
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
        search,
        setSearch,
    } = useUserRows();

    const perPageOptions = useMemo(
        () => appConfig.pagination.table.map((size) => ({ value: size, label: String(size) })),
        [],
    );

    const handleRowClick = useCallback(
        (row: UserRow) => {
            if (row.soort === "koper") onSelectBidUser(row);
            if (row.soort === "kweker") onSelectGrower(row);
        },
        [onSelectBidUser, onSelectGrower],
    );

    const isInteractive = useCallback(
        (row: UserRow) => row.soort === "koper" || row.soort === "kweker",
        [],
    );

    const columns = useMemo(
        () => [
            {
                key: "id",
                header: "#",
                sortable: true,
                headerClassName: "text-nowrap",
                cellClassName: "text-nowrap",
            },
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
                render: (row: UserRow) =>
                    row.email ? <span className="text-break">{row.email}</span> : <span className="text-muted">—</span>,
                getValue: (row: UserRow) => row.email ?? "",
            },
            {
                key: "kvk",
                header: "KVK",
                sortable: true,
                render: (row: UserRow) => (
                    <span className="font-monospace" title={row.kvk ? undefined : "Geen KVK"}>
                        {row.kvk ?? "—"}
                    </span>
                ),
                getValue: (row: UserRow) => row.kvk ?? "",
            },
            {
                key: "soort",
                header: "Soort",
                sortable: true,
                render: (row: UserRow) => (
                    <span className={cx("badge", "rounded-pill", soortBadgeClass[row.soort] ?? "text-bg-secondary")}>
                        {row.soort}
                    </span>
                ),
                getValue: (row: UserRow) => row.soort,
                cellClassName: "text-capitalize",
            },
            {
                key: "status",
                header: "Status",
                sortable: true,
                render: (row: UserRow) => <StatusBadge status={row.status} />,
                getValue: (row: UserRow) => row.status,
            },
        ],
        [],
    );

    const hasSearch = Boolean((search ?? "").trim());

    return (
        <section className="d-flex flex-column gap-3" aria-label="Gebruikersbeheer">
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="d-flex flex-column gap-2 mb-3">
                        <p className="text-uppercase text-success-emphasis small fw-semibold mb-0">Filters</p>
                        <p className="text-muted small mb-0">Zoek snel op naam of pas de paginagrootte aan.</p>
                    </div>
                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-6 col-lg-4">
                            <SearchField
                                label="Zoeken"
                                value={search ?? ""}
                                onChange={(value) => setSearch?.(value)}
                            />
                        </div>
                        <div className="col-6 col-md-3 col-lg-2">
                            <SmallSelectField<number>
                                label="Per pagina"
                                value={pageSize}
                                onChange={setPageSize}
                                options={perPageOptions}
                                parse={(raw) => Number(raw)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {hasSearch && (
                <div className="d-flex flex-wrap gap-2" aria-label="Actieve filters">
                    <FilterChip label={`Zoeken: ${search}`} onRemove={() => setSearch?.("")} />
                </div>
            )}

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
                    isRowInteractive={isInteractive}
                />
            )}

            <Pager
                page={page}
                pageSize={pageSize}
                hasNext={hasNext}
                onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setPage((prev) => prev + 1)}
                totalResults={totalResults}
            />
        </section>
    );
}

export type BidsModalProps = {
    readonly user: UserRow;
    readonly onClose: () => void;
};

function hasInvalidRange(from?: string, to?: string): boolean {
    const fromMs = parseIsoDate(from ?? null);
    const toMs = parseIsoDate(to ?? null);
    return fromMs != null && toMs != null && toMs < fromMs;
}

/**
 * Displays paginated bidding history for a selected buyer.
 */
export function BidsModal({ user, onClose }: BidsModalProps): JSX.Element {
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
        from,
        setFrom,
        to,
        setTo,
    } = useUserBids(user.id);

    const invalidRange = hasInvalidRange(from, to);

    const perPageOptions = useMemo(
        () => appConfig.pagination.modal.map((size) => ({ value: size, label: String(size) })),
        [],
    );

    const columns = useMemo(
        () => [
            {
                key: "id",
                header: "#",
                sortable: true,
                headerClassName: "text-nowrap",
                cellClassName: "text-nowrap",
            },
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
        ],
        [],
    );

    const hasFrom = Boolean((from ?? "") !== "");
    const hasTo = Boolean((to ?? "") !== "");

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
                        options={perPageOptions}
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
                        value={from ?? ""}
                        onChange={(event) => setFrom?.(event.target.value)}
                        aria-invalid={invalidRange}
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
                        value={to ?? ""}
                        onChange={(event) => setTo?.(event.target.value)}
                        aria-invalid={invalidRange}
                    />
                </div>

                {invalidRange && (
                    <div className="col-12">
                        <div className="text-danger small">Einddatum moet na begindatum liggen.</div>
                    </div>
                )}
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Actieve filters">
                {hasFrom && <FilterChip label={`Vanaf: ${from}`} onRemove={() => setFrom?.("")} />}
                {hasTo && <FilterChip label={`Tot: ${to}`} onRemove={() => setTo?.("")} />}
                {!hasFrom && !hasTo && <span className="text-muted small">Geen extra filters actief.</span>}
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
                onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setPage((prev) => prev + 1)}
                totalResults={totalResults}
            />
        </Modal>
    );
}
