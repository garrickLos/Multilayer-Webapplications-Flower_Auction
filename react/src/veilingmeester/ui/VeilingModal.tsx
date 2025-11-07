import { useEffect, useMemo, useState, useCallback } from 'react';
import Modal from './Modal';
import DataTable, { type Column, type RowBase } from './DataTable';
import { useLiveData } from '../data/live';
import { Empty, Loading } from './components';

/*
 * VeilingModalLive
 *
 * Shows live veilingen for a product in a table with a details pane.
 */

// Formatting helpers for dates and euro values using Dutch locale
const dateFormatter = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short' });
const currencyFormatter = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const fmtDate = (d?: string | null) => (d ? dateFormatter.format(new Date(d)) : '');
const fmtEur = (n?: number | null) => (n == null || Number.isNaN(+n) ? '' : currencyFormatter.format(+n));

// Raw API data shape for a single auction entry
type ApiVeiling = {
    veilingNr?: number;
    begintijd?: string;
    eindtijd?: string;
    status?: string;
    afbeelding?: string;
    product?: { naam?: string; startprijs?: number; voorraad?: number };
};

// Row shape used by the DataTable component. Includes parsed timestamps
// for numeric sorting.
type VeilingRow = RowBase & {
    veilingNr: number | '';
    begintijd: string;
    eindtijd: string;
    begintijdTs: number;
    eindtijdTs: number;
    status: string;
    product: string;
};

// Helper: normalise error into a displayable string
const toErrorMessage = (err: unknown, fallback: string): string | null => {
    if (!err) return null;
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return fallback;
};

// Status badge component for display in the details pane
type StatusBadgeProps = { status?: string | null };
const StatusBadge = ({ status }: StatusBadgeProps) => {
    if (!status) return null;
    const s = status.toLowerCase();
    const cls = s.includes('actief')
        ? 'bg-success-subtle text-success'
        : s.includes('afgesloten')
            ? 'bg-secondary-subtle text-secondary'
            : s.includes('gepland')
                ? 'bg-info-subtle text-info'
                : 'bg-light text-body';
    return <span className={`badge ${cls}`}>{status}</span>;
};

// Custom hook to fetch auctions for a product and map them into table rows
function useVeilingRows(productId: number) {
    const { data: auctions, error } = useLiveData<ReadonlyArray<ApiVeiling>>('/api/Veiling', {
        params: { veilingProduct: productId, page: 1, pageSize: 100 },
        // Refresh every 1 seconds to keep the list synced with the backend
        refreshMs: 1_000,
        revalidateOnFocus: true,
    });

    const rows: VeilingRow[] = useMemo(() => {
        return (auctions ?? []).map(v => {
            const bt = v.begintijd ? Date.parse(v.begintijd) : NaN;
            const et = v.eindtijd ? Date.parse(v.eindtijd) : NaN;
            return {
                veilingNr: v.veilingNr ?? '',
                begintijd: v.begintijd ? fmtDate(v.begintijd) : '',
                eindtijd: v.eindtijd ? fmtDate(v.eindtijd) : '',
                begintijdTs: Number.isNaN(bt) ? Number.NEGATIVE_INFINITY : bt,
                eindtijdTs: Number.isNaN(et) ? Number.NEGATIVE_INFINITY : et,
                status: v.status ?? '',
                product: v.product?.naam ?? '',
            };
        });
    }, [auctions]);

    const loading = !auctions && !error;
    const errorMessage = toErrorMessage(error, 'Kon veilingen niet ophalen.');

    return { rows, auctions, loading, errorMessage };
}

/**
 * Modal that displays the list of auctions for a given product.
 */
