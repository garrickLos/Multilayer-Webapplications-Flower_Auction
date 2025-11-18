import { lazy, Suspense, useEffect, useState } from "react";
import { DashboardMetrics } from "./features/dashboard";
import { InlineAlert, LoadingPlaceholder, ErrorBoundary } from "./components/ui.tsx";
import { useOffline } from "./hooks";
import type { UserRow, VeilingRow } from "./types";
import { cx } from "./utils";

const UsersTab = lazy(async () => import("./features/users").then((m) => ({ default: m.UsersTab })));
const AuctionsTab = lazy(async () => import("./features/auctions").then((m) => ({ default: m.AuctionsTab })));
const BidsModal = lazy(async () => import("./features/users").then((m) => ({ default: m.BidsModal })));
const ProductsModal = lazy(async () => import("./features/products").then((m) => ({ default: m.ProductsModal })));
const AuctionModal = lazy(async () => import("./features/auctions").then((m) => ({ default: m.AuctionModal })));

type TabKey = "users" | "auctions";

const readInitialTab = (): TabKey => {
    if (typeof window === "undefined") return "users";
    const value = new URLSearchParams(window.location.search).get("vm_tab");
    return value === "veilingen" ? "auctions" : "users";
};

const updateTabUrl = (tab: TabKey) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("vm_tab", tab === "auctions" ? "veilingen" : "gebruikers");
    window.history.replaceState({}, "", url.toString());
};

export function Veilingmeester() {
    const offline = useOffline();
    const [activeTab, setActiveTab] = useState<TabKey>(() => readInitialTab());
    const [selectedBidUser, setSelectedBidUser] = useState<UserRow | null>(null);
    const [selectedGrower, setSelectedGrower] = useState<UserRow | null>(null);
    const [selectedAuction, setSelectedAuction] = useState<VeilingRow | null>(null);

    useEffect(() => updateTabUrl(activeTab), [activeTab]);

    const tabs: { key: TabKey; label: string; render: () => JSX.Element }[] = [
        {
            key: "users",
            label: "Gebruikers",
            render: () => (
                <UsersTab onSelectBidUser={setSelectedBidUser} onSelectGrower={setSelectedGrower} />
            ),
        },
        {
            key: "auctions",
            label: "Veilingen",
            render: () => <AuctionsTab onSelectAuction={setSelectedAuction} />,
        },
    ];

    return (
        <div className="bg-body-tertiary min-vh-100">
            <div className="container py-4 py-lg-5 d-flex flex-column gap-4">
                <nav className="navbar navbar-expand-lg bg-white rounded-4 shadow-sm border border-success-subtle px-4" aria-label="Hoofdnavigatie veilingmeester">
                    <span className="navbar-brand fw-semibold text-success">Veilingmeester</span>
                    <div className="ms-auto text-muted small">Realtime beheer voor veilingen en gebruikers</div>
                </nav>

                <header className="bg-white border border-success-subtle rounded-4 shadow-sm p-4">
                    <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                        <div>
                            <p className="text-uppercase text-success small fw-semibold mb-1">Dashboard</p>
                            <h1 className="h3 fw-bold mb-2 text-success-emphasis">Overzicht veilingactiviteiten</h1>
                            <p className="text-muted mb-0">Volg biedingen, producten en live klokken met één centraal beheerscherm.</p>
                        </div>
                        <span className="badge text-success-emphasis bg-success-subtle rounded-pill px-3 py-2 shadow-sm">
                            Vertrouwde gegevens in realtime
                        </span>
                    </div>
                </header>

                {offline && (
                    <InlineAlert variant="warning">Je bent offline. Gegevens verversen zodra de verbinding terug is.</InlineAlert>
                )}

                <DashboardMetrics />

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
                        {activeTab === tab.key && (
                            <ErrorBoundary resetKey={tab.key}>
                                <Suspense fallback={<LoadingPlaceholder />}>{tab.render()}</Suspense>
                            </ErrorBoundary>
                        )}
                    </section>
                ))}

                <Suspense fallback={null}>
                    {selectedBidUser && <BidsModal user={selectedBidUser} onClose={() => setSelectedBidUser(null)} />}
                    {selectedGrower && <ProductsModal user={selectedGrower} onClose={() => setSelectedGrower(null)} />}
                    {selectedAuction && <AuctionModal row={selectedAuction} onClose={() => setSelectedAuction(null)} />}
                </Suspense>
            </div>
        </div>
    );
}
