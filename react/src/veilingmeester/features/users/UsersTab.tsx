import { useCallback, useMemo } from "react";
import { DataTable } from "../../DataTable";
import {
    InlineAlert,
    EmptyState,
    LoadingPlaceholder,
    Pager,
    SearchField,
    SmallSelectField,
    StatusBadge,
    FilterChip,
} from "../../components";
import { appConfig } from "../../config";
import { useUserRows } from "../../hooks";
import type { UserRow } from "../../types";
import { cx } from "../../utils/classNames";

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
 * Renders the beheer view for gebruikers with filters, pagination and actions.
 *
 * @param props - Component properties containing event handlers for koper and kweker acties.
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
        () => appConfig.pagination.table.map((size) => ({ value: size, label: `${size}` })),
        [],
    );

    const handleRowClick = useCallback(
        (row: UserRow) => {
            if (row.soort === "koper") {
                onSelectBidUser(row);
            }
            if (row.soort === "kweker") {
                onSelectGrower(row);
            }
        },
        [onSelectBidUser, onSelectGrower],
    );

    const isInteractive = useCallback((row: UserRow) => row.soort === "koper" || row.soort === "kweker", []);

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
                            <SearchField label="Zoeken" value={search ?? ""} onChange={(value) => setSearch?.(value)} />
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
            {(search ?? "").trim().length > 0 && (
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
                    columns={[
                        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
                        {
                            key: "naam",
                            header: "Naam",
                            sortable: true,
                            render: (row) => (
                                <div className="d-flex flex-column">
                                    <span className="fw-semibold text-break">{row.naam}</span>
                                    <span className="text-muted small">#{row.id}</span>
                                </div>
                            ),
                            getValue: (row) => row.naam,
                        },
                        {
                            key: "email",
                            header: "E-mail",
                            sortable: true,
                            render: (row) => (row.email ? <span className="text-break">{row.email}</span> : <span className="text-muted">—</span>),
                            getValue: (row) => row.email ?? "",
                        },
                        {
                            key: "kvk",
                            header: "KVK",
                            sortable: true,
                            render: (row) => (
                                <span className="font-monospace" title={row.kvk ? undefined : "Geen KVK"}>
                                    {row.kvk ?? "—"}
                                </span>
                            ),
                            getValue: (row) => row.kvk ?? "",
                        },
                        {
                            key: "soort",
                            header: "Soort",
                            sortable: true,
                            render: (row) => (
                                <span className={cx("badge", "rounded-pill", soortBadgeClass[row.soort] ?? "text-bg-secondary")}>
                                    {row.soort}
                                </span>
                            ),
                            getValue: (row) => row.soort,
                            cellClassName: "text-capitalize",
                        },
                        {
                            key: "status",
                            header: "Status",
                            sortable: true,
                            render: (row) => <StatusBadge status={row.status} />,
                            getValue: (row) => row.status,
                        },
                    ]}
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
                onPrevious={() => setPage((previous) => Math.max(1, previous - 1))}
                onNext={() => setPage((previous) => previous + 1)}
                totalResults={totalResults}
            />
        </section>
    );
}
