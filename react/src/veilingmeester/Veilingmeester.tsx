import { useState, type JSX } from "react";
import { DashboardMetrics } from "./features/dashboard";
import { AuctionsTab } from "./features/auctions";
import { ProductsTab } from "./features/products";
import { UsersTab } from "./features/users";
import { CategoriesTab } from "./features/categories";
import { BidsTab } from "./features/bids";
import { useOffline } from "./hooks";
import { cx } from "./utils";

const tabs = [
    { key: "dashboard", label: "Dashboard", render: () => <DashboardMetrics /> },
    { key: "auctions", label: "Veilingen", render: () => <AuctionsTab /> },
    { key: "products", label: "Producten", render: () => <ProductsTab /> },
    { key: "categories", label: "Categorieën", render: () => <CategoriesTab /> },
    { key: "users", label: "Gebruikers", render: () => <UsersTab /> },
    { key: "bids", label: "Biedingen", render: () => <BidsTab /> },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function Veilingmeester(): JSX.Element {
    const offline = useOffline();
    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

    return (
        <div className="bg-body-tertiary min-vh-100">
            <div className="container py-4 py-lg-5 d-flex flex-column gap-4">
                <nav className="navbar navbar-expand-lg bg-white rounded-4 shadow-sm border border-success-subtle px-4" aria-label="Hoofdnavigatie veilingmeester">
                    <span className="navbar-brand fw-semibold text-success">Veilingmeester</span>
                    <div className="ms-auto text-muted small">Beheer veilingen, producten, categorieën en gebruikers</div>
                </nav>

                {offline && (
                    <div className="alert alert-warning border-0 rounded-4 shadow-sm mb-0" role="status">
                        Je bent offline. Gegevens worden ververst zodra de verbinding terug is.
                    </div>
                )}

                <section className="card border-0 shadow-sm rounded-4" aria-label="Navigatie tabs">
                    <div className="card-body p-4 d-flex flex-column gap-3">
                        <div className="d-flex flex-wrap justify-content-center gap-2" role="tablist" aria-label="Veiling tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    className={cx(
                                        "btn rounded-pill px-4 fw-semibold shadow-sm",
                                        activeTab === tab.key
                                            ? "btn-success text-white"
                                            : "btn-outline-success text-success-emphasis bg-white border-success-subtle",
                                    )}
                                    role="tab"
                                    aria-selected={activeTab === tab.key}
                                    aria-controls={`tab-${tab.key}`}
                                    id={`tab-${tab.key}-tab`}
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {tabs.map((tab) => (
                    <section
                        key={tab.key}
                        id={`tab-${tab.key}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${tab.key}-tab`}
                        hidden={activeTab !== tab.key}
                        className="d-flex flex-column gap-3"
                    >
                        {activeTab === tab.key && tab.render()}
                    </section>
                ))}
            </div>
        </div>
    );
}
