import { useEffect, useMemo, useState, useCallback } from 'react';
import Modal from './Modal';
import DataTable, { type Column, type RowBase } from './DataTable';
import { useLiveData } from '../data/live';
import { Empty, Loading } from './components';

/* Helpers */

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'short',
    timeStyle: 'short',
});

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
});

const fmtDate = (d?: string | null) => {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return dateFormatter.format(date);
};

const fmtEur = (n?: number | string | null) => {
    if (n == null || n === '') return '';
    const raw =
        typeof n === 'string'
            // duizendtallen eruit, komma naar punt
            ? n.replace(/\./g, '').replace(',', '.')
            : n;
    const value = Number(raw);
    if (!Number.isFinite(value)) return '';
    return currencyFormatter.format(value);
};

const normalizeNumber = (value: number | string | null | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const n = Number(value.replace(/\./g, '').replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
};

const toErrorMessage = (err: unknown, fallback: string): string | null => {
    if (!err) return null;
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return fallback;
};

/* Types */

type ApiProduct = {
    veilingProductNr: number;
    naam: string | null;
    startprijs: number | string;
    voorraad: number | null;
    afbeeldingUrl?: string | null;
};

type ApiVeiling = {
    veilingNr: number;
    begintijd: string; // ISO datetime
    eindtijd: string; // ISO datetime
    status?: string | null;
    minimumprijs: number | string;
    producten?: ApiProduct[] | null;
};

type ProductRow = RowBase & {
    id: number | string;
    veilingProductNr: number | '';
    naam: string;
    startprijs: string; // geformatteerd
    startprijsValue: number; // numeriek
    voorraad: number | '';
    afbeeldingUrl?: string;
    imageOrClock?: null;
};

/* Status badge */

const StatusBadge = ({ status }: { status?: string | null }) => {
    if (!status) return null;
    const s = status.toLowerCase();
    let cls = 'bg-light text-body';
    if (s.includes('active')) cls = 'bg-success-subtle text-success';
    else if (s.includes('sold')) cls = 'bg-secondary-subtle text-secondary';
    else if (s.includes('inactive')) cls = 'bg-warning-subtle text-warning';
    return <span className={`badge ${cls}`}>{status}</span>;
};

/* Data ophalen */

function useVeilingProducts(veilingId: number) {
    const { data: veiling, error } = useLiveData<ApiVeiling>(
        `/api/Veiling/${veilingId}`,
        { refreshMs: 5000, revalidateOnFocus: true },
    );

    const rows: ProductRow[] = useMemo(
        () =>
            veiling?.producten?.map((p, index): ProductRow => {
                const startprijsValue = normalizeNumber(p.startprijs);
                const naam = (p.naam ?? '').trim();
                return {
                    id: p.veilingProductNr ?? index,
                    veilingProductNr: p.veilingProductNr ?? '',
                    naam,
                    startprijs: fmtEur(startprijsValue),
                    startprijsValue,
                    voorraad: p.voorraad ?? '',
                    afbeeldingUrl: p.afbeeldingUrl ?? undefined,
                    imageOrClock: null,
                };
            }) ?? [],
        [veiling],
    );

    return {
        veiling,
        rows,
        loading: !veiling && !error,
        errorMessage: toErrorMessage(error, 'Kon veiling niet ophalen.'),
    };
}

/* Lineaire prijs: startprijs bij begintijd, minprijs bij eindtijd */

function computeCurrentPrice(
    row: ProductRow,
    veiling: ApiVeiling,
    nowMs: number,
): number {
    const base = row.startprijsValue; // startprijs = max
    const min = normalizeNumber(veiling.minimumprijs); // minimumprijs = bodem

    if (base <= min) return min;

    const startTs = Date.parse(veiling.begintijd);
    const endTs = Date.parse(veiling.eindtijd);

    // Als tijden ongeldig zijn of eind <= begin → fallback
    if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) {
        return Math.max(min, base);
    }

    if (nowMs <= startTs) return base; // vóór begintijd: startprijs
    if (nowMs >= endTs) return min; // na eindtijd: minimumprijs

    // Tussen begin en eind → lineair dalend
    const progress = (nowMs - startTs) / (endTs - startTs); // 0–1
    const span = base - min;
    const raw = base - span * progress;
    const price = Number(raw.toFixed(2));

    return Math.min(base, Math.max(min, price)); // clamp
}

