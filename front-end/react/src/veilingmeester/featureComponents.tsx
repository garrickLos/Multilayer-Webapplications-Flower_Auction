import { useEffect, useMemo, useState, type JSX } from "react";
import type { Auction, Bid, Product, UiStatus, User } from "./api";
import { TABLE_PAGE_SIZES, useAuctionsPage, useLiveStats, useProductsPage } from "./hooks";
import {
    AUCTION_DURATION_OPTIONS,
    calculateAuctionEndTime,
    calculateClockPrice,
    canUnlinkProduct,
    deriveAuctionUiStatus,
    getDefaultAuctionTimes,
    getUserActions,
    isProductLinkingLocked,
    mapProductStatusToUiStatus,
    matchesUserFilters,
    type AuctionDurationHours,
    type UserFilters,
} from "./rules";
import { buildDateTime, formatCurrency, formatDateTime, formatDateTimeInput, formatTimeInput, paginate, parseCurrencyValue } from "./helpers";
import { Modal } from "./components/Modal";
import { Table, type TableColumn } from "./components/Table";
import { Chip, EmptyState, Field, Input, Select, StatusBadge, UserBadge } from "./components/ui";

type AuctionsTabProps = {
    readonly onCreateRequested: () => void;
    readonly onOpenLinkProducts: (auctionId: number) => void;
    readonly onAuctionsLoaded: (auctions: Auction[]) => void;
};

type ProductsTabProps = { readonly auctions: readonly Auction[] };

type UsersTabProps = {
    readonly users: readonly User[];
    readonly bids: readonly Bid[];
    readonly onViewBids: (userId: number) => void;
    readonly onViewProducts: (userId: number) => void;
};

type LinkProductsModalProps = {
    readonly auction: Auction;
    readonly products: readonly Product[];
    readonly onClose: () => void;
    readonly onSave: (productId: number, startPrice: number) => void;
    readonly onUnlink: (productId: number) => void;
};

type NewAuctionModalProps = {
    readonly onSave: (auction: AuctionPayload) => void;
    readonly onClose: () => void;
};

type UserBidsModalProps = { readonly user: User; readonly bids: readonly Bid[]; readonly onClose: () => void };

type UserProductsModalProps = { readonly user: User; readonly products: readonly Product[]; readonly onClose: () => void };

export type AuctionFormState = { title: string; date: string; startTime: string; durationHours: AuctionDurationHours };
export type AuctionPayload = { title: string; startIso: string; endIso: string };

const roleLabels: Record<User["role"], string> = {
    Koper: "Koper",
    Bedrijf: "Bedrijf",
    Veilingmeester: "Veilingmeester",
    Admin: "Admin",
    Onbekend: "Onbekend",
};

const LinkedProductChips = ({ products, canUnlink, onUnlink }: { products: readonly Product[]; canUnlink: boolean; onUnlink: (productId: number) => void }) => {
    if (products.length === 0) {
        return <p className="text-muted mb-0">Nog geen gekoppelde producten.</p>;
    }

    return (
        <div className="d-flex flex-wrap gap-2">
            {products.map((product) => (
                <span key={product.id} className="badge text-bg-success-subtle border border-success-subtle">
                    {product.name} (#{product.id})
                    {canUnlink && (
                        <button
                            type="button"
                            className="btn btn-sm btn-link text-danger ms-2 p-0"
                            onClick={() => onUnlink(product.id)}
                            aria-label={`Ontkoppel ${product.name}`}
                        >
                            ✕
                        </button>
                    )}
                </span>
            ))}
        </div>
    );
};

const ProductSelectionRow = ({ product }: { product: Product }): JSX.Element => (
    <div className="d-flex flex-column flex-md-row gap-3 align-items-start p-3 bg-body-secondary rounded-4">
        <img
            src={product.imagePath ?? "/src/assets/pictures/webp/MissingPicture.webp"}
            alt={product.name}
            className="rounded-3"
            style={{ width: 120, height: 90, objectFit: "cover" }}
        />
        <div className="flex-grow-1">
            <p className="mb-1 fw-semibold">{product.name}</p>
            <p className="mb-1 text-muted">
                {product.category ?? "Onbekende categorie"} · {product.location ?? "Onbekende locatie"}
            </p>
            <p className="mb-0 text-muted">
                Min. prijs {formatCurrency(product.minimumPrice)} · Start {formatCurrency(product.startPrice ?? product.minimumPrice)}
            </p>
        </div>
    </div>
);

const UserActionButtons = ({
                               actions,
                               onViewBids,
                               onViewProducts,
                           }: {
    actions: { canViewBids: boolean; canViewProducts: boolean };
    onViewBids: () => void;
    onViewProducts: () => void;
}): JSX.Element => (
    <>
        {actions.canViewProducts && (
            <button type="button" className="btn btn-outline-success btn-sm" onClick={onViewProducts}>
                Producten
            </button>
        )}
        {actions.canViewBids && (
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onViewBids}>
                Biedingen
            </button>
        )}
    </>
);

