import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Modal from './Modal';
import DataTable, { type Column, type RowBase } from './DataTable';
import { apiGet } from '../data/utils';
import { Empty, Loading } from './components';

// Formatting helpers for dates and euro values using Dutch locale
const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short' }).format(d);
const fmtEur = (n?: number | null) =>
    n == null || Number.isNaN(+n)
        ? ''
        : new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(+n);

// Raw API data shape for a single auction entry
type ApiVeiling = {
    veilingNr?: number;
    begintijd?: string; // ISO timestamp
    eindtijd?: string; // ISO timestamp
    status?: string;
    afbeelding?: string;
    product?: { naam?: string; startprijs?: number; voorraad?: number };
};

// Row shape used by the DataTable component.  Includes parsed timestamps
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

// Status badge component for display in the details pane
const StatusBadge: React.FC<{ status?: string | null }> = ({ status }) => {
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

/**
 * Modal that displays the list of auctions for a given product.  Shows a
 * table of auctions on the left and details of the selected auction on the
 * right.  Fetches up to 100 auctions for the product on mount and allows
 * selecting rows for more details.  Uses the revised modal and data table
 * components with improved accessibility and performance.
 */
export default function VeilingModal({ productId, onClose }: { productId: number; onClose: () => void }) {
    const [rowsRaw, setRowsRaw] = useState<ReadonlyArray<ApiVeiling> | null>(null);
    const [selected, setSelected] = useState<ApiVeiling | null>(null);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    // Fetch auctions whenever the productId changes
    useEffect(() => {
        abortRef.current?.abort();
        const ctl = new AbortController();
        abortRef.current = ctl;
        (async () => {
            try {
                setRowsRaw(null);
                setSelected(null);
                setError(null);
                const url = `/api/Veiling?veilingProduct=${encodeURIComponent(productId)}&page=1&pageSize=100`;
                const res = await apiGet<ReadonlyArray<ApiVeiling>>(url, { signal: ctl.signal });
                if (!ctl.signal.aborted) {
                    const rows = res ?? [];
                    setRowsRaw(rows);
                    setSelected(rows[0] ?? null);
                }
            } catch {
                if (!ctl.signal.aborted) {
                    setRowsRaw([]);
                    setError('Kon veilingen niet ophalen.');
                }
            }
        })();
        return () => ctl.abort();
    }, [productId]);
    // Define columns for the data table once
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
    // Map raw API data into table rows.  Parse timestamps into numbers for sorting.
    const rows: VeilingRow[] = useMemo(
        () =>
            (rowsRaw ?? []).map(v => {
                const bt = v.begintijd ? Date.parse(v.begintijd) : NaN;
                const et = v.eindtijd ? Date.parse(v.eindtijd) : NaN;
                return {
                    veilingNr: v.veilingNr ?? '',
                    begintijd: v.begintijd ? fmtDate(new Date(v.begintijd)) : '',
                    eindtijd: v.eindtijd ? fmtDate(new Date(v.eindtijd)) : '',
                    begintijdTs: Number.isNaN(bt) ? Number.NEGATIVE_INFINITY : bt,
                    eindtijdTs: Number.isNaN(et) ? Number.NEGATIVE_INFINITY : et,
                    status: v.status ?? '',
                    product: v.product?.naam ?? '',
                };
            }),
        [rowsRaw],
    );
    // Row click handler: find the matching ApiVeiling object and set it as selected
    const handleRowClick = useCallback(
        (r: VeilingRow) => {
            const found = rowsRaw?.find(v => (v.veilingNr ?? '') === r.veilingNr) ?? null;
            setSelected(found);
        },
        [rowsRaw],
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
            {!rowsRaw && !error && <Loading />}
            {/* Error state */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {/* Content when data is loaded */}
            {rowsRaw && (
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
                                    {selected ? (
                                        <>
                                            Veiling #{selected.veilingNr}
                                        </>
                                    ) : (
                                        'Selecteer een veiling in de tabel.'
                                    )}
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
                                            <span>{selected.begintijd ? fmtDate(new Date(selected.begintijd)) : ''}</span>
                                        </li>
                                        <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                            <span className="text-muted">Eindtijd</span>
                                            <span>{selected.eindtijd ? fmtDate(new Date(selected.eindtijd)) : ''}</span>
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

// Export the FilterChip alias for backwards compatibility
export { DataTable as ArrayTable };