import { useMemo, type JSX } from "react";
import { useLiveStats } from "../hooks";
import { formatDateTime } from "../utils";

export function DashboardMetrics(): JSX.Element {
    const { stats, loading, error, lastUpdated } = useLiveStats();

    const metrics = useMemo(
        () => [
            { id: "users", label: "Gebruikers", value: stats?.users ?? 0, helper: "Totaal" },
            { id: "auctions", label: "Actieve veilingen", value: stats?.activeAuctions ?? 0, helper: "Live" },
            { id: "products", label: "Producten", value: stats?.products ?? 0, helper: "Beschikbaar" },
        ],
        [stats],
    );

    const refreshedAt = useMemo(() => formatDateTime(lastUpdated?.toISOString()), [lastUpdated]);

    return (
        <section className="card border-0 shadow-sm rounded-4 mb-4" aria-label="Dashboard overzicht">
            <div className="card-body p-4 d-flex flex-column gap-4">
                <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                    <div>
                        <p className="text-uppercase text-success-emphasis small fw-semibold mb-1">Live overzicht</p>
                        <h2 className="h4 fw-semibold mb-1 text-success">Realtime prestaties</h2>
                        <p className="text-muted small mb-0">Laatst bijgewerkt: {refreshedAt}</p>
                    </div>
                </div>

                <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
                    {metrics.map((metric) => (
                        <article key={metric.id} className="col">
                            <div className="h-100 p-4 rounded-4 border border-success-subtle bg-white shadow-sm">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <p className="text-uppercase text-muted small mb-1">{metric.label}</p>
                                        <div className="fs-2 fw-semibold text-success">
                                            {loading ? "…" : metric.value}
                                            {error && <span className="text-danger ms-2" aria-label="fout">!</span>}
                                        </div>
                                    </div>
                                    <span className="badge text-success-emphasis bg-success-subtle rounded-pill">{metric.helper}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