export function DashboardMetrics(): JSX.Element {
    const { stats, loading, error, lastUpdated } = useLiveStats();

    const metrics = useMemo(
        () => [
            { id: "users", label: "Gebruikers", value: stats?.users ?? 0, helper: "Totaal" },
            { id: "auctions", label: "Actieve veilingen", value: stats?.activeAuctions ?? 0, helper: "Live" },
            { id: "products", label: "Producten", value: stats?.products ?? 0, helper: "Beschikbaar" },
            { id: "bids", label: "Biedingen", value: stats?.bids ?? 0, helper: "Laatste 24u" },
        ],
        [stats],
    );

    const refreshedAt = useMemo(() => formatDateTime(lastUpdated ?? null), [lastUpdated]);

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
                                        <div className="fs-2 fw-semibold text-success">
                                            {loading ? "…" : metric.value}
                                            {error && (
                                                <span className="text-danger ms-2" aria-label="fout">
                                                    !
                                                </span>
                                            )}
                                        </div>
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

export function AuctionsTab({ onCreateRequested, onOpenLinkProducts, onAuctionsLoaded }: AuctionsTabProps): JSX.Element {
    const { auctions, loading, error, search, filters, now, page, pageSize, setSearch, setFilters, setPage, setPageSize, handleCancel } =
        useAuctionsPage(onAuctionsLoaded);

    const columns: TableColumn<Auction>[] = [
        { key: "title", header: "Titel", sortable: true, render: (row) => row.title, getValue: (row) => row.title },
        {
            key: "price",
            header: "Klokprijs",
            sortable: true,
            render: (row) => {
                const startPrice = row.maxPrice ?? row.minPrice ?? 0;
                const minPrice = row.minPrice ?? 0;
                const current = calculateClockPrice(startPrice, minPrice, new Date(row.startDate), new Date(row.endDate), now);
                return (
                    <div className="d-flex flex-column">
                        <span>{formatCurrency(current)}</span>
                        <small className="text-muted">Start {formatCurrency(startPrice)}</small>
                    </div>
                );
            },
            getValue: (row) => row.minPrice ?? 0,
        },
        { key: "startDate", header: "Start", sortable: true, render: (row) => formatDateTime(row.startDate), getValue: (row) => row.startDate },
        { key: "endDate", header: "Einde", sortable: true, render: (row) => formatDateTime(row.endDate), getValue: (row) => row.endDate },
        {
            key: "products",
            header: "Producten",
            sortable: true,
            render: (row) => row.linkedProductIds?.length ?? row.products?.length ?? 0,
            getValue: (row) => row.linkedProductIds?.length ?? row.products?.length ?? 0,
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row) => <StatusBadge status={deriveAuctionUiStatus(row, now)} />,
            getValue: (row) => deriveAuctionUiStatus(row, now),
        },
        {
            key: "actions",
            header: "Acties",
            render: (row) => {
                const isActive = deriveAuctionUiStatus(row, now) === "active";
                return (
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                onOpenLinkProducts(row.id);
                            }}
                            disabled={isActive}
                        >
                            Koppel producten
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                void handleCancel(row.id);
                            }}
                        >
                            Annuleer
                        </button>
                    </div>
                );
            },
        },
    ];

    const pagedRows = useMemo(() => paginate(auctions, page, pageSize), [auctions, page, pageSize]);

    return (
        <section className="card border-0 shadow-sm rounded-4" aria-label="Veilingen">
            <div className="card-body p-4 d-flex flex-column gap-3">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Zoek op titel"
                        label="Zoek"
                        hideLabel
                        className="flex-grow-1"
                    />
                    <button type="button" className="btn btn-success" onClick={onCreateRequested}>
                        Nieuwe veiling
                    </button>
                </div>

                <div className="row g-3">
                    <div className="col-6 col-md-3">
                        <Field label="Alleen actief" htmlFor="onlyActive">
                            <div className="form-check form-switch">
                                <input
                                    id="onlyActive"
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={filters.onlyActive}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, onlyActive: event.target.checked }))}
                                />
                                <label className="form-check-label" htmlFor="onlyActive">
                                    Toon alleen lopende veilingen
                                </label>
                            </div>
                        </Field>
                    </div>
                    <div className="col-6 col-md-3">
                        <Field label="Vanaf datum" htmlFor="from">
                            <input
                                id="from"
                                type="datetime-local"
                                className="form-control"
                                value={filters.from}
                                onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                            />
                        </Field>
                    </div>
                    <div className="col-6 col-md-3">
                        <Field label="Tot datum" htmlFor="to">
                            <input
                                id="to"
                                type="datetime-local"
                                className="form-control"
                                value={filters.to}
                                onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                            />
                        </Field>
                    </div>
                    <div className="col-6 col-md-3">
                        <Field label="Product" htmlFor="veilingProduct">
                            <input
                                id="veilingProduct"
                                type="number"
                                className="form-control"
                                value={filters.veilingProduct}
                                onChange={(event) => setFilters((prev) => ({ ...prev, veilingProduct: event.target.value }))}
                            />
                        </Field>
                    </div>
                </div>

                {loading && <div className="alert alert-info mb-0">Veilingen laden…</div>}
                {error && <div className="alert alert-danger mb-0">{error}</div>}

                <Table
                    columns={columns}
                    rows={pagedRows}
                    getRowId={(row) => row.id}
                    page={page}
                    pageSize={pageSize}
                    total={auctions.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={TABLE_PAGE_SIZES}
                    emptyState={<EmptyState title="Geen veilingen" description="Voeg een nieuwe veiling toe om te beginnen." />}
                />
            </div>
        </section>
    );
}

