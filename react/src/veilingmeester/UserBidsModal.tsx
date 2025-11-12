import { useMemo, useState, type ChangeEvent, type ReactElement } from "react";
import { Modal } from "./Modal";
import { useUserBids } from "./hooks";
import type { Column } from "./DataTable";
import { DataTable } from "./DataTable";
import { InlineAlert, Loading } from "./components";
import type { UserBidRow } from "./types";

const BID_COLUMNS: ReadonlyArray<Column<UserBidRow>> = [
    { key: "biedNr", header: "#", sortable: true, className: "text-nowrap", getValue: (row) => row.biedNr ?? row.id },
    {
        key: "bedragPerFust",
        header: "Prijs per fust",
        sortable: true,
        className: "text-nowrap",
        render: (row) => row.bedragLabel,
        getValue: (row) => row.bedragPerFust,
    },
    {
        key: "aantalStuks",
        header: "Aantal stuks",
        sortable: true,
        className: "text-nowrap",
        getValue: (row) => row.aantalStuks,
    },
    {
        key: "datumLabel",
        header: "Datum",
        sortable: true,
        render: (row) => row.datumLabel,
        className: "text-nowrap",
    },
    {
        key: "statusLabel",
        header: "Status",
        className: "text-nowrap",
        sortable: true,
        render: (row) => (
            <span className={`badge ${row.statusVariant}`}>{row.statusLabel}</span>
        ),
    },
];

type Props = {
    userId: number | string;
    onClose: () => void;
};

export function UserBidsModal({ userId, onClose }: Props): ReactElement {
    const [from, setFrom] = useState<string>("");
    const [to, setTo] = useState<string>("");

    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext } = useUserBids(userId, {
        from: from || undefined,
        to: to || undefined,
    });

    const invalidRange = useMemo(() => {
        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
                return toDate < fromDate;
            }
        }
        return false;
    }, [from, to]);

    const errorId = error ? "user-bids-error" : undefined;
    const rangeId = invalidRange ? "user-bids-range-error" : undefined;

    const handleDateChange = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
        setter(event.target.value);
        setPage(1);
    };

    return (
        <Modal title={`Biedingen gebruiker ${userId}`} onClose={onClose} size="lg" ariaDescription={errorId ?? rangeId}>
            <form className="row g-3" aria-describedby={rangeId}>
                <div className="col-12 col-md-6">
                    <label htmlFor="bids-from" className="form-label">
                        Vanaf
                    </label>
                    <input
                        id="bids-from"
                        type="date"
                        className="form-control"
                        value={from}
                        max={to || undefined}
                        onChange={handleDateChange(setFrom)}
                        aria-invalid={invalidRange}
                        aria-describedby={rangeId}
                    />
                </div>
                <div className="col-12 col-md-6">
                    <label htmlFor="bids-to" className="form-label">
                        Tot en met
                    </label>
                    <input
                        id="bids-to"
                        type="date"
                        className="form-control"
                        value={to}
                        min={from || undefined}
                        onChange={handleDateChange(setTo)}
                        aria-invalid={invalidRange}
                        aria-describedby={rangeId}
                    />
                </div>
                {invalidRange && (
                    <div className="col-12">
                        <InlineAlert id={rangeId} variant="warning">
                            Kies een einddatum die gelijk is aan of na de begindatum.
                        </InlineAlert>
                    </div>
                )}
                {error && (
                    <div className="col-12">
                        <InlineAlert id={errorId}>
                            {error.message || "Er ging iets mis. Controleer je filters en probeer opnieuw."}
                        </InlineAlert>
                    </div>
                )}
                <div className="col-12">
                    {loading && !rows.length && <Loading text="Biedingen laden…" />}
                    {!loading && rows.length === 0 && !error && (
                        <p className="text-muted small" aria-live="polite">
                            Geen biedingen gevonden voor deze gebruiker.
                        </p>
                    )}
                    {rows.length > 0 && (
                        <DataTable
                            columns={BID_COLUMNS}
                            rows={rows}
                            getRowKey={(row) => row.id}
                            caption="Overzicht van biedingen"
                        />
                    )}
                </div>
                <div className="col-12 d-flex justify-content-between align-items-center">
                    <div className="small text-muted" aria-live="polite">
                        Pagina {page} • {rows.length === 1 ? "1 resultaat" : `${rows.length} resultaten`}
                    </div>
                    <div className="btn-group">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={loading || page <= 1}
                        >
                            Vorige
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setPage(page + 1)}
                            disabled={loading || !hasNext}
                        >
                            Volgende
                        </button>
                        <select
                            className="form-select form-select-sm"
                            value={pageSize}
                            onChange={(event) => setPageSize(Number(event.target.value))}
                            disabled={loading}
                        >
                            {[10, 25, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size} per pagina
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
