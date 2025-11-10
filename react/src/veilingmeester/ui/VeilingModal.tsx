import { useEffect, useMemo, useState, useCallback } from 'react';
import Modal from './Modal';
import DataTable, { type Column, type RowBase } from './DataTable';
import { useLiveData } from '../data/live';
import { Empty, Loading } from './components';

/* Helpers: datum & euro in NL-formaat */

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'short',
    timeStyle: 'short',
});
const currencyFormatter = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
});

const fmtDate = (d?: string | null) => (d ? dateFormatter.format(new Date(d)) : '');
const fmtEur = (n?: number | string | null) => {
    const value = typeof n === 'string' ? Number(n) : n;
    return value != null && !Number.isNaN(value) ? currencyFormatter.format(value) : '';
};

const toErrorMessage = (err: unknown, fallback: string): string | null => {
    if (!err) return null;
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return fallback;
};

/* API-shape van /api/Veiling/{id} (VeilingDto) */

type ApiProduct = {
    veilingProductNr?: number;
    naam?: string;
    startprijs?: number;
    voorraad?: number;
};

type ApiVeiling = {
    veilingNr?: number;
    begintijd?: string;
    eindtijd?: string;
    status?: string;
    minimumprijs?: number;
    producten?: ApiProduct[];
};

/* Rij voor DataTable */

type ProductRow = RowBase & {
    veilingProductNr: number | '';
    naam: string;
    startprijs: string;
    startprijsValue: number;
    voorraad: number | '';
};

/* Status badge in detailpaneel */

type StatusBadgeProps = { status?: string | null };

const StatusBadge = ({ status }: StatusBadgeProps) => {
    if (!status) return null;
    const s = status.toLowerCase();
    const cls = s.includes('active')
        ? 'bg-success-subtle text-success'
        : s.includes('sold')
            ? 'bg-secondary-subtle text-secondary'
            : s.includes('inactive')
                ? 'bg-warning-subtle text-warning'
                : 'bg-light text-body';

    return <span className={`badge ${cls}`}>{status}</span>;
};

/* Haal veiling + producten op en map naar tabelrijen */

function useVeilingProducts(veilingId: number) {
    const { data: veiling, error } = useLiveData<ApiVeiling>(`/api/Veiling/${veilingId}`, {
        refreshMs: 5_000,
        revalidateOnFocus: true,
    });

    const rows: ProductRow[] = useMemo(() => {
        const producten = Array.isArray(veiling?.producten) ? veiling!.producten! : [];
        return producten.map(p => {
            const raw = p.startprijs;
            const numeric = typeof raw === 'number' ? raw : Number(raw ?? 0);
            return {
                veilingProductNr: p.veilingProductNr ?? '',
                naam: p.naam?.trim() ?? '',
                startprijs: fmtEur(numeric),
                startprijsValue: Number.isFinite(numeric) ? numeric : 0,
                voorraad: p.voorraad ?? '',
            };
        });
    }, [veiling]);

    const loading = !veiling && !error;
    const errorMessage = toErrorMessage(error, 'Kon veiling niet ophalen.');

    return { veiling, rows, loading, errorMessage };
}

/** Modal met producten van één veiling. */
export default function VeilingModal({
                                         veilingId,
                                         onClose,
                                     }: {
    veilingId: number;
    onClose: () => void;
}) {
    const { veiling, rows, loading, errorMessage } = useVeilingProducts(veilingId);

    // Geselecteerde product (ruwe API-data)
    const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);

    // Bij nieuwe veiling standaard het eerste product selecteren
    useEffect(() => {
        const first = veiling?.producten && veiling.producten.length ? veiling.producten[0] : null;
        setSelectedProduct(first ?? null);
    }, [veiling]);

    // Kolommen voor producten-tabel
    const columns = useMemo<ReadonlyArray<Column<ProductRow>>>(
        () => [
            {
                key: 'veilingProductNr',
                header: '#',
                width: 96,
                className: 'text-nowrap',
                sortable: true,
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
                comparator: (a, b, dir) =>
                    dir === 'asc'
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
        [],
    );

    // Klik op een rij → bijbehorend product selecteren
    const handleRowClick = useCallback(
        (r: ProductRow) => {
            const product = veiling?.producten?.find(
                p => (p.veilingProductNr ?? '') === r.veilingProductNr,
            );
            setSelectedProduct(product ?? null);
        },
        [veiling],
    );

    const titelVeilingNr = veiling?.veilingNr ?? veilingId;

    return (
        <Modal
            title={
                <span>
                    Veiling <span className="text-muted">#{titelVeilingNr}</span>
                </span>
            }
            onClose={onClose}
            size="xl"
            fullscreenUntil="lg"
            maxWidthPx={1400}
        >
            {/* Laden */}
            {loading && <Loading />}

            {/* Foutmelding */}
            {errorMessage && (
                <div className="alert alert-danger" role="alert">
                    {errorMessage}
                </div>
            )}

            {/* Inhoud zodra data beschikbaar is */}
            {veiling && (
                <div className="row g-3">
                    {/* Producten-tabel */}
                    <div className="col-lg-8 col-md-7">
                        {rows.length ? (
                            <DataTable<ProductRow>
                                rows={rows}
                                columns={columns}
                                caption="Klik een product voor details"
                                onRowClick={handleRowClick}
                                getRowKey={r =>
                                    r.veilingProductNr || `${r.naam}-${r.startprijsValue}`
                                }
                                defaultSortKey="naam"
                                defaultSortDir="asc"
                            />
                        ) : (
                            <Empty />
                        )}
                    </div>

                    {/* Detailpaneel */}
                    <div className="col-lg-4 col-md-5">
                        <article className="card shadow-sm border-0 border border-success-subtle">
                            <div className="card-body">
                                <h5 className="card-title d-flex flex-wrap align-items-center gap-2 mb-1 text-success">
                                    {selectedProduct?.naam || (
                                        <span className="text-muted">Geen product geselecteerd</span>
                                    )}
                                    <StatusBadge status={veiling.status} />
                                </h5>

                                <div className="text-muted mb-3">
                                    Veiling #{titelVeilingNr}
                                    {veiling.minimumprijs != null && (
                                        <>
                                            {' · min. '}
                                            {fmtEur(veiling.minimumprijs)}
                                        </>
                                    )}
                                </div>

                                <ul className="list-group list-group-flush">
                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                        <span className="text-muted">Begintijd</span>
                                        <span>{fmtDate(veiling.begintijd)}</span>
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                        <span className="text-muted">Eindtijd</span>
                                        <span>{fmtDate(veiling.eindtijd)}</span>
                                    </li>
                                    {selectedProduct && (
                                        <>
                                            <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                <span className="text-muted">Startprijs</span>
                                                <strong>{fmtEur(selectedProduct.startprijs)}</strong>
                                            </li>
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
