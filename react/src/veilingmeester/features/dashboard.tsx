import { useMemo, type JSX } from "react";
import { formatDateTime } from "../utils";
import type { Auction, Bid, Product, User } from "../types";

// Dashboard cards based on in-memory state.
type DashboardMetricsProps = {
    readonly users: readonly User[];
    readonly auctions: readonly Auction[];
    readonly products: readonly Product[];
    readonly bids: readonly Bid[];
};

export function DashboardMetrics({ users, auctions, products, bids }: DashboardMetricsProps): JSX.Element {
    const metrics = useMemo(
        () => [
            { id: "users", label: "Gebruikers", value: users.length, helper: "Totaal" },
            {
                id: "auctions",
                label: "Actieve veilingen",
                value: auctions.filter((auction) => auction.status === "active").length,
                helper: "Live",
            },
            { id: "products", label: "Producten", value: products.length, helper: "Beschikbaar" },
            { id: "bids", label: "Biedingen", value: bids.length, helper: "Laatste 24u" },
        ],
        [auctions, bids.length, products.length, users.length],
    );

    const refreshedAt = useMemo(() => formatDateTime(new Date()), []);

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
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
