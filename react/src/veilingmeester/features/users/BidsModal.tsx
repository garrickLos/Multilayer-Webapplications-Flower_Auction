import { useMemo } from "react";
import { DataTable } from "../../DataTable";
import {
    EmptyState,
    InlineAlert,
    LoadingPlaceholder,
    Pager,
    SmallSelectField,
    StatusBadge,
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
    if (fromMs == null || toMs == null) {
        return false;
    }
    return toMs < fromMs;
}

/**
 * Displays paginated bidding history for a selected buyer.
 *
 * @param props - Component properties including the selected user and afsluit-actie.
 */
export function BidsModal({ user, onClose }: BidsModalProps): JSX.Element {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, from, setFrom, to, setTo } =
        useUserBids(user.id);

    const invalidRange = isInvalidRange(from, to);

    const perPageOptions = useMemo(
        () => appConfig.pagination.modal.map((size) => ({ value: size, label: `${size}` })),
        [],
    );

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
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
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
                    <label htmlFor="bids-from" className="form-label small text-uppercase text-muted mb-1">
                        Vanaf
                    </label>
                    <input
                        id="bids-from"
                        type="date"
                        className="form-control form-control-sm"
                        value={from ?? ""}
                        onChange={(event) => setFrom?.(event.target.value)}
                        aria-invalid={invalidRange}
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <label htmlFor="bids-to" className="form-label small text-uppercase text-muted mb-1">
                        Tot en met
                    </label>
                    <input
                        id="bids-to"
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
            {error && <InlineAlert>{error}</InlineAlert>}
            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : rows.length === 0 ? (
                <EmptyState message="Geen biedingen gevonden." />
            ) : (
                <DataTable
                    columns={[
                        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
                        {
                            key: "bedragPerFust",
                            header: "Bedrag per fust",
                            sortable: true,
                            render: (row) => formatCurrency(row.bedragPerFust),
                            getValue: (row) => row.bedragPerFust,
                        },
                        {
                            key: "aantalStuks",
                            header: "Stuks",
                            sortable: true,
                            render: (row) => row.aantalStuks,
                            getValue: (row) => row.aantalStuks,
                        },
                        {
                            key: "datumIso",
                            header: "Datum",
                            sortable: true,
                            render: (row) => formatDateTime(row.datumIso),
                            getValue: (row) => row.datumIso ?? "",
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
                    empty={<EmptyState message="Geen biedingen gevonden." />}
                    getRowKey={(row) => String(row.id)}
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
        </Modal>
    );
}
