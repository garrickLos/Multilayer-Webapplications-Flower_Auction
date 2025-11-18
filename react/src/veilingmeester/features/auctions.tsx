import { useEffect, useState, type JSX } from "react";
import { DataTable, EmptyState, FilterChip, InlineAlert, LoadingPlaceholder, Pager, SmallSelectField, StatusBadge } from "../components/ui.tsx";
import { appConfig } from "../config";
import { Modal } from "../Modal";
import { subscribeAuction } from "../api/live";
import { useAuctions } from "../hooks";
import type { VeilingRow } from "../types";
import { formatCurrency, formatDateTime } from "../utils";

export function AuctionsTab({ onSelectAuction }: { readonly onSelectAuction: (row: VeilingRow) => void }): JSX.Element {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, status, setStatus, from, setFrom, to, setTo } = useAuctions();
    const perPage = appConfig.pagination.table.map((size) => ({ value: size, label: String(size) }));

    const columns = [
        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
        {
            key: "titel",
            header: "Titel",
            sortable: true,
            render: (row: VeilingRow) => (
                <div className="d-flex flex-column">
                    <span className="fw-semibold text-break">{row.titel}</span>
                    <span className="text-muted small">#{row.id}</span>
                </div>
            ),
            getValue: (row: VeilingRow) => row.titel,
        },
        {
            key: "minPrice",
            header: "Prijs",
            sortable: true,
            render: (row: VeilingRow) => (
                <div className="d-flex flex-column">
                    <span>{formatCurrency(row.minPrice)}</span>
                    <small className="text-muted">Max {formatCurrency(row.maxPrice)}</small>
                </div>
            ),
            getValue: (row: VeilingRow) => row.minPrice,
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
            header: "Einde",
            sortable: true,
            render: (row: VeilingRow) => formatDateTime(row.endIso),
            getValue: (row: VeilingRow) => row.endIso ?? "",
        },
        {
            key: "productCount",
            header: "Producten",
            sortable: true,
            render: (row: VeilingRow) => row.productCount,
            getValue: (row: VeilingRow) => row.productCount,
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row: VeilingRow) => <StatusBadge status={row.status} />,
            getValue: (row: VeilingRow) => row.status,
        },
    ];

    return (
        <section className="d-flex flex-column gap-3" aria-label="Veilingen">
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-6 col-lg-2">
                            <SmallSelectField
                                label="Status"
                                value={status}
                                onChange={(value) => setStatus(value)}
                                options={[
                                    { value: "alle", label: "Alle" },
                                    { value: "actief", label: "Actief" },
                                    { value: "inactief", label: "Inactief" },
                                ]}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
                            <label htmlFor="from" className="form-label small text-uppercase text-success-emphasis mb-1">
                                Vanaf
                            </label>
                            <input
                                id="from"
                                type="date"
                                className="form-control form-control-sm border-success-subtle"
                                value={from}
                                onChange={(event) => setFrom(event.target.value)}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
                            <label htmlFor="to" className="form-label small text-uppercase text-success-emphasis mb-1">
                                Tot en met
                            </label>
                            <input
                                id="to"
                                type="date"
                                className="form-control form-control-sm border-success-subtle"
                                value={to}
                                onChange={(event) => setTo(event.target.value)}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
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

            <div className="d-flex flex-wrap gap-2" aria-label="Actieve filters">
                {status !== "alle" && <FilterChip label={`Status: ${status}`} onRemove={() => setStatus("alle")} />}
                {from && <FilterChip label={`Vanaf: ${from}`} onRemove={() => setFrom("")} />}
                {to && <FilterChip label={`Tot: ${to}`} onRemove={() => setTo("")} />}
                {!from && !to && status === "alle" && <span className="text-muted small">Geen filters actief.</span>}
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
                onPrevious={() => setPage(Math.max(1, page - 1))}
                onNext={() => setPage(page + 1)}
                totalResults={totalResults}
            />
        </section>
    );
}

export function AuctionModal({ row, onClose }: { readonly row: VeilingRow; readonly onClose: () => void }): JSX.Element {
    const [current, setCurrent] = useState<VeilingRow>(row);

    useEffect(() => {
        const cleanup = subscribeAuction(row.id, (patch) => setCurrent((prev) => ({ ...prev, ...patch })));
        return cleanup;
    }, [row.id]);

    return (
        <Modal
            title={
                <div className="d-flex flex-column">
                    <span className="fw-semibold">{current.titel}</span>
                    <span className="text-muted small">Veiling #{current.id}</span>
                </div>
            }
            onClose={onClose}
            footer={
                <button type="button" className="btn btn-success" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <div className="row g-3 mb-3">
                <Info label="Status">
                    <StatusBadge status={current.status} />
                </Info>
                <Info label="Start">{formatDateTime(current.startIso)}</Info>
                <Info label="Einde">{formatDateTime(current.endIso)}</Info>
                <Info label="Prijsbereik">
                    {formatCurrency(current.minPrice)} – {formatCurrency(current.maxPrice)}
                </Info>
                <Info label="Producten">{current.productCount}</Info>
            </div>
        </Modal>
    );
}

const Info = ({ label, children }: { readonly label: string; readonly children: JSX.Element | string | number }): JSX.Element => (
    <div className="col-12 col-md-6">
        <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle h-100">
            <p className="text-uppercase small text-success-emphasis mb-1">{label}</p>
            <div className="fw-semibold text-success-emphasis">{children}</div>
        </div>
    </div>
);
