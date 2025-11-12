import { useMemo } from 'react';
import Modal from './Modal';
import DataTable, { type Column } from './DataTable';
import { Empty, Loading, Pager, SearchInput, SelectSm } from './components';
import { useUserBids } from '../hooks';
import { formatCurrency } from '../utils/format';
import type { UserBidRow } from '../types/types.ts';

type UserBidsModalProps = {
    userId: string | number;
    onClose: () => void;
};

const formatStatusLabel = (value: string) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const COLUMNS: ReadonlyArray<Column<UserBidRow>> = [
    { key: 'biedNr', header: '#', width: 90, className: 'text-nowrap', sortable: true },
    { key: 'veiling', header: 'Veiling', sortable: true },
    {
        key: 'bedragPerFust',
        header: 'Bedrag per fust',
        className: 'text-end text-nowrap',
        sortable: true,
        render: value => formatCurrency(value as number | string),
    },
    {
        key: 'aantalStuks',
        header: 'Aantal',
        className: 'text-end text-nowrap',
        sortable: true,
    },
    { key: 'status', header: 'Status bod', sortable: true },
    { key: 'datum', header: 'Datum', sortable: true },
];

export default function UserBidsModal({ userId, onClose }: UserBidsModalProps) {
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
        statusOptions,
        reset,
    } = useUserBids(userId);

    const statusOptionItems = useMemo(
        () =>
            statusOptions.map(option => ({
                value: option,
                label: option === 'alle' ? 'Alle' : formatStatusLabel(option),
            })),
        [statusOptions],
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
        >
            <div className="row g-2 align-items-end mb-2">
                <div className="col-12 col-xl-4">
                    <SearchInput
                        id="user-bids-search"
                        label="Zoek in biedingen"
                        value={search}
                        onChange={setSearch}
                        placeholder="bijv. veiling, bedrag, status…"
                    />
                </div>
                <div className="col-12 col-sm-6 col-xl-2">
                    <label htmlFor="user-bid-status" className="form-label mb-1">
                        Status bod
                    </label>
                    <select
                        id="user-bid-status"
                        className="form-select form-select-sm"
                        value={status}
                        onChange={event => setStatus(event.currentTarget.value)}
                        aria-label="Status bod"
                    >
                        {statusOptionItems.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-12 col-sm-6 col-xl-2">
                    <label htmlFor="user-bid-from" className="form-label mb-1">
                        Datum van
                    </label>
                    <input
                        id="user-bid-from"
                        type="date"
                        className="form-control form-control-sm"
                        value={from}
                        onChange={event => setFrom(event.currentTarget.value)}
                        aria-label="Datum van"
                    />
                </div>
                <div className="col-12 col-sm-6 col-xl-2">
                    <label htmlFor="user-bid-to" className="form-label mb-1">
                        Datum tot
                    </label>
                    <input
                        id="user-bid-to"
                        type="date"
                        className="form-control form-control-sm"
                        value={to}
                        onChange={event => setTo(event.currentTarget.value)}
                        aria-label="Datum tot"
                    />
                </div>
                <div className="col-12 col-sm-6 col-xl-2">
                    <SelectSm
                        id="user-bid-page-size"
                        label="Per pagina"
                        value={pageSize}
                        onChange={setPageSize}
                    />
                </div>
            </div>

            <div className="d-flex justify-content-end mb-3">
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={reset}
                    disabled={loading}
                >
                    Reset
                </button>
            </div>

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
                    getRowKey={row => row.id}
                    caption="Overzicht van biedingen"
                />
            ) : (
                <Empty />
            )}

            <Pager
                page={page}
                setPage={setPage}
                hasNext={hasNext}
                loading={loading}
                total={rows.length}
            />
        </Modal>
    );
}
