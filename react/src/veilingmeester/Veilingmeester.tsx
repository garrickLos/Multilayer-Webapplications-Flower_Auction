import { useEffect, useMemo, useState } from "react";
import { DashboardMetrics } from "./features/dashboard";
import { AuctionsTab, AuctionDetailsModal, LinkProductsModal, NewAuctionModal } from "./features/auctions";
import { ProductsTab } from "./features/products";
import { EditUserModal, UserBidsModal, UserProductsModal, UsersTab } from "./features/users";
import { useOffline } from "./hooks";
import { getAuctions, getProducts, getUsers } from "./api";
import type { Auction, Bid, ModalState, Product, User } from "./types";
import { adaptAuction, adaptProduct, adaptUser } from "./types";
import { cx } from "./utils";

// Root container that holds all state and routes modals.
const seedUsers: User[] = [
    { id: 1, name: "Anke van Dijk", email: "anke@example.nl", role: "Veilingmeester", status: "active" },
    { id: 2, name: "Bram de Boer", email: "bram@example.nl", role: "Kweker", status: "active" },
    { id: 3, name: "Chantal Jansen", email: "chantal@example.nl", role: "Koper", status: "inactive" },
];

const seedAuctions: Auction[] = [
    {
        id: 201,
        title: "Tulpen ochtendveiling",
        status: "active",
        minPrice: 1.25,
        maxPrice: 2.5,
        startDate: "2024-05-10T08:00",
        endDate: "2024-05-10T10:00",
        linkedProductIds: [501, 502],
    },
    {
        id: 202,
        title: "Rozen middagveiling",
        status: "inactive",
        minPrice: 0.9,
        maxPrice: 1.8,
        startDate: "2024-05-12T13:00",
        endDate: "2024-05-12T16:00",
        linkedProductIds: [],
    },
];

const seedProducts: Product[] = [
    { id: 501, name: "Rode roos", status: "active", category: "Snijbloemen", startPrice: 1.1, stock: 20, fust: 1, growerId: 2, linkedAuctionId: 201 },
    { id: 502, name: "Gele tulp", status: "active", category: "Snijbloemen", startPrice: 0.8, stock: 30, fust: 1, growerId: 2, linkedAuctionId: 201 },
    { id: 503, name: "Orchidee mix", status: "inactive", category: "Planten", startPrice: 2.5, stock: 15, fust: 1, growerId: 2 },
    { id: 504, name: "Lavendel", status: "sold", category: "Planten", startPrice: 1.0, stock: 10, fust: 1, growerId: 2 },
];

const seedBids: Bid[] = [
    { id: 1, userId: 3, auctionId: 201, productId: 501, amount: 1.6, quantity: 50, date: "2024-05-10T08:30", status: "active" },
    { id: 2, userId: 3, auctionId: 201, productId: 501, amount: 1.7, quantity: 30, date: "2024-05-10T08:45", status: "sold" },
];

type TabKey = "users" | "auctions" | "products";

export function Veilingmeester() {
    const offline = useOffline();
    const [activeTab, setActiveTab] = useState<TabKey>("auctions");
    const [users, setUsers] = useState<User[]>(seedUsers);
    const [auctions, setAuctions] = useState<Auction[]>(seedAuctions);
    const [products, setProducts] = useState<Product[]>(seedProducts);
    const [bids] = useState<Bid[]>(seedBids);
    const [activeModal, setActiveModal] = useState<ModalState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [userResponse, auctionResponse, productResponse] = await Promise.all([
                    getUsers({ pageSize: 200 }, controller.signal),
                    getAuctions({ pageSize: 200 }, controller.signal),
                    getProducts({ pageSize: 200 }, controller.signal),
                ]);

                setUsers(userResponse.items.map(adaptUser));
                setAuctions(auctionResponse.items.map(adaptAuction));
                setProducts(productResponse.items.map(adaptProduct));
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

    const handleCreateAuction = (draft: { title: string; minPrice: number; maxPrice: number; startDate: string; endDate: string; status: Auction["status"] }) => {
        const nextId = auctions.reduce((max, auction) => Math.max(max, auction.id), 0) + 1;
        const newAuction: Auction = {
            id: nextId,
            title: draft.title || `Veiling ${nextId}`,
            minPrice: draft.minPrice,
            maxPrice: draft.maxPrice || draft.minPrice,
            startDate: draft.startDate,
            endDate: draft.endDate,
            status: draft.status,
            linkedProductIds: [],
        };
        setAuctions((prev) => [newAuction, ...prev]);
        setActiveModal(null);
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

    const handleUpdateUser = (updated: User) => {
        setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
        setActiveModal(null);
    };

    const tabs: { key: TabKey; label: string; render: () => JSX.Element }[] = [
        {
            key: "auctions",
            label: "Veilingen",
            render: () => (
                <AuctionsTab
                    auctions={auctions}
                    onCreateRequested={() => setActiveModal({ key: "newAuction" })}
                    onOpenDetails={(auctionId) => setActiveModal({ key: "auctionDetails", auctionId })}
                    onOpenLinkProducts={(auctionId) => setActiveModal({ key: "linkProducts", auctionId })}
                />
            ),
        },
        {
            key: "products",
            label: "Producten",
            render: () => <ProductsTab products={products} />,
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
                {activeModal?.key === "auctionDetails" && activeAuction && (
                    <AuctionDetailsModal auction={activeAuction} onClose={() => setActiveModal(null)} />
                )}
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
