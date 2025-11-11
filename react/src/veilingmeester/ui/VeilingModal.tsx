import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import DataTable, { type Column } from './DataTable';
import { Empty, Loading } from './components';
import { formatCurrency, formatDateTime, parseLocaleNumber } from '../utils/format';
import { useVeilingProducts, type VeilingDetail, type VeilingProductRow } from '../hooks/useVeilingProducts';
import type { VeilingProductItem } from '../types';

type VeilingModalProps = {
    veilingId: number;
    onClose: () => void;
};

const StatusBadge = ({ status }: { status?: string | null }) => {
    if (!status) return null;
    const normalized = status.toLowerCase();

    const badgeClass = normalized.includes('active')
        ? 'bg-success-subtle text-success'
        : normalized.includes('sold')
          ? 'bg-secondary-subtle text-secondary'
          : normalized.includes('inactive')
              ? 'bg-warning-subtle text-warning'
              : 'bg-light text-body';

    return <span className={`badge ${badgeClass}`}>{status}</span>;
};

const computeCurrentPrice = (row: VeilingProductRow, veiling: VeilingDetail, nowMs: number) => {
    const base = row.startprijsValue;
    const minimum = parseLocaleNumber(veiling.minimumprijs ?? 0);

    if (base <= minimum) return minimum;

    const startTs = Date.parse(veiling.begintijd ?? '');
    const endTs = Date.parse(veiling.eindtijd ?? '');

    if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) {
        return Math.max(minimum, base);
    }

    if (nowMs <= startTs) return base;
    if (nowMs >= endTs) return minimum;

    const progress = (nowMs - startTs) / (endTs - startTs);
    const span = base - minimum;
    const raw = base - span * progress;
    return Math.min(base, Math.max(minimum, Number(raw.toFixed(2))));
};

const isVeilingInactive = (veiling: VeilingDetail | null | undefined, nowMs: number) => {
    if (!veiling) return false;
    const status = (veiling.status ?? '').toLowerCase();
    if (status.includes('inactive')) return true;
    const endTs = Date.parse(veiling.eindtijd ?? '');
    return Number.isFinite(endTs) && nowMs >= endTs;
};