/* Status: inactief na eindtijd of status "inactive" */

function isVeilingInactive(
    veiling: ApiVeiling | null | undefined,
    nowMs: number,
): boolean {
    if (!veiling) return false;
    const s = (veiling.status ?? '').toLowerCase();
    if (s.includes('inactive')) return true;
    const endTs = Date.parse(veiling.eindtijd);
    return Number.isFinite(endTs) && nowMs >= endTs;
}

/* Hoofdcomponent */

export default function VeilingModal({
                                         veilingId,
                                         onClose,
                                     }: {
    veilingId: number;
    onClose: () => void;
}) {
    const { veiling, rows, loading, errorMessage } = useVeilingProducts(veilingId);

    // Centrale klok: elke seconde nieuwe "nu"-tijd → triggert re-render
    const [nowMs, setNowMs] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => {
            setNowMs(Date.now());
        }, 1000);
        return () => window.clearInterval(id);
    }, []);

    const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);

    // Eerste product standaard selecteren
    useEffect(() => {
        setSelectedProduct(veiling?.producten?.[0] ?? null);
    }, [veiling]);

    const selectedRow = useMemo(
        () =>
            selectedProduct
                ? rows.find(
                    r => r.veilingProductNr === (selectedProduct.veilingProductNr ?? ''),
                )
                : undefined,
        [rows, selectedProduct],
    );

    const titelVeilingNr = veiling?.veilingNr ?? veilingId;

    const getCurrentPrice = useCallback(
        (row: ProductRow) =>
            veiling ? computeCurrentPrice(row, veiling, nowMs) : row.startprijsValue,
        [veiling, nowMs],
    );

    const inactive = useMemo(
        () => (veiling ? isVeilingInactive(veiling, nowMs) : false),
        [veiling, nowMs],
    );

    const columns = useMemo<ReadonlyArray<Column<ProductRow>>>(
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
                render: (_val, row) =>
                    row.afbeeldingUrl ? (
                        <img
                            src={row.afbeeldingUrl}
                            alt={row.naam || 'Product'}
                            className="img-thumbnail rounded"
                            style={{ maxHeight: 56 }}
                        />
                    ) : (
                        <div className="d-flex flex-column align-items-center small">
                            <span className="fw-semibold">
                                {fmtEur(getCurrentPrice(row))}
                            </span>
                            <span
                                className={
                                    'badge rounded-pill mt-1 ' +
                                    (inactive
                                        ? 'bg-secondary-subtle text-secondary'
                                        : 'bg-success-subtle text-success')
                                }
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
        [getCurrentPrice, inactive],
    );

    const handleRowClick = useCallback(
        (r: ProductRow) => {
            const product = veiling?.producten?.find(
                p => (p.veilingProductNr ?? '') === r.veilingProductNr,
            );
            setSelectedProduct(product ?? null);
        },
        [veiling],
    );

    const effectieveStatus =
        inactive && veiling?.status && !veiling.status.toLowerCase().includes('inactive')
            ? 'Inactief'
            : veiling?.status ?? undefined;

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
            {loading && <Loading />}

            {errorMessage && (
                <div className="alert alert-danger" role="alert">
                    {errorMessage}
                </div>
            )}

            {veiling && (
                <div className="row g-3">
                    {/* Tabel */}
                    <div className="col-md">
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
                    <div className="col-md-5">
                        <article className="card shadow-sm border-0 border border-success-subtle">
                            <div className="card-body">
                                <h5 className="card-title d-flex flex-wrap align-items-center gap-2 mb-1 text-success">
                                    {selectedProduct?.naam || (
                                        <span className="text-muted">
                                            Geen product geselecteerd
                                        </span>
                                    )}
                                    <StatusBadge status={effectieveStatus} />
                                </h5>

                                <div className="text-muted mb-3">
                                    Veiling #{titelVeilingNr}
                                    {veiling.minimumprijs != null && (
                                        <> · min. {fmtEur(veiling.minimumprijs)}</>
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
                                            {selectedRow && (
                                                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                    <span className="text-muted">
                                                        Huidige klokprijs
                                                    </span>
                                                    <strong>
                                                        {fmtEur(getCurrentPrice(selectedRow))}
                                                    </strong>
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
