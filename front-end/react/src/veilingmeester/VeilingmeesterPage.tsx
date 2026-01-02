import { useMemo, useState, type JSX } from "react";
import { useAuctionActions } from "./auctionActions";
import { AuctionsTab } from "./components/AuctionsTab";
import { DashboardMetrics } from "./components/DashboardMetrics";
import { LinkProductsModal } from "./components/LinkProductsModal";
import { NewAuctionModal } from "./components/NewAuctionModal";
import { ProductsTab } from "./components/ProductsTab";
import { UserBidsModal } from "./components/UserBidsModal";
import { UserProductsModal } from "./components/UserProductsModal";
import { UsersTab } from "./components/UsersTab";
import { useOffline, useVeilingmeesterData } from "./hooks";

const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(" ");

type ModalState =
    | { key: "newAuction" }
    | { key: "linkProducts"; auctionId: number }
    | { key: "userBids"; userId: number }
    | { key: "userProducts"; userId: number };

type TabKey = "users" | "auctions" | "products";

export function VeilingmeesterPage() {
    const offline = useOffline();
    const [activeTab, setActiveTab] = useState<TabKey>("auctions");
    const [activeModal, setActiveModal] = useState<ModalState | null>(null);

    const {
        users,
        auctions,
        products,
        bids,
        loading,
        error,
        setError,
        setAuctions,
        setProducts,
        refreshAuctions,
        refreshProducts,
        refreshUsers,
    } = useVeilingmeesterData();
    const activeAuction = useMemo(
        () => (activeModal && "auctionId" in activeModal ? auctions.find((entry) => entry.id === activeModal.auctionId) ?? null : null),
        [activeModal, auctions],
    );
    const activeUser = useMemo(
        () => (activeModal && "userId" in activeModal ? users.find((entry) => entry.id === activeModal.userId) ?? null : null),
        [activeModal, users],
    );

    const { handleCreateAuction, handleLinkProducts, handleUnlinkProduct, handleCancelAuction } = useAuctionActions({
        auctions,
        setAuctions,
        setProducts,
        setError,
    });

    const tabs: { key: TabKey; label: string; render: () => JSX.Element }[] = [
        {
            key: "auctions",
            label: "Veilingen",
            render: () => (
                <AuctionsTab
                    auctions={auctions}
                    loading={loading}
                    error={error}
                    onCreateRequested={() => setActiveModal({ key: "newAuction" })}
                    onOpenLinkProducts={(auctionId) => setActiveModal({ key: "linkProducts", auctionId })}
                    onCancelAuction={handleCancelAuction}
                    onRefresh={() => void refreshAuctions()}
                />
            ),
        },
        {
            key: "products",
            label: "Producten",
            render: () => (
                <ProductsTab auctions={auctions} products={products} loading={loading} error={error} onRefresh={() => void refreshProducts()} />
            ),
        },
        {
            key: "users",
            label: "Gebruikers",
            render: () => (
                <UsersTab
                    users={users}
                    loading={loading}
                    error={error}
                    onViewBids={(userId) => setActiveModal({ key: "userBids", userId })}
                    onViewProducts={(userId) => setActiveModal({ key: "userProducts", userId })}
                    onRefresh={() => void refreshUsers()}
                />
            ),
        },
    ];

    return (
        <div className="bg-body-tertiary min-vh-100">
            <div className="container py-4 py-lg-5 d-flex flex-column gap-4">
                <nav className="navbar navbar-expand-lg bg-white rounded-4 shadow-sm border border-success-subtle px-4" aria-label="Hoofdnavigatie veilingmeester">
                    <span className="navbar-brand fw-semibold text-success">Veilingmeester</span>
                    <div className="ms-auto d-flex align-items-center gap-3">
                        <div className="text-muted small">Simpel beheer voor veilingen, producten en gebruikers</div>
                    </div>
                </nav>

                {offline && (
                    <div className="alert alert-warning border-0 rounded-4 shadow-sm mb-0" role="status">
                        Je bent offline. Gegevens verversen zodra de verbinding terug is.
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger border-0 rounded-4 shadow-sm mb-0" role="alert">
                        {error}
                    </div>
                )}
                {loading && !error && (
                    <div className="alert alert-info border-0 rounded-4 shadow-sm mb-0" role="status">
                        Gegevens worden geladen…
                    </div>
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
                        {activeTab === tab.key && tab.render()}
                    </section>
                ))}

                {activeModal?.key === "newAuction" && (
                    <NewAuctionModal onClose={() => setActiveModal(null)} onSave={(draft) => handleCreateAuction(draft, () => setActiveModal(null))} />
                )}
                {activeModal?.key === "linkProducts" && activeAuction && (
                    <LinkProductsModal
                        auction={activeAuction}
                        products={products}
                        onClose={() => setActiveModal(null)}
                        onSave={(productId, startPrice) =>
                            void handleLinkProducts(activeAuction.id, productId, startPrice, () => setActiveModal(null))
                        }
                        onUnlink={(productId) => void handleUnlinkProduct(activeAuction.id, productId)}
                    />
                )}
                {activeModal?.key === "userBids" && activeUser && (
                    <UserBidsModal
                        user={activeUser}
                        bids={bids.filter((bid) => bid.userId === activeUser.id)}
                        products={products}
                        auctions={auctions}
                        onClose={() => setActiveModal(null)}
                    />
                )}
                {activeModal?.key === "userProducts" && activeUser && (
                    <UserProductsModal
                        user={activeUser}
                        products={products.filter((product) => product.growerId === activeUser.id)}
                        onClose={() => setActiveModal(null)}
                    />
                )}
            </div>
        </div>
    );
}

export default VeilingmeesterPage;
