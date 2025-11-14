import { useMemo, type JSX } from "react";
import { InlineAlert, LoadingPlaceholder } from "../components/ui.tsx";
import { useDashboardMetrics } from "../hooks";

const updatedFormatter = new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
});

/**
 * Card-based KPI overview for the veilingmeester dashboard.
 */
export function DashboardMetrics(): JSX.Element {
    const { metrics, loading, refreshing, error, lastUpdated, refresh } = useDashboardMetrics();

    const lastUpdatedLabel = useMemo(
        () => (lastUpdated ? updatedFormatter.format(lastUpdated) : "Nog niet geladen"),
        [lastUpdated],
    );

    return (
        <section className="card border-0 shadow-sm rounded-4 mb-4" aria-label="Dashboard overzicht">
            <div className="card-body p-4 d-flex flex-column gap-4">
                <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                    <div>
                        <p className="text-uppercase text-success-emphasis small fw-semibold mb-1">Live overzicht</p>
                        <h2 className="h4 fw-semibold mb-1 text-success">Realtime prestaties</h2>
                        <p className="text-muted small mb-0">Laatst bijgewerkt: {lastUpdatedLabel}</p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        {refreshing && (
                            <span
                                className="spinner-border spinner-border-sm text-success"
                                role="status"
                                aria-label="Bezig met vernieuwen"
                            />
                        )}
                        <button type="button" className="btn btn-success btn-sm px-4" onClick={refresh} disabled={loading}>
                            Dashboard bijwerken
                        </button>
                    </div>
                </div>

                {error && <InlineAlert>{error}</InlineAlert>}

                {loading && !metrics.length ? (
                    <div className="py-4">
                        <LoadingPlaceholder />
                    </div>
                ) : (
                    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3">
                        {metrics.map((metric) => (
                            <article key={metric.id} className="col">
                                <div className="h-100 p-4 rounded-4 border border-success-subtle bg-white shadow-sm">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <p className="text-uppercase text-muted small mb-1">{metric.label}</p>
                                            <div className="fs-2 fw-semibold text-success">{metric.value}</div>
                                        </div>
                                        <span className="badge text-success-emphasis bg-success-subtle rounded-pill">{metric.helper}</span>
                                    </div>

                                    {metric.accent && <p className="text-muted small mb-3">{metric.accent}</p>}

                                    {metric.progress != null && (
                                        <div
                                            className="progress bg-success-subtle"
                                            role="progressbar"
                                            aria-valuenow={metric.progress}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        >
                                            <div className="progress-bar bg-success" style={{ width: `${metric.progress}%` }} />
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
