import type { JSX } from "react";
import { useLiveStats } from "../hooks";
import { Section } from "../components/ui";

export function DashboardMetrics(): JSX.Element {
    const { stats, loading, error, lastUpdated } = useLiveStats();

    return (
        <Section title="Overzicht">
            {loading && <div className="text-muted">Statistieken laden…</div>}
            {error && <div className="alert alert-danger mb-0">{error}</div>}
            {stats && (
                <div className="row g-3">
                    <DashboardCard label="Gebruikers" value={stats.users} />
                    <DashboardCard label="Actieve veilingen" value={stats.activeAuctions} />
                    <DashboardCard label="Producten" value={stats.products} />
                    <DashboardCard label="Biedingen" value={stats.bids} />
                </div>
            )}
            {lastUpdated && <small className="text-muted">Bijgewerkt: {lastUpdated.toLocaleString()}</small>}
        </Section>
    );
}

function DashboardCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="col-12 col-md-3">
            <div className="border rounded-4 p-3 bg-body-secondary h-100">
                <div className="text-muted small">{label}</div>
                <div className="display-6">{value}</div>
            </div>
        </div>
    );
}
