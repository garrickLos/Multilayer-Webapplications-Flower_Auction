import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "../../DataTable";
import { EmptyState, InlineAlert, LoadingPlaceholder, StatusBadge } from "../../components";
import { Modal } from "../../Modal";
import { getAuctionDetail } from "../../api";
import { subscribeAuction } from "../../live";
import { formatCurrency, formatDateTime, parseIsoDate } from "../../utils/formatting";
import { appConfig } from "../../config";
import {
    adaptAuction,
    splitProducts,
    statusBadgeVariant,
    statusLabel,
    type VeilingDetailDto,
    type VeilingProductRow,
    type VeilingRow,
} from "../../types";

export type AuctionModalProps = {
    readonly row: VeilingRow;
    readonly onClose: () => void;
};

/**
 * Presents a detailed overview of a veiling with live updates.
 *
 * @param props - Component properties containing the geselecteerde veiling en afsluit-actie.
 */
export function AuctionModal({ row, onClose }: AuctionModalProps): JSX.Element {
    const [detail, setDetail] = useState<VeilingDetailDto | null>(null);
    const [currentRow, setCurrentRow] = useState<VeilingRow>(row);
    const [currentPrice, setCurrentPrice] = useState<number>(row.maxPrice);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const subscriptionRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        setDetail(null);
        setCurrentRow(row);
        setCurrentPrice(row.maxPrice);
    }, [row]);

    const detailId = row.veilingNr ?? row.id;

    const fetchDetail = useCallback(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        getAuctionDetail(detailId, controller.signal)
            .then((data) => {
                setDetail(data);
                setCurrentRow(adaptAuction(data));
            })
            .catch((err) => {
                if ((err as { name?: string }).name === "AbortError") {
                    return;
                }
                setError((err as { message?: string }).message ?? "Er ging iets mis.");
            })
            .finally(() => {
                setLoading(false);
            });
        return () => controller.abort();
    }, [detailId]);

    useEffect(() => fetchDetail(), [fetchDetail]);

    useEffect(() => {
        subscriptionRef.current?.();
        subscriptionRef.current = subscribeAuction(row.veilingNr ?? row.id, (update) => {
            setCurrentRow((previous) => ({ ...previous, ...update }));
        });
        return () => {
            subscriptionRef.current?.();
            subscriptionRef.current = null;
        };
    }, [row.id, row.veilingNr]);

    useEffect(() => {
        const updatePrice = () => {
            if (currentRow.status !== "active") {
                setCurrentPrice(currentRow.minPrice);
                return;
            }
            const startMs = parseIsoDate(currentRow.startIso ?? null) ?? Date.now();
            const endMs = parseIsoDate(currentRow.endIso ?? null) ?? Date.now();
            if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
                setCurrentPrice(currentRow.maxPrice);
                return;
            }
            const now = Date.now();
            if (now <= startMs) {
                setCurrentPrice(currentRow.maxPrice);
                return;
            }
            if (now >= endMs) {
                setCurrentPrice(currentRow.minPrice);
                return;
            }
            const progress = (now - startMs) / (endMs - startMs);
            const diff = currentRow.maxPrice - currentRow.minPrice;
            const price = currentRow.maxPrice - diff * progress;
            setCurrentPrice(Number(price.toFixed(2)));
        };
        updatePrice();
        const timer = window.setInterval(updatePrice, 1000);
        return () => window.clearInterval(timer);
    }, [currentRow.endIso, currentRow.maxPrice, currentRow.minPrice, currentRow.startIso, currentRow.status]);

    const { active, inactive } = useMemo(() => {
        if (!detail) {
            return { active: [] as readonly VeilingProductRow[], inactive: [] as readonly VeilingProductRow[] };
        }
        return splitProducts(detail);
    }, [detail]);

    const progressPercent = useMemo(() => {
        if (currentRow.maxPrice <= currentRow.minPrice) {
            return 0;
        }
        const ratio = (currentPrice - currentRow.minPrice) / (currentRow.maxPrice - currentRow.minPrice);
        return Math.max(0, Math.min(100, Math.round(ratio * 100)));
    }, [currentPrice, currentRow.maxPrice, currentRow.minPrice]);

    const clockStatic = currentRow.maxPrice === currentRow.minPrice;

    const productColumns = useMemo(
        () => createProductColumns(appConfig.ui.productThumbnailSize),
        [],
    );

    const handleClose = () => {
        subscriptionRef.current?.();
        onClose();
    };

    return (
        <Modal
            title={`Veiling ${currentRow.titel}`}
            onClose={handleClose}
            size="xl"
            footer={
                <button type="button" className="btn btn-success" onClick={handleClose}>
                    Sluiten
                </button>
            }
        >
            {error && <InlineAlert>{error}</InlineAlert>}
            {loading && !detail ? (
                <LoadingPlaceholder />
            ) : (
                <div className="d-flex flex-column gap-3">
                    <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-start justify-content-between">
                        <div>
                            <h3 className="h4 fw-semibold mb-1 text-success">{currentRow.titel}</h3>
                            <p className="text-muted mb-0 small">
                                {formatDateTime(currentRow.startIso)} • {formatDateTime(currentRow.endIso)}
                            </p>
                        </div>
                        <span className={`badge rounded-pill ${statusBadgeVariant(currentRow.status)}`}>
                            {statusLabel(currentRow.status)}
                        </span>
                    </div>
                    <div className="card border border-success-subtle shadow-sm rounded-4">
                        <div className="card-body">
                            <p className="text-success-emphasis text-uppercase small mb-1">Klokprijs</p>
                            <div className="display-5 fw-semibold text-success" aria-live="polite">
                                {formatCurrency(currentPrice)}
                            </div>
                            <p className="text-muted mb-2">
                                Van {formatCurrency(currentRow.maxPrice)} naar {formatCurrency(currentRow.minPrice)}
                            </p>
                            {clockStatic ? (
                                <div className="text-muted small">Klok staat stil</div>
                            ) : (
                                <div className="progress bg-success-subtle" aria-hidden="true">
                                    <div className="progress-bar bg-success" style={{ width: `${progressPercent}%` }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <section className="d-flex flex-column gap-2">
                        <h4 className="h6 text-uppercase text-muted mb-0">Actieve producten</h4>
                        {active.length === 0 ? (
                            <EmptyState message="Geen actieve producten." />
                        ) : (
                            <DataTable
                                columns={productColumns}
                                rows={active}
                                getRowKey={(item) => String(item.id)}
                                totalResults={active.length}
                            />
                        )}
                    </section>
                    <section className="d-flex flex-column gap-2">
                        <h4 className="h6 text-uppercase text-muted mb-0">Inactief of geannuleerd</h4>
                        {inactive.length === 0 ? (
                            <EmptyState message="Geen inactieve producten." />
                        ) : (
                            <DataTable
                                columns={productColumns}
                                rows={inactive}
                                getRowKey={(item) => `inactive-${item.id}`}
                                totalResults={inactive.length}
                            />
                        )}
                    </section>
                </div>
            )}
        </Modal>
    );
}

function createProductColumns(thumbnailSize: number) {
    return [
        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
        {
            key: "naam",
            header: "Product",
            sortable: true,
            render: (row: VeilingProductRow) => (
                <div className="d-flex align-items-center gap-3">
                    {row.image ? (
                        <img
                            src={row.image}
                            alt=""
                            width={thumbnailSize}
                            height={thumbnailSize}
                            className="rounded-3 border border-success-subtle object-fit-cover flex-shrink-0"
                        />
                    ) : (
                        <span className="badge bg-success-subtle text-success-emphasis">Geen afbeelding</span>
                    )}
                    <div>
                        <div className="fw-semibold text-break">{row.naam}</div>
                        <div className="text-muted small">{row.categorie || "Categorie onbekend"}</div>
                    </div>
                </div>
            ),
            getValue: (row: VeilingProductRow) => row.naam,
        },
        {
            key: "voorraad",
            header: "Voorraad (bloemen)",
            sortable: true,
            render: (row: VeilingProductRow) => (row.voorraad != null ? row.voorraad : "—"),
            getValue: (row: VeilingProductRow) => row.voorraad ?? "",
        },
        {
            key: "fust",
            header: "Fust",
            sortable: true,
            render: (row: VeilingProductRow) => (row.fust != null ? row.fust : "—"),
            getValue: (row: VeilingProductRow) => row.fust ?? "",
        },
        {
            key: "piecesPerBundle",
            header: "Stuks/bundel",
            sortable: true,
            render: (row: VeilingProductRow) => (row.piecesPerBundle != null ? row.piecesPerBundle : "—"),
            getValue: (row: VeilingProductRow) => row.piecesPerBundle ?? "",
        },
        {
            key: "minPrice",
            header: "Min. prijs",
            sortable: true,
            render: (row: VeilingProductRow) => formatCurrency(row.minPrice),
            getValue: (row: VeilingProductRow) => row.minPrice,
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row: VeilingProductRow) => <StatusBadge status={row.status} />,
            getValue: (row: VeilingProductRow) => row.status,
        },
    ] as const;
}
