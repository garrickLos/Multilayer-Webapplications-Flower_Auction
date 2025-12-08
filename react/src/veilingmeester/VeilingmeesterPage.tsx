import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { createAuction, deleteAuction, fetchAuctions, fetchBids, fetchProducts, fetchUsers, type ApiError, type Auction, type Bid, type Product, type UiStatus, type User } from "./api";
import { Table, type TableColumn } from "./components/Table";
import { Modal } from "./components/Modal";
import { Chip, EmptyState, Field, Input, Select, StatusBadge, TextArea, UserBadge } from "./components/ui";
import { useLiveStats } from "./useLiveStats";

const TABLE_PAGE_SIZES = [10, 25, 50];
const MODAL_PAGE_SIZES = [10, 25, 50];
const DASHBOARD_SAMPLE_SIZE = 8;
const CLOCK_TICK_MS = 5000;

// ---- Kleine helpers & hooks -------------------------------------------------
const currencyFormatter = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));
const formatDateParts = (date: Date): string => {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}-${month}-${year} ${hours}:${minutes}`;
};
const formatCurrency = (value?: number | null): string => currencyFormatter.format(typeof value === "number" && Number.isFinite(value) ? value : 0);
const formatDateTime = (value?: string | Date | null): string => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : formatDateParts(date);
};
const paginate = <T,>(rows: readonly T[], page: number, pageSize: number): readonly T[] => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
};
const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(" ");

function useOffline(): boolean {
    const [offline, setOffline] = useState(() => (typeof navigator === "undefined" ? false : !navigator.onLine));

    useEffect(() => {
        if (typeof window === "undefined") return;
        const update = () => setOffline(!navigator.onLine);
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);

    return offline;
}

function useTicker(stepMs = 1000): Date {
    const [now, setNow] = useState<Date>(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), stepMs);
        return () => clearInterval(timer);
    }, [stepMs]);

    return now;
}

const mapAuctionStatusToBadge = (status: string | UiStatus): UiStatus => {
    const normalised = (status ?? "").toLowerCase();
    if (normalised === "actief" || normalised === "active") return "active";
    if (normalised === "verkocht" || normalised === "afgesloten" || normalised === "sold" || normalised === "archived") return "sold";
    if (normalised === "geannuleerd" || normalised === "deleted") return "deleted";
    return "inactive";
};

const uiStatusToAuctionStatus = (status: UiStatus): string => {
    if (status === "active") return "active";
    if (status === "sold") return "sold";
    if (status === "deleted") return "deleted";
    return "inactive";
};

const mapProductStatusToUiStatus = (status: string): UiStatus => {
    if (status === "Deleted") return "deleted";
    if (status === "Archived") return "sold";
    if (status === "Active") return "active";
    return "inactive";
};

const aggregateProductStock = (products?: readonly Product[]): number => products?.reduce((sum, product) => sum + (product.stock ?? 0), 0) ?? 0;

const deriveAuctionUiStatus = (auction: Auction, now: Date = new Date()): UiStatus => {
    const mappedStatus = auction.rawStatus ? mapAuctionStatusToBadge(auction.rawStatus) : auction.status;
    if (mappedStatus === "deleted") return "deleted";

    const start = new Date(auction.startDate);
    const end = new Date(auction.endDate);
    const totalStock = aggregateProductStock(auction.products);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return mappedStatus;
    if (now < start) return "inactive";
    if (totalStock === 0 || mappedStatus === "sold") return "sold";
    if (now >= start && now <= end) return "active";
    return mappedStatus;
};

const calculateClockPrice = (startPrice: number, minPrice: number, start: Date, end: Date, now: Date): number => {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return startPrice;
    if (now <= start) return startPrice;
    if (now >= end) return minPrice;
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const ratio = Math.min(Math.max(elapsed / total, 0), 1);
    const price = startPrice - (startPrice - minPrice) * ratio;
    return Math.max(price, minPrice);
};

const filterRows = <T, F>(rows: readonly T[], search: string, filters: F, predicate: (row: T, term: string, filters: F) => boolean): readonly T[] => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => predicate(row, term, filters));
};

// ---- Dashboard ---------------------------------------------------------------
function DashboardMetrics(): JSX.Element {
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
                                            {error && <span className="text-danger ms-2" aria-label="fout">!</span>}
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
// ---- Auctions ---------------------------------------------------------------
type AuctionFilters = { onlyActive: boolean; from: string; to: string; veilingProduct: string };
type AuctionFormState = { title: string; startTime: string; endTime: string; status: UiStatus };

function useAuctionsPage(onAuctionsLoaded: (auctions: Auction[]) => void) {
    const [auctions, setAuctions] = useState<readonly Auction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<AuctionFilters>({ onlyActive: false, from: "", to: "", veilingProduct: "" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZES[0]);
    const now = useTicker(CLOCK_TICK_MS);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetchAuctions(
                    {
                        from: filters.from || undefined,
                        to: filters.to || undefined,
                        onlyActive: filters.onlyActive || undefined,
                        veilingProduct: filters.veilingProduct ? Number(filters.veilingProduct) : undefined,
                        page: 1,
                        pageSize: 200,
                    },
                    controller.signal,
                );
                setAuctions(response.items);
                onAuctionsLoaded(response.items as Auction[]);
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Kan veilingen niet laden.");
            } finally {
                setLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, [filters.from, filters.onlyActive, filters.to, filters.veilingProduct, onAuctionsLoaded]);

    const filteredRows = useMemo(
        () =>
            filterRows(auctions, "", filters, (row, _term, currentFilters) => {
                const computedStatus = deriveAuctionUiStatus(row, now);
                const matchesStatus = !currentFilters.onlyActive || computedStatus === "active";
                const start = Date.parse(row.startDate);
                const from = currentFilters.from ? Date.parse(currentFilters.from) : Number.NEGATIVE_INFINITY;
                const to = currentFilters.to ? Date.parse(currentFilters.to) : Number.POSITIVE_INFINITY;
                const matchesFrom = Number.isFinite(start) ? start >= from : true;
                const matchesTo = Number.isFinite(start) ? start <= to : true;
                const matchesSearch = !search || row.title.toLowerCase().includes(search.toLowerCase());
                const matchesVeilingProduct =
                    !currentFilters.veilingProduct || row.linkedProductIds?.includes(Number(currentFilters.veilingProduct));
                return matchesSearch && matchesStatus && matchesFrom && matchesTo && matchesVeilingProduct;
            }),
        [auctions, filters, now, search],
    );

    const handleCancel = async (auctionId: number) => {
        try {
            await deleteAuction(auctionId);
            setAuctions((prev) => {
                const next = prev.filter((auction) => auction.id !== auctionId);
                onAuctionsLoaded([...next]);
                return next;
            });
        } catch (err) {
            setError((err as { message?: string }).message ?? "Veiling kon niet worden geannuleerd.");
        }
    };

    return {
        auctions: filteredRows,
        loading,
        error,
        search,
        filters,
        now,
        page,
        pageSize,
        setSearch,
        setFilters,
        setPage,
        setPageSize,
        handleCancel,
    };
}

type AuctionsTabProps = {
    readonly onCreateRequested: () => void;
    readonly onOpenLinkProducts: (auctionId: number) => void;
    readonly onAuctionsLoaded: (auctions: Auction[]) => void;
};

function AuctionsTab({ onCreateRequested, onOpenLinkProducts, onAuctionsLoaded }: AuctionsTabProps): JSX.Element {
    const { auctions, loading, error, search, filters, now, page, pageSize, setSearch, setFilters, setPage, setPageSize, handleCancel } = useAuctionsPage(onAuctionsLoaded);

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
            render: (row) => (
                <div className="d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpenLinkProducts(row.id);
                        }}
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
            ),
        },
    ];

    const pagedRows = useMemo(() => paginate(auctions, page, pageSize), [auctions, page, pageSize]);

    return (
        <section className="card border-0 shadow-sm rounded-4" aria-label="Veilingen">
            <div className="card-body p-4 d-flex flex-column gap-3">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek op titel" label="Zoek" hideLabel className="flex-grow-1" />
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

function NewAuctionModal({ onSave, onClose }: { onSave: (auction: AuctionFormState) => void; onClose: () => void }) {
    const [draft, setDraft] = useState<AuctionFormState>({ title: "", startTime: "", endTime: "", status: "inactive" });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        await onSave(draft);
        setSubmitting(false);
    };

    return (
        <Modal title="Nieuwe veiling" onClose={onClose} footer={<button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>Opslaan</button>}>
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
                    <div className="col-12 col-md-6">
                        <Field label="Starttijd" htmlFor="auction-start">
                            <Input
                                id="auction-start"
                                type="datetime-local"
                                value={draft.startTime}
                                onChange={(event) => setDraft((prev) => ({ ...prev, startTime: event.target.value }))}
                            />
                        </Field>
                    </div>
                    <div className="col-12 col-md-6">
                        <Field label="Eindtijd" htmlFor="auction-end">
                            <Input
                                id="auction-end"
                                type="datetime-local"
                                value={draft.endTime}
                                onChange={(event) => setDraft((prev) => ({ ...prev, endTime: event.target.value }))}
                            />
                        </Field>
                    </div>
                </div>
                <Field label="Status" htmlFor="auction-status">
                    <Select
                        id="auction-status"
                        value={draft.status}
                        onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as UiStatus }))}
                    >
                        <option value="inactive">Inactief</option>
                        <option value="active">Actief</option>
                        <option value="sold">Verkocht</option>
                        <option value="deleted">Geannuleerd</option>
                    </Select>
                </Field>
            </div>
        </Modal>
    );
}

function LinkProductsModal({ auction, products, onClose, onSave }: { auction: Auction; products: readonly Product[]; onClose: () => void; onSave: (productIds: readonly number[]) => void }) {
    const [selected, setSelected] = useState<readonly number[]>(auction.linkedProductIds ?? []);

    const toggle = (productId: number) =>
        setSelected((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));

    return (
        <Modal
            title={`Koppel producten aan ${auction.title}`}
            onClose={onClose}
            footer={
                <button type="button" className="btn btn-success" onClick={() => onSave(selected)}>
                    Opslaan
                </button>
            }
        >
            <div className="d-flex flex-column gap-3">
                <p className="text-muted mb-0">Selecteer producten om te koppelen.</p>
                <div className="d-flex flex-column gap-2">
                    {products.map((product) => (
                        <label key={product.id} className="d-flex align-items-center gap-2">
                            <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggle(product.id)} />
                            <span className="fw-semibold">{product.name}</span>
                            <span className="text-muted small">#{product.id}</span>
                        </label>
                    ))}
                </div>
            </div>
        </Modal>
    );
}
// ---- Products ---------------------------------------------------------------
type ProductsTabProps = { readonly auctions: readonly Auction[] };

type ProductFilters = { status: UiStatus | "all"; seller: string; auctionId: string; search: string };

function ProductsTab({ auctions }: ProductsTabProps): JSX.Element {
    const [products, setProducts] = useState<readonly Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ProductFilters>({ status: "all", seller: "", auctionId: "", search: "" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZES[0]);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetchProducts({ page: 1, pageSize: 200 }, controller.signal);
                setProducts(response.items);
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Kan producten niet laden.");
            } finally {
                setLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, []);

    const filtered = useMemo(
        () =>
            filterRows(products, filters.search, filters, (row, term, current) => {
                const matchesStatus = current.status === "all" || mapProductStatusToUiStatus(row.status) === current.status;
                const matchesSeller = !current.seller || row.sellerName?.toLowerCase().includes(current.seller.toLowerCase());
                const matchesAuction = !current.auctionId || row.linkedAuctionId === Number(current.auctionId);
                const matchesSearch = !term || row.name.toLowerCase().includes(term);
                return matchesStatus && matchesSeller && matchesAuction && matchesSearch;
            }),
        [filters, products],
    );

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
                                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as ProductFilters["status"] }))}
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
// ---- Users ------------------------------------------------------------------
type UsersTabProps = {
    readonly users: readonly User[];
    readonly bids: readonly Bid[];
    readonly onViewBids: (userId: number) => void;
    readonly onViewProducts: (userId: number) => void;
};

const roleLabels: Record<User["role"], string> = {
    Koper: "Koper",
    Kweker: "Kweker",
    Veilingmeester: "Veilingmeester",
    Admin: "Admin",
    Onbekend: "Onbekend",
};

function UsersTab({ users, bids, onViewBids, onViewProducts }: UsersTabProps): JSX.Element {
    const [filters, setFilters] = useState<{ role: User["role"] | "all"; status: UiStatus | "all" }>({ role: "all", status: "all" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZES[0]);

    const filtered = useMemo(
        () =>
            filterRows(users, "", filters, (row, _term, current) => {
                const matchesRole = current.role === "all" || row.role === current.role;
                const matchesStatus = current.status === "all" || row.status === current.status;
                return matchesRole && matchesStatus;
            }),
        [filters, users],
    );

    const columns: TableColumn<User>[] = [
        { key: "name", header: "Naam", sortable: true, render: (row) => <UserBadge user={row} />, getValue: (row) => row.name },
        { key: "role", header: "Rol", sortable: true, render: (row) => roleLabels[row.role], getValue: (row) => row.role },
        { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} />, getValue: (row) => row.status },
        {
            key: "actions",
            header: "Acties",
            render: (row) => (
                <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-success btn-sm" onClick={() => onViewProducts(row.id)}>
                        Producten
                    </button>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => onViewBids(row.id)}>
                        Biedingen
                    </button>
                </div>
            ),
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
                                <option value="Kweker">Kweker</option>
                                <option value="Veilingmeester">Veilingmeester</option>
                                <option value="Admin">Admin</option>
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

function UserBidsModal({ user, bids, onClose }: { user: User; bids: readonly Bid[]; onClose: () => void }) {
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

function UserProductsModal({ user, products, onClose }: { user: User; products: readonly Product[]; onClose: () => void }) {
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
// ---- Pagina -----------------------------------------------------------------
type ModalState =
    | { key: "newAuction" }
    | { key: "linkProducts"; auctionId: number }
    | { key: "userBids"; userId: number }
    | { key: "userProducts"; userId: number };

type TabKey = "users" | "auctions" | "products";

export function VeilingmeesterPage() {
    const offline = useOffline();
    const [activeTab, setActiveTab] = useState<TabKey>("auctions");
    const [users, setUsers] = useState<User[]>([]);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [activeModal, setActiveModal] = useState<ModalState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuctionsLoaded = useCallback((items: Auction[]) => setAuctions(items), []);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [userResponse, auctionResponse, productResponse, bidResponse] = await Promise.all([
                    fetchUsers({ pageSize: 200 }, controller.signal),
                    fetchAuctions({ pageSize: 200 }, controller.signal),
                    fetchProducts({ pageSize: 200 }, controller.signal),
                    fetchBids({ pageSize: 200 }, controller.signal),
                ]);

                setUsers([...userResponse.items]);
                setAuctions([...auctionResponse.items]);
                setProducts([...productResponse.items]);
                setBids([...bidResponse.items]);
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                const apiError = err as ApiError;
                if (apiError.status === 401 || apiError.status === 403) {
                    setError("Je bent uitgelogd of hebt geen toegang. Log opnieuw in om verder te gaan.");
                } else {
                    setError((apiError as { message?: string }).message ?? "Kan gegevens niet laden");
                }
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

    const handleCreateAuction = async (draft: AuctionFormState) => {
        try {
            const created = await createAuction({
                veilingNaam: draft.title,
                begintijd: draft.startTime,
                eindtijd: draft.endTime,
                status: uiStatusToAuctionStatus(draft.status),
            });
            setAuctions((prev) => [created, ...prev]);
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

    const tabs: { key: TabKey; label: string; render: () => JSX.Element }[] = [
        {
            key: "auctions",
            label: "Veilingen",
            render: () => (
                <AuctionsTab
                    onCreateRequested={() => setActiveModal({ key: "newAuction" })}
                    onOpenLinkProducts={(auctionId) => setActiveModal({ key: "linkProducts", auctionId })}
                    onAuctionsLoaded={handleAuctionsLoaded}
                />
            ),
        },
        { key: "products", label: "Producten", render: () => <ProductsTab auctions={auctions} /> },
        {
            key: "users",
            label: "Gebruikers",
            render: () => (
                <UsersTab
                    users={users}
                    bids={bids}
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

export default VeilingmeesterPage;
