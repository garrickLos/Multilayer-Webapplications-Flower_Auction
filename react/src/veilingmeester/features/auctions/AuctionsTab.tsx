import { useMemo } from "react";
import { DataTable } from "../../DataTable";
import {
    EmptyState,
    InlineAlert,
    LoadingPlaceholder,
    Pager,
    SmallSelectField,
    StatusBadge,
    StatusSelectField,
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
    if (fromMs == null || toMs == null) {
        return false;
    }
    return toMs < fromMs;
}

/**
 * Lists auctions with filters and pagination.
 *
 * @param props - Component properties including the selecteer-actie voor een veiling.
 */
export function AuctionsTab({ onSelectAuction }: AuctionsTabProps): JSX.Element {
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

    const perPageOptions = useMemo(
        () => appConfig.pagination.table.map((size) => ({ value: size, label: `${size}` })),
        [],
    );

    const invalidRange = isInvalidRange(from, to);

    return (
        <section className="d-flex flex-column gap-3" aria-label="Veilingen">
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
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
                            <label htmlFor="auctions-from" className="form-label small text-uppercase text-muted mb-1">
                                Vanaf
                            </label>
                            <input
                                id="auctions-from"
                                type="date"
                                className="form-control form-control-sm"
                                value={from ?? ""}
                                onChange={(event) => setFrom?.(event.target.value)}
                                aria-invalid={invalidRange}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
                            <label htmlFor="auctions-to" className="form-label small text-uppercase text-muted mb-1">
                                Tot en met
                            </label>
                            <input
                                id="auctions-to"
                                type="date"
                                className="form-control form-control-sm"
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
                </div>
            </div>
            {error && <InlineAlert>{error}</InlineAlert>}
            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : rows.length === 0 ? (
                <EmptyState message="Geen veilingen gevonden." />
            ) : (
                <DataTable
                    columns={[
                        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
                        {
                            key: "titel",
                            header: "Titel",
                            sortable: true,
                            render: (row) => (
                                <div className="d-flex flex-column">
                                    <span className="fw-semibold text-break">{row.titel}</span>
                                    <span className="text-muted small">
                                        {formatDateTime(row.startIso)} • {formatDateTime(row.endIso)}
                                    </span>
                                </div>
                            ),
                            getValue: (row) => row.titel,
                        },
                        {
                            key: "startIso",
                            header: "Start",
                            sortable: true,
                            render: (row) => formatDateTime(row.startIso),
                            getValue: (row) => row.startIso ?? "",
                        },
                        {
                            key: "endIso",
                            header: "Eind",
                            sortable: true,
                            render: (row) => formatDateTime(row.endIso),
                            getValue: (row) => row.endIso ?? "",
                        },
                        {
                            key: "status",
                            header: "Status",
                            sortable: true,
                            render: (row) => <StatusBadge status={row.status} />,
                            getValue: (row) => row.status,
                        },
                        {
                            key: "productCount",
                            header: "Producten",
                            sortable: true,
                            render: (row) => <span className="badge text-bg-secondary">{row.productCount}</span>,
                            getValue: (row) => row.productCount,
                        },
                    ]}
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
                onPrevious={() => setPage((previous) => Math.max(1, previous - 1))}
                onNext={() => setPage((previous) => previous + 1)}
                totalResults={totalResults}
            />
        </section>
    );
}