export default function VeilingModalLive({ productId, onClose }: { productId: number; onClose: () => void }) {
    const { rows, auctions, loading, errorMessage } = useVeilingRows(productId);

    // Currently selected auction (raw api object)
    const [selected, setSelected] = useState<ApiVeiling | null>(null);

    // When the list of auctions updates, select the first one by default
    useEffect(() => {
        setSelected(auctions && auctions.length ? auctions[0] : null);
    }, [auctions]);

    // Column definitions are static; memoise once
    const columns = useMemo<ReadonlyArray<Column<VeilingRow>>>(
        () => [
            { key: 'veilingNr', header: '#', width: 96, className: 'text-nowrap', sortable: true },
            {
                key: 'begintijd',
                header: 'Begintijd',
                className: 'text-nowrap',
                sortable: true,
                comparator: (a, b, dir) => (dir === 'asc' ? a.begintijdTs - b.begintijdTs : b.begintijdTs - a.begintijdTs),
            },
            {
                key: 'eindtijd',
                header: 'Eindtijd',
                className: 'text-nowrap',
                sortable: true,
                hideSm: true,
                comparator: (a, b, dir) => (dir === 'asc' ? a.eindtijdTs - b.eindtijdTs : b.eindtijdTs - a.eindtijdTs),
            },
            { key: 'status', header: 'Status', className: 'text-nowrap', sortable: true, hideSm: true },
            { key: 'product', header: 'Product', className: 'text-nowrap', sortable: true },
        ],
        [],
    );

    // Row click handler: find the matching ApiVeiling object and set it as selected
    const handleRowClick = useCallback(
        (r: VeilingRow) => {
            const found = auctions?.find(v => (v.veilingNr ?? '') === r.veilingNr) ?? null;
            setSelected(found);
        },
        [auctions],
    );

    return (
        <Modal
            title={
                <span>
                    Veilingen <span className="text-muted">#{productId}</span>
                </span>
            }
            onClose={onClose}
            size="xl"
            fullscreenUntil="lg"
            maxWidthPx={1400}
        >
            {/* Loading state */}
            {loading && <Loading />}

            {/* Error state */}
            {errorMessage && (
                <div className="alert alert-danger" role="alert">
                    {errorMessage}
                </div>
            )}

            {/* Content when data is loaded */}
            {auctions && (
                <div className="row g-3">
                    <div className="col-lg-8 col-md-7">
                        {rows.length ? (
                            <DataTable<VeilingRow>
                                rows={rows}
                                columns={columns}
                                caption="Klik een rij voor details"
                                onRowClick={handleRowClick}
                                getRowKey={r => r.veilingNr || `${r.product}-${r.begintijdTs}`}
                                defaultSortKey="begintijd"
                                defaultSortDir="asc"
                            />
                        ) : (
                            <Empty />
                        )}
                    </div>
                    <div className="col-lg-4 col-md-5">
                        <article className="card shadow-sm border-0 border border-success-subtle">
                            {/* Product image */}
                            {selected?.afbeelding && (
                                <div className="ratio ratio-16x9">
                                    <img
                                        src={selected.afbeelding}
                                        alt={selected.product?.naam || 'product'}
                                        className="w-100 h-100 object-fit-cover rounded-top"
                                        loading="lazy"
                                        decoding="async"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                            )}
                            <div className="card-body">
                                <h5 className="card-title d-flex align-items-center gap-2 mb-1 text-success">
                                    {selected?.product?.naam || <span className="text-muted">Geen naam</span>}
                                    <StatusBadge status={selected?.status} />
                                </h5>
                                <div className="text-muted mb-3">
                                    {selected ? <>Veiling #{selected.veilingNr}</> : 'Selecteer een veiling in de tabel.'}
                                </div>
                                {selected && (
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Startprijs</span>
                                            <strong>{fmtEur(selected.product?.startprijs)}</strong>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Voorraad</span>
                                            <span>{selected.product?.voorraad ?? ''}</span>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Begintijd</span>
                                            <span>{fmtDate(selected.begintijd)}</span>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Eindtijd</span>
                                            <span>{fmtDate(selected.eindtijd)}</span>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </article>
                    </div>
                </div>
            )}
        </Modal>
    );
}