export function ProductsTab({ auctions }: ProductsTabProps): JSX.Element {
    const { filtered, loading, error, filters, page, pageSize, setFilters, setPage, setPageSize } = useProductsPage();

    const columns: TableColumn<Product>[] = [
        { key: "name", header: "Product", sortable: true, render: (row) => row.name, getValue: (row) => row.name },
        { key: "category", header: "Categorie", render: (row) => row.category ?? "—", getValue: (row) => row.category ?? "" },
        {
            key: "price",
            header: "Prijs",
            sortable: true,
            render: (row) => (
                <div className="d-flex flex-column">
                    <span>{formatCurrency(row.minimumPrice)}</span>
                    <small className="text-muted">Start {formatCurrency(row.startPrice)}</small>
                </div>
            ),
            getValue: (row) => row.minimumPrice,
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row) => <StatusBadge status={mapProductStatusToUiStatus(row.status)} />,
            getValue: (row) => mapProductStatusToUiStatus(row.status),
        },
        {
            key: "auction",
            header: "Veiling",
            render: (row) => (row.linkedAuctionId ? `#${row.linkedAuctionId}` : "—"),
            getValue: (row) => row.linkedAuctionId ?? 0,
        },
    ];

    const pagedRows = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

    return (
        <section className="card border-0 shadow-sm rounded-4" aria-label="Producten">
            <div className="card-body p-4 d-flex flex-column gap-3">
                <div className="row g-3">
                    <div className="col-12 col-md-3">
                        <Field label="Status" htmlFor="product-status">
                            <Select
                                id="product-status"
                                value={filters.status}
                                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as typeof filters.status }))}
                            >
                                <option value="all">Alle</option>
                                <option value="active">Actief</option>
                                <option value="inactive">Inactief</option>
                                <option value="sold">Verkocht</option>
                                <option value="deleted">Geannuleerd</option>
                            </Select>
                        </Field>
                    </div>
                    <div className="col-12 col-md-3">
                        <Field label="Verkoper" htmlFor="product-seller">
                            <Input
                                id="product-seller"
                                value={filters.seller}
                                onChange={(event) => setFilters((prev) => ({ ...prev, seller: event.target.value }))}
                                placeholder="Naam verkoper"
                            />
                        </Field>
                    </div>
                    <div className="col-12 col-md-3">
                        <Field label="Veiling" htmlFor="product-auction">
                            <Select
                                id="product-auction"
                                value={filters.auctionId}
                                onChange={(event) => setFilters((prev) => ({ ...prev, auctionId: event.target.value }))}
                            >
                                <option value="">Alle veilingen</option>
                                {auctions.map((auction) => (
                                    <option key={auction.id} value={auction.id}>
                                        {auction.title}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>
                    <div className="col-12 col-md-3">
                        <Field label="Zoek" htmlFor="product-search">
                            <Input
                                id="product-search"
                                value={filters.search}
                                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                                placeholder="Zoek product"
                            />
                        </Field>
                    </div>
                </div>

                {loading && <div className="alert alert-info mb-0">Producten laden…</div>}
                {error && <div className="alert alert-danger mb-0">{error}</div>}

                <Table
                    columns={columns}
                    rows={pagedRows}
                    getRowId={(row) => row.id}
                    page={page}
                    pageSize={pageSize}
                    total={filtered.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={TABLE_PAGE_SIZES}
                    emptyState={<EmptyState title="Geen producten" description="Er zijn nog geen producten gevonden." />}
                />
            </div>
        </section>
    );
}

export function UsersTab({ users, onViewBids, onViewProducts }: UsersTabProps): JSX.Element {
    const [filters, setFilters] = useState<UserFilters>({ role: "all", status: "all" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZES[0]);

    const filtered = useMemo(() => users.filter((user) => matchesUserFilters(user, filters)), [filters, users]);

    const columns: TableColumn<User>[] = [
        { key: "name", header: "Naam", sortable: true, render: (row) => <UserBadge user={row} />, getValue: (row) => row.name },
        { key: "role", header: "Rol", sortable: true, render: (row) => roleLabels[row.role], getValue: (row) => row.role },
        { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} />, getValue: (row) => row.status },
        {
            key: "actions",
            header: "Acties",
            render: (row) => {
                const actions = getUserActions(row);
                return (
                    <div className="d-flex justify-content-end gap-2">
                        <UserActionButtons actions={actions} onViewBids={() => onViewBids(row.id)} onViewProducts={() => onViewProducts(row.id)} />
                    </div>
                );
            },
        },
    ];

    const pagedRows = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

    return (
        <section className="card border-0 shadow-sm rounded-4" aria-label="Gebruikers">
            <div className="card-body p-4 d-flex flex-column gap-3">
                <div className="row g-3">
                    <div className="col-12 col-md-6">
                        <Field label="Rol" htmlFor="user-role">
                            <Select
                                id="user-role"
                                value={filters.role}
                                onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value as User["role"] | "all" }))}
                            >
                                <option value="all">Alle</option>
                                <option value="Koper">Koper</option>
                                <option value="Bedrijf">Bedrijf</option>
                            </Select>
                        </Field>
                    </div>
                    <div className="col-12 col-md-6">
                        <Field label="Status" htmlFor="user-status">
                            <Select
                                id="user-status"
                                value={filters.status}
                                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as UiStatus | "all" }))}
                            >
                                <option value="all">Alle</option>
                                <option value="active">Actief</option>
                                <option value="inactive">Inactief</option>
                                <option value="sold">Verkocht</option>
                                <option value="deleted">Geannuleerd</option>
                            </Select>
                        </Field>
                    </div>
                </div>

                <Table
                    columns={columns}
                    rows={pagedRows}
                    getRowId={(row) => row.id}
                    page={page}
                    pageSize={pageSize}
                    total={filtered.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={TABLE_PAGE_SIZES}
                    emptyState={<EmptyState title="Geen gebruikers" description="Er zijn nog geen gebruikers gevonden." />}
                />
            </div>
        </section>
    );
}

