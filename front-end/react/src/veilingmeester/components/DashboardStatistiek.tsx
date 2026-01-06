import type { JSX } from "react";
import { useLiveStats } from "../hooks";
import { formatDateTime } from "../helpers";

export function DashboardStatistiek(): JSX.Element {
    const { stats, loading, error, lastUpdated } = useLiveStats();

    // Fallbacks zodat de UI nooit "undefined" toont
    const users = stats?.users ?? 0;
    const activeAuctions = stats?.activeAuctions ?? 0;
    const products = stats?.products ?? 0;
    const bids = stats?.bids ?? 0;

    // Laatst bijgewerkt (veilig bij null)
    const refreshedAt = formatDateTime(lastUpdated ?? null);

    // Definitie van de dashboard-tegels
    const metrics = [
        { id: "users", label: "Gebruikers", value: users, helper: "Totaal" },
        { id: "auctions", label: "Actieve veilingen", value: activeAuctions, helper: "Live" },
        { id: "products", label: "Producten", value: products, helper: "Beschikbaar" },
        { id: "bids", label: "Biedingen", value: bids, helper: "Laatste 24u" },
    ] as const;

    return (
        <section className="card border-0 shadow-sm rounded-4 mb-4" aria-label="Dashboard overzicht">
            <div className="card-body p-4 d-flex flex-column gap-4">
                {/* Header */}
                <header className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div>
                        <p className="text-uppercase text-success-emphasis small fw-semibold mb-1">
                            Live overzicht
                        </p>
                        <h2 className="h4 fw-semibold mb-1 text-success">
                            Realtime prestaties
                        </h2>
                        <p className="text-muted small mb-0">
                            Laatst bijgewerkt: {refreshedAt}
                        </p>
                    </div>

                    {/* Foutmelding */}
                    {error && (
                        <div className="alert alert-danger py-2 mb-0">
                            Statistieken konden niet worden geladen.
                        </div>
                    )}
                </header>

                {/* Metrics */}
                <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3">
                    {metrics.map((metric) => (
                        <article key={metric.id} className="col">
                            <div className="h-100 p-4 rounded-4 border border-success-subtle bg-white shadow-sm">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-uppercase text-muted small mb-1">
                                            {metric.label}
                                        </p>

                                        {/* Waarde of placeholder */}
                                        <div className="fs-2 fw-semibold text-success" aria-live="polite">
                                            {loading ? "—" : metric.value}
                                        </div>
                                    </div>

                                    <span className="badge text-success-emphasis bg-success-subtle rounded-pill">
                                        {metric.helper}
                                    </span>
                                </div>

                                {loading && (
                                    <p className="text-muted small mt-2 mb-0">
                                        Bezig met bijwerken…
                                    </p>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
