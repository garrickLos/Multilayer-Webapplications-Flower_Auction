import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { InlineAlert, LoadingPlaceholder } from "./components";
import { useOffline } from "./utils/useOffline";
import type { UserRow, VeilingRow } from "./types";

const UsersTab = lazy(async () => import("./features/users/UsersTab").then((module) => ({ default: module.UsersTab })));
const AuctionsTab = lazy(async () => import("./features/auctions/AuctionsTab").then((module) => ({ default: module.AuctionsTab })));
const BidsModal = lazy(async () => import("./features/users/BidsModal").then((module) => ({ default: module.BidsModal })));
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
export function Veilingmeester(): JSX.Element {
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
        <div className="container-fluid py-4">
            <header className="mb-4">
                <h1 className="h2 fw-semibold mb-1">Veiling</h1>
                <p className="text-muted mb-0 small">Beheer gebruikers, veilingen en klokken.</p>
            </header>
            {offline && (
                <div className="mb-3">
                    <InlineAlert variant="warning">
                        Je bent offline. Gegevens verversen zodra de verbinding terug is.
                    </InlineAlert>
                </div>
            )}
            <nav className="mb-3" role="tablist" aria-label="Veiling tabs">
                <div className="nav nav-tabs rounded-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`nav-link${activeTab === tab.key ? " active" : ""}`}
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
            </nav>
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
                        <Suspense fallback={<LoadingPlaceholder />}>
                            {tab.render()}
                        </Suspense>
                    )}
                </section>
            ))}
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
    );
}