export function LinkProductsModal({ auction, products, onClose, onSave, onUnlink }: LinkProductsModalProps): JSX.Element {
    const isLocked = isProductLinkingLocked(auction);
    const availableProducts = useMemo(() => products.filter((product) => !product.linkedAuctionId), [products]);
    const linkedProducts = useMemo(() => products.filter((product) => product.linkedAuctionId === auction.id), [auction.id, products]);
    const [productId, setProductId] = useState<string>(() => (availableProducts[0]?.id ? String(availableProducts[0].id) : ""));
    const [startPrice, setStartPrice] = useState<string>(() => {
        const first = availableProducts[0];
        return first ? String(first.startPrice ?? first.minimumPrice ?? 0) : "";
    });
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        const selected = availableProducts.find((product) => product.id === Number(productId));
        if (selected) {
            setStartPrice(String(selected.startPrice ?? selected.minimumPrice ?? 0));
            setFormError(null);
        }
    }, [availableProducts, productId]);

    const handleSave = () => {
        if (isLocked) {
            setFormError("Aanpassingen zijn niet toegestaan tijdens een actieve veiling.");
            return;
        }
        if (!productId) {
            setFormError("Selecteer een product om te koppelen.");
            return;
        }

        const numericStartPrice = parseCurrencyValue(startPrice);
        if (numericStartPrice === null || numericStartPrice <= 0) {
            setFormError("Voer een geldige startprijs in.");
            return;
        }

        onSave(Number(productId), numericStartPrice);
    };

    const selectedProduct = availableProducts.find((product) => product.id === Number(productId));

    return (
        <Modal
            title={`Koppel product aan ${auction.title}`}
            onClose={onClose}
            footer={
                <button type="button" className="btn btn-success" onClick={handleSave} disabled={availableProducts.length === 0}>
                    Opslaan
                </button>
            }
        >
            <div className="d-flex flex-column gap-3">
                <p className="text-muted mb-0">Kies een product dat nog niet is gekoppeld en vul de startprijs in.</p>
                {isLocked && <div className="alert alert-warning mb-0">Deze veiling is actief. Koppelen of ontkoppelen is nu niet mogelijk.</div>}
                <div>
                    <p className="text-uppercase text-muted small mb-2">Gekoppelde producten</p>
                    <LinkedProductChips products={linkedProducts} canUnlink={canUnlinkProduct(auction)} onUnlink={onUnlink} />
                </div>
                {availableProducts.length === 0 ? (
                    <EmptyState title="Geen beschikbare producten" description="Alle producten zijn al gekoppeld aan een veiling." />
                ) : (
                    <div className="row g-3">
                        <div className="col-12">
                            <Field label="Product" htmlFor="link-product">
                                <Select
                                    id="link-product"
                                    value={productId}
                                    onChange={(event) => {
                                        setProductId(event.target.value);
                                        setFormError(null);
                                    }}
                                    disabled={isLocked}
                                >
                                    <option value="" disabled>
                                        Kies een product
                                    </option>
                                    {availableProducts.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} (#{product.id}) · {product.category ?? "Onbekend"} · {formatCurrency(product.minimumPrice)} · {product.stock ?? 0} stuks
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        </div>
                        {selectedProduct && (
                            <div className="col-12">
                                <ProductSelectionRow product={selectedProduct} />
                            </div>
                        )}
                        <div className="col-12">
                            <Field label="Startprijs" htmlFor="link-startprice">
                                <Input
                                    id="link-startprice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={startPrice}
                                    onChange={(event) => setStartPrice(event.target.value)}
                                    disabled={isLocked}
                                />
                            </Field>
                        </div>
                        {formError && <div className="col-12 alert alert-danger mb-0">{formError}</div>}
                    </div>
                )}
            </div>
        </Modal>
    );
}

