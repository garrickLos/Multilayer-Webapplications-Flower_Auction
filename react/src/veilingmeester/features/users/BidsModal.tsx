import { useMemo, type JSX } from "react";
import { DataTable } from "../../DataTable";
import {
    EmptyState,
    InlineAlert,
    LoadingPlaceholder,
    Pager,
    SmallSelectField,
    StatusBadge,
    FilterChip,
} from "../../components";
import { appConfig } from "../../config";
import { Modal } from "../../Modal";
import { useUserBids } from "../../hooks";
import type { UserRow } from "../../types";
import { formatCurrency, formatDateTime, parseIsoDate } from "../../utils/formatting";

export type BidsModalProps = {
    readonly user: UserRow;
    readonly onClose: () => void;
};

function isInvalidRange(from?: string, to?: string): boolean {
    const fromMs = parseIsoDate(from ?? null);
    const toMs = parseIsoDate(to ?? null);
    return fromMs != null && toMs != null && toMs < fromMs;
}

/**
 * Displays paginated bidding history for a selected buyer.
 */
export function BidsModal({ user, onClose }: BidsModalProps): JSX.Element {
    const {rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, from, setFrom, to, setTo} = useUserBids(user.id);

    const invalidRange = isInvalidRange(from, to);

    const perPageOptions = useMemo(
        () => appConfig.pagination.modal.map((size) => ({ value: size, label: String(size) })), [],
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
                        onChange={(e) => setFrom?.(e.target.value)}
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
                        onChange={(e) => setTo?.(e.target.value)}
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
