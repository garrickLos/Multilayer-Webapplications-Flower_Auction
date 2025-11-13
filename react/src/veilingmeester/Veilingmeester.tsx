import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ErrorBoundary, InlineAlert, LoadingPlaceholder } from "./components";
import { useOffline } from "./utils/useOffline";
import type { UserRow, VeilingRow } from "./types";
import { DashboardMetrics } from "./features/dashboard/DashboardMetrics";
import { cx } from "./utils/classNames";

const UsersTab = lazy(async () =>
    import("./features/users/UsersTab").then((module) => ({ default: module.UsersTab })),
);
const AuctionsTab = lazy(async () =>
    import("./features/auctions/AuctionsTab").then((module) => ({ default: module.AuctionsTab })),
);
const BidsModal = lazy(async () =>
    import("./features/users/BidsModal").then((module) => ({ default: module.BidsModal })),
);
const ProductsModal = lazy(async () =>
    import("./features/products/ProductsModal").then((module) => ({ default: module.ProductsModal })),
);
const AuctionModal = lazy(async () =>
    import("./features/auctions/AuctionModal").then((module) => ({ default: module.AuctionModal })),
);

type TabKey = "users" | "auctions";

type TabDefinition = {
    readonly key: TabKey;
    readonly label: string;
    readonly render: () => ReactNode;
};

function readInitialTab(): TabKey {
    if (typeof window === "undefined") {
        return "users";
    }
    const value = new URLSearchParams(window.location.search).get("vm_tab");
    return value === "veilingen" ? "auctions" : "users";
}

function updateTabUrl(tab: TabKey): void {
    if (typeof window === "undefined") {
        return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("vm_tab", tab === "auctions" ? "veilingen" : "gebruikers");
    window.history.replaceState({}, "", url.toString());
}

/**
 * Hoofdscherm voor de veilingmeester met gebruikers- en veilingbeheer.
 *
 * @returns Het dashboard inclusief tabnavigatie en modals.
 */
export function Veilingmeester() {
    const offline = useOffline();
    const [activeTab, setActiveTab] = useState<TabKey>(() => readInitialTab());
    const [selectedBidUser, setSelectedBidUser] = useState<UserRow | null>(null);
    const [selectedGrower, setSelectedGrower] = useState<UserRow | null>(null);
    const [selectedAuction, setSelectedAuction] = useState<VeilingRow | null>(null);

    useEffect(() => {
        updateTabUrl(activeTab);
    }, [activeTab]);

    const tabs = useMemo<TabDefinition[]>(
        () => [
            {
                key: "users",
                label: "Gebruikers",
                render: () => (
                    <UsersTab
                        onSelectBidUser={(user) => setSelectedBidUser(user)}
                        onSelectGrower={(user) => setSelectedGrower(user)}
                    />
                ),
            },
            {
                key: "auctions",
                label: "Veilingen",
                render: () => <AuctionsTab onSelectAuction={(row) => setSelectedAuction(row)} />,
            },
        ],
        [],
    );

    return (
        <div className="bg-body-tertiary min-vh-100">
            <div className="container py-4 py-lg-5 d-flex flex-column gap-4">
                {/* Navbar */}
                <nav
                    className="navbar navbar-expand-lg bg-white rounded-4 shadow-sm border border-success-subtle px-4"
                    aria-label="Hoofdnavigatie veilingmeester"
                >
                    <span className="navbar-brand fw-semibold text-success">Veilingmeester</span>
                    <div className="ms-auto text-muted small">
                        Dagelijkse controle van gebruikers en veilingen
                    </div>
                </nav>

                {/* Header */}
                <header className="bg-white border border-success-subtle rounded-4 shadow-sm p-4">
                    <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                        <div>
                            <p className="text-uppercase text-success small fw-semibold mb-1">Dashboard</p>
                            <h1 className="h3 fw-bold mb-2 text-success-emphasis">Overzicht veilingactiviteiten</h1>
                            <p className="text-muted mb-0">
                                Volg biedingen, producten en live klokken met één centraal beheerscherm.
                            </p>
                        </div>
                        <div className="text-center text-lg-end">
              <span className="badge text-success-emphasis bg-success-subtle rounded-pill px-3 py-2 shadow-sm">
                Vertrouwde gegevens in realtime
              </span>
                        </div>
                    </div>
                </header>

                {/* Offline waarschuwing */}
                {offline && (
                    <InlineAlert variant="warning">
                        Je bent offline. Gegevens verversen zodra de verbinding terug is.
                    </InlineAlert>
                )}

                {/* Dashboard metrics */}
                <DashboardMetrics />

                {/* Tabs navigatie */}
                <section className="card border-0 shadow-sm rounded-4" aria-label="Navigatie tabs">
                    <div className="card-body p-4 d-flex flex-column gap-3">
                        <div className="text-center">
                            <p className="text-muted small mb-2">Kies een module om te beheren</p>
                        </div>
                        <div
                            className="d-flex flex-wrap justify-content-center gap-2"
                            role="tablist"
                            aria-label="Veiling tabs"
                        >
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

                {/* Tab inhoud */}
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

                {/* Modals */}
                <Suspense fallback={null}>
                    {selectedBidUser && (
                        <BidsModal user={selectedBidUser} onClose={() => setSelectedBidUser(null)} />
                    )}
                </Suspense>

                <Suspense fallback={null}>
                    {selectedGrower && (
                        <ProductsModal user={selectedGrower} onClose={() => setSelectedGrower(null)} />
                    )}
                </Suspense>

                <Suspense fallback={null}>
                    {selectedAuction && (
                        <AuctionModal row={selectedAuction} onClose={() => setSelectedAuction(null)} />
                    )}
                </Suspense>
            </div>
        </div>
    );
}