export function NewAuctionModal({ onSave, onClose }: NewAuctionModalProps): JSX.Element {
    const [draft, setDraft] = useState<AuctionFormState>({ title: "", date: "", startTime: "", durationHours: 1 });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        setDraft((prev) => ({ ...prev, ...getDefaultAuctionTimes() }));
    }, []);

    const startDateTime = useMemo(() => buildDateTime(draft.date, draft.startTime), [draft.date, draft.startTime]);
    const endDateTime = useMemo(
        () => calculateAuctionEndTime(draft.date, draft.startTime, draft.durationHours),
        [draft.date, draft.durationHours, draft.startTime],
    );

    const handleSubmit = async () => {
        setFormError(null);
        if (!draft.title.trim()) {
            setFormError("Vul een titel in voor de veiling.");
            return;
        }
        if (!startDateTime || !endDateTime) {
            setFormError("Kies een geldige starttijd.");
            return;
        }
        if (startDateTime < new Date()) {
            setFormError("De starttijd mag niet in het verleden liggen.");
            return;
        }
        if (
            endDateTime.getDate() !== startDateTime.getDate() ||
            endDateTime.getMonth() !== startDateTime.getMonth() ||
            endDateTime.getFullYear() !== startDateTime.getFullYear()
        ) {
            setFormError("De eindtijd moet op dezelfde datum vallen als de starttijd.");
            return;
        }

        setSubmitting(true);
        await onSave({
            title: draft.title,
            startIso: formatDateTimeInput(startDateTime),
            endIso: formatDateTimeInput(endDateTime),
        });
        setSubmitting(false);
    };

    return (
        <Modal
            title="Nieuwe veiling"
            onClose={onClose}
            footer={
                <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
                    Opslaan
                </button>
            }
        >
            <div className="d-flex flex-column gap-3">
                <Field label="Titel" htmlFor="auction-title">
                    <Input
                        id="auction-title"
                        value={draft.title}
                        onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Voorjaarsveiling"
                    />
                </Field>
                <div className="row g-3">
                    <div className="col-12 col-md-4">
                        <Field label="Datum" htmlFor="auction-date">
                            <Input
                                id="auction-date"
                                type="date"
                                value={draft.date}
                                onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
                            />
                        </Field>
                    </div>
                    <div className="col-12 col-md-4">
                        <Field label="Starttijd" htmlFor="auction-start">
                            <Input
                                id="auction-start"
                                type="time"
                                value={draft.startTime}
                                onChange={(event) => setDraft((prev) => ({ ...prev, startTime: event.target.value }))}
                            />
                        </Field>
                    </div>
                    <div className="col-12 col-md-4">
                        <Field label="Duur" htmlFor="auction-duration">
                            <Select
                                id="auction-duration"
                                value={String(draft.durationHours)}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, durationHours: Number(event.target.value) as AuctionDurationHours }))
                                }
                            >
                                {AUCTION_DURATION_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option} uur
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>
                </div>
                <Field label="Eindtijd" htmlFor="auction-end">
                    <Input id="auction-end" type="time" value={endDateTime ? formatTimeInput(endDateTime) : ""} readOnly />
                </Field>
                {formError && <div className="alert alert-danger mb-0">{formError}</div>}
            </div>
        </Modal>
    );
}

