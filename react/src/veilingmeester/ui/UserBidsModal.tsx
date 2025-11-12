import { useMemo, useId, type ReactElement } from "react";
import Modal from "./Modal";
import DataTable, { type Column } from "./DataTable";
import { Empty, Loading, Pager, SearchInput, SelectSm, SelectStatusSm } from "./components";
import { useUserBids } from "../hooks";
import { formatCurrency } from "../utils/format";
import type { UserBidRow } from "../types/types.ts";

/* Kolommenconfiguratie */
const COLUMNS: ReadonlyArray<Column<UserBidRow>> = [
    { key: "biedNr", header: "#", width: 90, className: "text-nowrap", sortable: true },
    { key: "veiling", header: "Veiling", sortable: true },
    {
        key: "bedragPerFust",
        header: "Bedrag per fust",
        className: "text-end text-nowrap",
        sortable: true,
        render: (value) => formatCurrency(value as number | string),
    },
    {
        key: "aantalStuks",
        header: "Aantal",
        className: "text-end text-nowrap",
        sortable: true,
    },
    { key: "status", header: "Status bod", sortable: true },
    { key: "datum", header: "Datum", sortable: true },
];

type UserBidsModalProps = {
    userId: string | number;
    onClose: () => void;
};

export default function UserBidsModal({ userId, onClose }: UserBidsModalProps): ReactElement {
    const ids = {
        search: useId(),
        status: useId(),
        from: useId(),
        to: useId(),
        error: useId(),
    };

    const {
        rows,
        loading,
        error,
        page,
        setPage,
        pageSize,
        setPageSize,
        hasNext,
        search,
        setSearch,
        status,
        setStatus,
        from,
        setFrom,
        to,
        setTo,
        reset,
    } = useUserBids(userId);

    // Datumvalidatie
    const dateError = useMemo(() => (from && to && from > to ? "De einddatum valt vóór de startdatum." : null), [from, to]);

    const fromAttrs = useMemo(
        () => ({ id: ids.from, type: "date" as const, max: to || undefined, value: from || "" }),
        [ids.from, to, from]
    );
    const toAttrs = useMemo(
        () => ({ id: ids.to, type: "date" as const, min: from || undefined, value: to || "" }),
        [ids.to, from, to]
    );

    return (
        <Modal
            title={
                <span>
          Biedingen gebruiker <span className="text-muted">#{userId}</span>
        </span>
            }
            onClose={onClose}
            size="xl"
            fullscreenUntil="lg"
            maxWidthPx={1200}
            ariaDescription={dateError ?? undefined}
        >
            {/* Filters */}
            <div className="row g-2 align-items-end mb-2" aria-live="polite">
                <div className="col-12 col-xl-4">
                    <SearchInput
                        id={ids.search}
                        label="Zoek in biedingen"
                        value={search}
                        onChange={setSearch}
                        placeholder="bijv. veiling, bedrag, status…"
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-2">
                    <SelectStatusSm
                        id={ids.status}
                        label="Status bod"
                        value={status as "alle" | "actief" | "inactief"}
                        onChange={(v) => setStatus(v)}
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-2">
                    <label htmlFor={ids.from} className="form-label mb-1">
                        Datum van
                    </label>
                    <input
                        {...fromAttrs}
                        className="form-control form-control-sm"
                        onChange={(e) => setFrom(e.currentTarget.value)}
                        aria-invalid={dateError ? true : undefined}
                        aria-describedby={dateError ? ids.error : undefined}
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-2">
                    <label htmlFor={ids.to} className="form-label mb-1">
                        Datum tot
                    </label>
                    <input
                        {...toAttrs}
                        className="form-control form-control-sm"
                        onChange={(e) => setTo(e.currentTarget.value)}
                        aria-invalid={dateError ? true : undefined}
                        aria-describedby={dateError ? ids.error : undefined}
                    />
                </div>

                <div className="col-12 col-sm-6 col-xl-2">
                    <SelectSm id="user-bid-page-size" label="Per pagina" value={pageSize} onChange={setPageSize} />
                </div>
            </div>

            {/* Reset en foutmeldingen */}
            <div className="d-flex justify-content-end mb-3 gap-2">
                {dateError && (
                    <div id={ids.error} className="alert alert-warning py-1 px-2 m-0 small" role="alert">
                        {dateError}
                    </div>
                )}
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={reset} disabled={loading}>
                    Reset
                </button>
            </div>

            {/* Content */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <Loading />
            ) : rows.length ? (
                <DataTable<UserBidRow>
                    rows={rows}
                    columns={COLUMNS}
                    getRowKey={(r) => r.id}
                    caption="Overzicht van biedingen"
                />
            ) : (
                <Empty label="Geen biedingen gevonden." />
            )}

            {/* Paginering */}
            <Pager page={page} setPage={setPage} hasNext={hasNext} loading={loading} total={rows.length} />
        </Modal>
    );
}
