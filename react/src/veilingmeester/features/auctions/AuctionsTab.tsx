import { useMemo, type JSX } from "react";
import { DataTable } from "../../DataTable";
import {
    EmptyState,
    InlineAlert,
    LoadingPlaceholder,
    Pager,
    SmallSelectField,
    StatusBadge,
    StatusSelectField,
    FilterChip,
} from "../../components";
import { appConfig } from "../../config";
import { useVeilingRows } from "../../hooks";
import type { VeilingRow } from "../../types";
import { formatDateTime, parseIsoDate } from "../../utils/formatting";

export type AuctionsTabProps = {
    readonly onSelectAuction: (row: VeilingRow) => void;
};

function isInvalidRange(from?: string, to?: string): boolean {
    const fromMs = parseIsoDate(from ?? null);
    const toMs = parseIsoDate(to ?? null);
    return fromMs != null && toMs != null && toMs < fromMs;
}

/**
 * Lists auctions with filters and pagination.
 */
export function AuctionsTab({ onSelectAuction }: AuctionsTabProps): JSX.Element {
    const {rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, status, setStatus, from, setFrom, to, setTo,} = useVeilingRows();

    const perPageOptions = useMemo(
        () => appConfig.pagination.table.map((size) => ({ value: size, label: String(size) })), [],
    );

    const invalidRange = isInvalidRange(from, to);
    const hasStatusFilter = (status ?? "alle") !== "alle";
    const hasFromFilter = Boolean(from);
    const hasToFilter = Boolean(to);

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
                key: "titel",
                header: "Titel",
                sortable: true,
                render: (row: VeilingRow) => (
                    <div className="d-flex flex-column">
                        <span className="fw-semibold text-break">{row.titel}</span>
                        <span className="text-muted small">
              {formatDateTime(row.startIso)} • {formatDateTime(row.endIso)}
            </span>
                    </div>
                ),
                getValue: (row: VeilingRow) => row.titel,
            },
            {
                key: "startIso",
                header: "Start",
                sortable: true,
                render: (row: VeilingRow) => formatDateTime(row.startIso),
                getValue: (row: VeilingRow) => row.startIso ?? "",
            },
            {
                key: "endIso",
                header: "Eind",
                sortable: true,
                render: (row: VeilingRow) => formatDateTime(row.endIso),
                getValue: (row: VeilingRow) => row.endIso ?? "",
            },
            {
                key: "status",
                header: "Status",
                sortable: true,
                render: (row: VeilingRow) => <StatusBadge status={row.status} />,
                getValue: (row: VeilingRow) => row.status,
            },
            {
                key: "productCount",
                header: "Producten",
                sortable: true,
                render: (row: VeilingRow) => (
                    <span className="badge text-bg-secondary">{row.productCount}</span>
                ),
                getValue: (row: VeilingRow) => row.productCount,
            },
        ],
        [],
    );

    return (
        <section className="d-flex flex-column gap-3" aria-label="Veilingen">
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="d-flex flex-column gap-2 mb-3">
                        <p className="text-uppercase text-success-emphasis small fw-semibold mb-0">
                            Filter veilingen
                        </p>
                        <p className="text-muted small mb-0">
                            Stel status en datumbereik in om gericht te controleren.
                        </p>
                    </div>

                    <div className="row g-3 align-items-end">
                        <div className="col-6 col-lg-2">
                            <SmallSelectField<number>
                                label="Per pagina"
                                value={pageSize}
                                onChange={setPageSize}
                                options={perPageOptions}
                                parse={(raw) => Number(raw)}
                            />
                        </div>

                        <div className="col-6 col-lg-2">
                            <StatusSelectField
                                label="Status"
                                value={status ?? "alle"}
                                onChange={(value) => setStatus?.(value)}
                            />
                        </div>

                        <div className="col-6 col-lg-2">
                            <label
                                htmlFor="auctions-from"
                                className="form-label small text-uppercase text-success-emphasis mb-1"
                            >
                                Vanaf
                            </label>
                            <input
                                id="auctions-from"
                                type="date"
                                className="form-control form-control-sm border-success-subtle"
                                value={from ?? ""}
                                onChange={(event) => setFrom?.(event.target.value)}
                                aria-invalid={invalidRange}
                            />
                        </div>

                        <div className="col-6 col-lg-2">
                            <label
                                htmlFor="auctions-to"
                                className="form-label small text-uppercase text-success-emphasis mb-1"
                            >
                                Tot en met
                            </label>
                            <input
                                id="auctions-to"
                                type="date"
                                className="form-control form-control-sm border-success-subtle"
                                value={to ?? ""}
                                onChange={(event) => setTo?.(event.target.value)}
                                aria-invalid={invalidRange}
                            />
                        </div>

                        {invalidRange && (
                            <div className="col-12">
                                <div className="text-danger small">
                                    Einddatum moet na begindatum liggen.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2" aria-label="Actieve filters">
                {hasStatusFilter && (
                    <FilterChip
                        label={`Status: ${status}`}
                        onRemove={() => setStatus?.("alle")}
                    />
                )}
                {hasFromFilter && (
                    <FilterChip
                        label={`Vanaf: ${from}`}
                        onRemove={() => setFrom?.("")}
                    />
                )}
                {hasToFilter && (
                    <FilterChip
                        label={`Tot: ${to}`}
                        onRemove={() => setTo?.("")}
                    />
                )}
                {!hasStatusFilter && !hasFromFilter && !hasToFilter && (
                    <span className="text-muted small">Geen extra filters actief.</span>
                )}
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : rows.length === 0 ? (
                <EmptyState message="Geen veilingen gevonden." />
            ) : (
                <DataTable
                    columns={columns}
                    rows={rows}
                    totalResults={totalResults}
                    empty={<EmptyState message="Geen veilingen gevonden." />}
                    getRowKey={(row) => String(row.id)}
                    onRowClick={onSelectAuction}
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
