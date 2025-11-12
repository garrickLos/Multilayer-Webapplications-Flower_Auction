import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Modal } from "./Modal";
import { getAuctionDetail } from "./api";
import type { ApiError } from "./api";
import { InlineAlert, Loading } from "./components";
import { createClockState, formatCurrency, mapAuctionDtoToRow, splitProducts, type AuctionDetailDto, type VeilingProductRow } from "./types";

const CLOCK_INTERVAL = 1000;

type Props = {
    veilingNr: number;
    onClose: () => void;
};

export function VeilingModal({ veilingNr, onClose }: Props): ReactElement {
    const [detail, setDetail] = useState<AuctionDetailDto | null>(null);
    const [error, setError] = useState<ApiError | null>(null);
    const [loading, setLoading] = useState(false);
    const [clock, setClock] = useState(() => ({ current: 0, start: 0, end: 0, running: false }));

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        void getAuctionDetail(veilingNr)
            .then((data) => {
                if (!active) return;
                setDetail(data);
                const state = createClockState(data);
                setClock({ current: state.startPrice, start: state.startPrice, end: state.endPrice, running: state.status === "active" });
            })
            .catch((err: unknown) => {
                if (!active) return;
                const apiError = (err && typeof err === "object" && "status" in err)
                    ? (err as ApiError)
                    : { status: 0, message: String(err) };
                setError({ status: apiError.status, message: apiError.message || "Er ging iets mis." });
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [veilingNr]);

    useEffect(() => {
        if (!detail) return;
        const state = createClockState(detail);
        const startTime = detail.begintijd ? new Date(detail.begintijd) : undefined;
        const endTime = detail.eindtijd ? new Date(detail.eindtijd) : undefined;
        const isActive = state.status === "active" && startTime && endTime && endTime > startTime;

        const updatePrice = () => {
            if (!startTime || !endTime) {
                setClock((prev) => ({ ...prev, current: state.endPrice, running: false }));
                return;
            }
            const now = new Date();
            if (now >= endTime || state.status !== "active") {
                setClock({ current: state.endPrice, start: state.startPrice, end: state.endPrice, running: false });
                return;
            }
            const totalMs = endTime.getTime() - startTime.getTime();
            const elapsedMs = Math.min(Math.max(now.getTime() - startTime.getTime(), 0), totalMs);
            const ratio = totalMs > 0 ? elapsedMs / totalMs : 1;
            const price = state.startPrice - (state.startPrice - state.endPrice) * ratio;
            setClock({ current: Math.max(state.endPrice, price), start: state.startPrice, end: state.endPrice, running: true });
        };

        updatePrice();
        if (!isActive) return;
        const timer = window.setInterval(updatePrice, CLOCK_INTERVAL);
        return () => window.clearInterval(timer);
    }, [detail]);

    const viewModel = detail ? mapAuctionDtoToRow(detail) : null;
    const { activeProducts, inactiveProducts } = useMemo(() => {
        if (!detail) return { activeProducts: [] as VeilingProductRow[], inactiveProducts: [] as VeilingProductRow[] };
        const split = splitProducts(detail);
        return { activeProducts: split.active, inactiveProducts: split.inactive };
    }, [detail]);

    return (
        <Modal title={`Veiling ${veilingNr}`} onClose={onClose} size="lg" ariaDescription={error ? "veiling-error" : undefined}>
            {loading && <Loading text="Veiling laden…" />}
            {!loading && error && (
                <InlineAlert id="veiling-error">
                    {error.message || "Er ging iets mis. Probeer het later opnieuw."}
                </InlineAlert>
            )}
            {!loading && detail && viewModel && (
                <div className="d-flex flex-column gap-4" aria-live="polite">
                    <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">
                        <div>
                            <h3 className="h5 mb-1">{viewModel.titel}</h3>
                            <p className="text-muted mb-0">
                                Start: {viewModel.startLabel} · Eind: {viewModel.endLabel}
                            </p>
                        </div>
                        <span className={`badge ${viewModel.statusVariant}`}>{viewModel.statusLabel}</span>
                    </div>
                    <div className="bg-body-secondary rounded-3 p-3" aria-live="polite">
                        <div className="text-uppercase small text-secondary">Klokprijs</div>
                        <div className="display-5 fw-bold">
                            {formatCurrency(clock.current)}
                        </div>
                        <div className="text-muted small">
                            Van {formatCurrency(clock.start)} naar {formatCurrency(clock.end)}
                        </div>
                        <div className="text-muted small" aria-live="polite">
                            {clock.running ? "Klok loopt" : "Klok staat stil"}
                        </div>
                    </div>
                    <section>
                        <header className="d-flex justify-content-between align-items-center mb-2">
                            <h4 className="h6 text-uppercase text-secondary mb-0">Actieve producten</h4>
                            <span className="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle">
                                {activeProducts.length}
                            </span>
                        </header>
                        {activeProducts.length === 0 && (
                            <p className="text-muted small mb-0">Geen actieve producten in deze veiling.</p>
                        )}
                        <div className="row g-3">
                            {activeProducts.map((product) => (
                                <article key={product.id} className="col-12 col-md-6">
                                    <div className="border rounded-3 p-3 h-100">
                                        <h5 className="h6 mb-1">{product.naam}</h5>
                                        <p className="text-muted small mb-2">
                                            Geplaatst: {product.geplaatstLabel} · Voorraad: {product.voorraad} · Fust: {product.fust}
                                        </p>
                                        <p className="mb-1">
                                            <span className="badge bg-success-subtle text-success-emphasis border-success-subtle me-2">
                                                Min {product.minLabel}
                                            </span>
                                            <span className="badge bg-info-subtle text-info-emphasis border-info-subtle">
                                                Max {product.maxLabel}
                                            </span>
                                        </p>
                                        <p className="text-muted small mb-0">
                                            {product.piecesPerBundle} stuks per bundel
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                    <section>
                        <header className="d-flex justify-content-between align-items-center mb-2">
                            <h4 className="h6 text-uppercase text-secondary mb-0">Inactieve of geannuleerde producten</h4>
                            <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">
                                {inactiveProducts.length}
                            </span>
                        </header>
                        {inactiveProducts.length === 0 && (
                            <p className="text-muted small mb-0">Geen inactieve producten.</p>
                        )}
                        <div className="row g-3">
                            {inactiveProducts.map((product) => (
                                <article key={product.id} className="col-12 col-md-6">
                                    <div className="border rounded-3 p-3 h-100 bg-light">
                                        <h5 className="h6 mb-1">{product.naam}</h5>
                                        <p className="text-muted small mb-2">
                                            Geplaatst: {product.geplaatstLabel} · Voorraad: {product.voorraad} · Fust: {product.fust}
                                        </p>
                                        <span className={`badge ${product.statusVariant}`}>{product.statusLabel}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </Modal>
    );
}