export function UserBidsModal({ user, bids, onClose }: UserBidsModalProps): JSX.Element {
    return (
        <Modal title={`Biedingen van ${user.name}`} onClose={onClose}>
            <div className="d-flex flex-column gap-3">
                {bids.length === 0 && <EmptyState title="Geen biedingen" description="Deze gebruiker heeft nog geen biedingen." />}
                {bids.map((bid) => (
                    <div key={bid.id} className="d-flex justify-content-between align-items-center p-3 bg-body-secondary rounded-4">
                        <div>
                            <p className="mb-1 fw-semibold">Bod #{bid.id}</p>
                            <p className="mb-0 text-muted">
                                {bid.quantity} x {formatCurrency(bid.amount)} op veiling #{bid.auctionId}
                            </p>
                        </div>
                        <Chip label={bid.status ?? "actief"} />
                    </div>
                ))}
            </div>
        </Modal>
    );
}

export function UserProductsModal({ user, products, onClose }: UserProductsModalProps): JSX.Element {
    return (
        <Modal title={`Producten van ${user.name}`} onClose={onClose}>
            <div className="d-flex flex-column gap-3">
                {products.length === 0 && <EmptyState title="Geen producten" description="Deze gebruiker heeft geen producten." />}
                {products.map((product) => (
                    <div key={product.id} className="d-flex justify-content-between align-items-center p-3 bg-body-secondary rounded-4">
                        <div>
                            <p className="mb-1 fw-semibold">{product.name}</p>
                            <p className="mb-0 text-muted">Min. prijs {formatCurrency(product.minimumPrice)}</p>
                        </div>
                        <StatusBadge status={mapProductStatusToUiStatus(product.status)} />
                    </div>
                ))}
            </div>
        </Modal>
    );
}