export default function VeilingModal({ veilingId, onClose }: VeilingModalProps) {
    const { veiling, rows, loading, errorMessage } = useVeilingProducts(veilingId);

    const [nowMs, setNowMs] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNowMs(Date.now()), 1_000);
        return () => window.clearInterval(timer);
    }, []);

    const [selectedProduct, setSelectedProduct] = useState<VeilingProductItem | null>(null);
    useEffect(() => {
        setSelectedProduct(veiling?.producten?.[0] ?? null);
    }, [veiling]);

    const selectedRow = useMemo(
        () =>
            selectedProduct
                ? rows.find(row => row.veilingProductNr === (selectedProduct.veilingProductNr ?? ''))
                : undefined,
        [rows, selectedProduct],
    );

    const getCurrentPrice = useCallback(
        (row: VeilingProductRow) =>
            veiling ? computeCurrentPrice(row, veiling, nowMs) : row.startprijsValue,
        [veiling, nowMs],
    );

    const inactive = useMemo(() => isVeilingInactive(veiling, nowMs), [veiling, nowMs]);

    const columns = useMemo<ReadonlyArray<Column<VeilingProductRow>>>(
        () => [
            {
                key: 'veilingProductNr',
                header: '#',
                width: 80,
                className: 'text-nowrap',
                sortable: true,
            },
            {
                key: 'imageOrClock',
                header: 'Product / klok',
                width: 160,
                className: 'text-center align-middle',
                sortable: false,
                render: (_value, row) =>
                    row.afbeeldingUrl ? (
                        <img
                            src={row.afbeeldingUrl}
                            alt={row.naam || 'Product'}
                            className="img-thumbnail rounded"
                            style={{ maxHeight: 56 }}
                        />
                    ) : (
                        <div className="d-flex flex-column align-items-center small">
                            <span className="fw-semibold">{formatCurrency(getCurrentPrice(row))}</span>
                            <span
                                className={`badge rounded-pill mt-1 ${
                                    inactive
                                        ? 'bg-secondary-subtle text-secondary'
                                        : 'bg-success-subtle text-success'
                                }`}
                            >
                                {inactive ? 'Inactief' : 'Dalende klok'}
                            </span>
                        </div>
                    ),
            },
            {
                key: 'naam',
                header: 'Product',
                className: 'text-nowrap',
                sortable: true,
            },
            {
                key: 'startprijs',
                header: 'Startprijs',
                className: 'text-nowrap text-end',
                sortable: true,
                comparator: (a, b, direction) =>
                    direction === 'asc'
                        ? a.startprijsValue - b.startprijsValue
                        : b.startprijsValue - a.startprijsValue,
            },
            {
                key: 'voorraad',
                header: 'Voorraad',
                className: 'text-nowrap text-end',
                sortable: true,
            },
        ],
        [getCurrentPrice, inactive],
    );

    const handleRowClick = useCallback(
        (row: VeilingProductRow) => {
            const product = veiling?.producten?.find(
                item => (item.veilingProductNr ?? '') === row.veilingProductNr,
            );
            setSelectedProduct(product ?? null);
        },
        [veiling],
    );

    const effectiveStatus = useMemo(() => {
        if (!veiling?.status) return undefined;
        if (inactive && !veiling.status.toLowerCase().includes('inactive')) {
            return 'Inactief';
        }
        return veiling.status ?? undefined;
    }, [inactive, veiling?.status]);

    const veilingNumber = veiling?.veilingNr ?? veilingId;

    return (
        <Modal
            title={
                <span>
                    Veiling <span className="text-muted">#{veilingNumber}</span>
                </span>
            }
            onClose={onClose}
            size="xl"
            fullscreenUntil="lg"
            maxWidthPx={1400}
        >
            {loading && <Loading />}

            {errorMessage && (
                <div className="alert alert-danger" role="alert">
                    {errorMessage}
                </div>
            )}

            {veiling && (
                <div className="row g-3">
                    <div className="col-md">
                        {rows.length ? (
                            <DataTable<VeilingProductRow>
                                rows={rows}
                                columns={columns}
                                caption="Klik een product voor details"
                                onRowClick={handleRowClick}
                                getRowKey={row => row.veilingProductNr || `${row.naam}-${row.startprijsValue}`}
                                defaultSortKey="naam"
                                defaultSortDir="asc"
                            />
                        ) : (
                            <Empty />
                        )}
                    </div>

                    <div className="col-md-5">
                        <article className="card shadow-sm border-0 border border-success-subtle">
                            <div className="card-body">
                                <h5 className="card-title d-flex flex-wrap align-items-center gap-2 mb-1 text-success">
                                    {selectedProduct?.naam || (
                                        <span className="text-muted">Geen product geselecteerd</span>
                                    )}
                                    <StatusBadge status={effectiveStatus} />
                                </h5>

                                <div className="text-muted mb-3">
                                    Veiling #{veilingNumber}
                                    {veiling.minimumprijs != null && (
                                        <> · min. {formatCurrency(veiling.minimumprijs)}</>
                                    )}
                                </div>

                                {selectedRow?.afbeeldingUrl && (
                                    <div className="mb-3 text-center">
                                        <img
                                            src={selectedRow.afbeeldingUrl}
                                            alt={selectedProduct?.naam ?? 'Product'}
                                            className="img-fluid rounded shadow-sm"
                                            style={{ maxHeight: 200 }}
                                        />
                                    </div>
                                )}

                                <ul className="list-group list-group-flush">
                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                        <span className="text-muted">Begintijd</span>
                                        <span>{formatDateTime(veiling.begintijd)}</span>
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                        <span className="text-muted">Eindtijd</span>
                                        <span>{formatDateTime(veiling.eindtijd)}</span>
                                    </li>
                                    {selectedProduct && (
                                        <>
                                            <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                <span className="text-muted">Startprijs</span>
                                                <strong>{formatCurrency(selectedProduct.startprijs ?? '')}</strong>
                                            </li>
                                            {selectedRow && (
                                                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                    <span className="text-muted">Huidige klokprijs</span>
                                                    <strong>{formatCurrency(getCurrentPrice(selectedRow))}</strong>
                                                </li>
                                            )}
                                            <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                <span className="text-muted">Voorraad</span>
                                                <span>{selectedProduct.voorraad ?? ''}</span>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </article>
                    </div>
                </div>
            )}
        </Modal>
    );
}
