import { useEffect, useMemo, useState } from "react";
import { DashboardMetrics } from "./features/dashboard";
import { AuctionsTab, LinkProductsModal, NewAuctionModal } from "./features/auctions";
import { ProductsTab } from "./features/products";
import { EditUserModal, UserBidsModal, UserProductsModal, UsersTab } from "./features/users";
import { useOffline } from "./hooks";
import { createAuction, getAuctions, getBids, getProducts, getUsers, updateUser } from "./api";
import type { Auction, Bid, ModalState, Product, User } from "./types";
import { adaptAuction, adaptBid, adaptProduct, adaptUser } from "./types";
import { cx } from "./utils";

type TabKey = "users" | "auctions" | "products";

export function Veilingmeester() {
    const offline = useOffline();
    const [activeTab, setActiveTab] = useState<TabKey>("auctions");
    const [users, setUsers] = useState<User[]>([]);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [activeModal, setActiveModal] = useState<ModalState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [userResponse, auctionResponse, productResponse, bidResponse] = await Promise.all([
                    getUsers({ pageSize: 200 }, controller.signal),
                    getAuctions({ pageSize: 200 }, controller.signal),
                    getProducts({ pageSize: 200 }, controller.signal),
                    getBids({ pageSize: 200 }, controller.signal),
                ]);

                setUsers(userResponse.items.map(adaptUser));
                setAuctions(auctionResponse.items.map(adaptAuction));
                setProducts(productResponse.items.map(adaptProduct));
                setBids(bidResponse.items.map(adaptBid));
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Kan gegevens niet laden");
            } finally {
                setLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, []);

    const activeAuction = useMemo(
        () => (activeModal && "auctionId" in activeModal ? auctions.find((entry) => entry.id === activeModal.auctionId) ?? null : null),
        [activeModal, auctions],
    );
    const activeUser = useMemo(
        () => (activeModal && "userId" in activeModal ? users.find((entry) => entry.id === activeModal.userId) ?? null : null),
        [activeModal, users],
    );

    const composeDateTime = (time: string) => {
        const today = new Date();
        const [hours, minutes] = time.split(":");
        today.setHours(Number(hours ?? 0), Number(minutes ?? 0), 0, 0);
        return today.toISOString();
    };

    const handleCreateAuction = async (draft: {
        title: string;
        maxPrice: number;
        startTime: string;
        endTime: string;
        status: Auction["status"];
    }) => {
        try {
            const created = await createAuction({
                veilingNaam: draft.title,
                begintijd: composeDateTime(draft.startTime),
                eindtijd: composeDateTime(draft.endTime),
                status: draft.status,
            });
            setAuctions((prev) => [adaptAuction(created), ...prev]);
            setActiveModal(null);
        } catch (err) {
            setError((err as { message?: string }).message ?? "Veiling kon niet worden aangemaakt");
        }
    };

    const handleLinkProducts = (auctionId: number, productIds: readonly number[]) => {
        setAuctions((prev) => prev.map((auction) => (auction.id === auctionId ? { ...auction, linkedProductIds: productIds } : auction)));
        setProducts((prev) =>
            prev.map((product) =>
                productIds.includes(product.id)
                    ? { ...product, linkedAuctionId: auctionId }
                    : product.linkedAuctionId === auctionId
                    ? { ...product, linkedAuctionId: undefined }
                    : product,
            ),
        );
    };

    const handleUpdateUser = async (updated: User) => {
        try {
            const response = await updateUser(updated.id, {
                bedrijfsNaam: updated.name,
                email: updated.email,
                soort: updated.role,
                straatAdres: updated.address,
                kvk: updated.kvk,
            });
            const mapped = adaptUser(response);
            setUsers((prev) => prev.map((user) => (user.id === mapped.id ? mapped : user)));
            setActiveModal(null);
        } catch (err) {
            setError((err as { message?: string }).message ?? "Gebruiker kon niet worden bijgewerkt");
        }
    };

    const tabs: { key: TabKey; label: string; render: () => JSX.Element }[] = [
        {
            key: "auctions",
            label: "Veilingen",
            render: () => (
                <AuctionsTab
                    onCreateRequested={() => setActiveModal({ key: "newAuction" })}
                    onOpenLinkProducts={(auctionId) => setActiveModal({ key: "linkProducts", auctionId })}
                    onAuctionsLoaded={(items) => setAuctions(items)}
                />
            ),
        },
        {
            key: "products",
            label: "Producten",
            render: () => <ProductsTab auctions={auctions} />,
        },
        {
            key: "users",
            label: "Gebruikers",
            render: () => (
                <UsersTab
                    users={users}
                    bids={bids}
                    onEditUser={(user) => setActiveModal({ key: "editUser", userId: user.id })}
                    onViewBids={(userId) => setActiveModal({ key: "userBids", userId })}
                    onViewProducts={(userId) => setActiveModal({ key: "userProducts", userId })}
                />
            ),
        },
    ];

    return (
        <div className="bg-body-tertiary min-vh-100">
            <div className="container py-4 py-lg-5 d-flex flex-column gap-4">
                <nav className="navbar navbar-expand-lg bg-white rounded-4 shadow-sm border border-success-subtle px-4" aria-label="Hoofdnavigatie veilingmeester">
                    <span className="navbar-brand fw-semibold text-success">Veilingmeester</span>
                    <div className="ms-auto text-muted small">Simpel beheer voor veilingen, producten en gebruikers</div>
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

                {activeModal?.key === "newAuction" && <NewAuctionModal onClose={() => setActiveModal(null)} onSave={handleCreateAuction} />}
                {activeModal?.key === "linkProducts" && activeAuction && (
                    <LinkProductsModal
                        auction={activeAuction}
                        products={products}
                        onClose={() => setActiveModal(null)}
                        onSave={(productIds) => handleLinkProducts(activeAuction.id, productIds)}
                    />
                )}
                {activeModal?.key === "editUser" && activeUser && (
                    <EditUserModal
                        user={activeUser}
                        onClose={() => setActiveModal(null)}
                        onSave={(draft) => handleUpdateUser({ ...activeUser, ...draft })}
                    />
                )}
                {activeModal?.key === "userBids" && activeUser && (
                    <UserBidsModal
                        user={activeUser}
                        bids={bids.filter((bid) => bid.userId === activeUser.id)}
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
