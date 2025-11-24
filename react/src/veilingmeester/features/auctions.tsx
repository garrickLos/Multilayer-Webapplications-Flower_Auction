import { useEffect, useMemo, useState, type JSX } from "react";
import { deleteAuction, fetchAuctions } from "../api";
import { Modal } from "../Modal";
import { Table, type TableColumn } from "../components/Table";
import { Chip, EmptyState, Field, Input, Select, StatusBadge } from "../components/ui";
import { useTicker } from "../hooks";
import { appConfig } from "../config";
import type { Auction, Product, Status } from "../types";
import { calculateClockPrice, deriveAuctionUiStatus, filterRows, formatCurrency, formatDateTime } from "../utils";

const { table: tablePageSizeOptions, modal: modalPageSizeOptions } = appConfig.pagination;
const { prefetchPageSize } = appConfig.api;

// ---- filters & helpers ----

type AuctionFilters = { status: Status | "all"; from: string; to: string };

const statusOptions: readonly { value: Status | "all"; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "active", label: "Actief" },
    { value: "inactive", label: "Inactief" },
    { value: "sold", label: "Verkocht" },
    { value: "deleted", label: "Geannuleerd" },
];

/** Keep local state for auction list, filters, and clock updates. */
function useAuctionsPage(onAuctionsLoaded: (auctions: Auction[]) => void) {
    const [auctions, setAuctions] = useState<readonly Auction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<AuctionFilters>({ status: "all", from: "", to: "" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(tablePageSizeOptions[0]);
    const now = useTicker(5000);

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
                        status: filters.status === "all" ? undefined : filters.status,
                        q: search || undefined,
                        page: 1,
                        pageSize: prefetchPageSize,
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
    }, [filters.from, filters.status, filters.to, onAuctionsLoaded, search]);

    const filteredRows = useMemo(
        () =>
            filterRows(auctions, "", filters, (row, _term, currentFilters) => {
                const computedStatus = deriveAuctionUiStatus(row, now);
                const matchesStatus = currentFilters.status === "all" || computedStatus === currentFilters.status;
                const start = Date.parse(row.startDate);
                const from = currentFilters.from ? Date.parse(currentFilters.from) : Number.NEGATIVE_INFINITY;
                const to = currentFilters.to ? Date.parse(currentFilters.to) : Number.POSITIVE_INFINITY;
                const matchesFrom = Number.isFinite(start) ? start >= from : true;
                const matchesTo = Number.isFinite(start) ? start <= to : true;
                const matchesSearch = !search || row.title.toLowerCase().includes(search.toLowerCase());
                return matchesSearch && matchesStatus && matchesFrom && matchesTo;
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

// ---- Screens & modals ----

type AuctionsTabProps = {
    readonly onCreateRequested: () => void;
    readonly onOpenLinkProducts: (auctionId: number) => void;
    readonly onAuctionsLoaded: (auctions: Auction[]) => void;
};

export function AuctionsTab({ onCreateRequested, onOpenLinkProducts, onAuctionsLoaded }: AuctionsTabProps): JSX.Element {
    const {
        auctions,
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
    } = useAuctionsPage(onAuctionsLoaded);

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

    const activeFilters = [
        filters.status !== "all" && `Status: ${filters.status}`,
        filters.from && `Vanaf: ${filters.from}`,
        filters.to && `Tot: ${filters.to}`,
        search && `Zoek: ${search}`,
    ].filter(Boolean) as string[];

    return (
        <section className="d-flex flex-column gap-3" aria-label="Veilingen">
            <div className="d-flex justify-content-between flex-wrap gap-2">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    {activeFilters.length === 0 && <span className="text-muted small">Geen filters actief.</span>}
                    {activeFilters.map((label) => (
                        <Chip key={label} label={label} onRemove={() => setFilters({ status: "all", from: "", to: "" })} />
                    ))}
                </div>
                <button type="button" className="btn btn-success" onClick={onCreateRequested}>
                    Nieuwe veiling
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {loading && (
                <div className="alert alert-info" role="status">
                    Veilingen laden…
                </div>
            )}

            <div className="row g-3">
                <div className="col-12 col-lg-3">
                    <Field label="Status">
                        <Select
                            value={filters.status}
                            options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => setFilters((prev) => ({ ...prev, status: value as AuctionFilters["status"] }))}
                        />
                    </Field>
                </div>
                <div className="col-12 col-lg-3">
                    <Field label="Startdatum">
                        <Input type="date" value={filters.from} onChange={(value) => setFilters((prev) => ({ ...prev, from: value }))} />
                    </Field>
                </div>
                <div className="col-12 col-lg-3">
                    <Field label="Einddatum">
                        <Input type="date" value={filters.to} onChange={(value) => setFilters((prev) => ({ ...prev, to: value }))} />
                    </Field>
                </div>
                <div className="col-12 col-lg-3">
                    <label className="w-100 form-label text-success-emphasis fw-semibold small text-uppercase" htmlFor="auction-search">
                        Zoeken
                    </label>
                    <div className="input-group">
                        <span className="input-group-text bg-white text-success-emphasis border-success-subtle">
                            <i className="bi bi-search" aria-hidden="true" />
                        </span>
                        <input
                            id="auction-search"
                            type="search"
                            className="form-control border-success-subtle"
                            value={search}
                            placeholder="Titel"
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Table
                columns={columns}
                rows={auctions}
                getRowId={(row) => row.id}
                page={page}
                pageSize={pageSize}
                pageSizeOptions={tablePageSizeOptions}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
                emptyMessage={<EmptyState message="Geen veilingen gevonden." />}
            />
        </section>
    );
}

type AuctionFormState = { title: string; maxPrice: number; startTime: string; endTime: string; status: Status };

type AuctionModalProps = { readonly onClose: () => void; readonly onSave: (draft: AuctionFormState) => void };

export function NewAuctionModal({ onClose, onSave }: AuctionModalProps): JSX.Element {
    const [draft, setDraft] = useState<AuctionFormState>({ title: "Nieuwe veiling", maxPrice: 0, startTime: "", endTime: "", status: "inactive" });

    const update = <K extends keyof AuctionFormState>(key: K, value: AuctionFormState[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

    return (
        <Modal
            title="Nieuwe veiling"
            subtitle="Aanmaken"
            onClose={onClose}
            footer={
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-success" onClick={onClose}>
                        Annuleren
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => onSave(draft)}>
                        Opslaan
                    </button>
                </div>
            }
        >
            <div className="row g-3">
                <div className="col-12">
                    <Field label="Titel">
                        <Input value={draft.title} onChange={(value) => update("title", value)} placeholder="Titel" />
                    </Field>
                </div>
                <div className="col-6">
                    <Field label="Max. prijs">
                        <Input type="number" value={draft.maxPrice} onChange={(value) => update("maxPrice", Number(value) || 0)} min={0} />
                    </Field>
                </div>
                <div className="col-6">
                    <Field label="Starttijd">
                        <Input type="time" value={draft.startTime} onChange={(value) => update("startTime", value)} />
                    </Field>
                </div>
                <div className="col-6">
                    <Field label="Eindtijd">
                        <Input type="time" value={draft.endTime} onChange={(value) => update("endTime", value)} />
                    </Field>
                </div>
                <div className="col-12">
                    <Field label="Status">
                        <Select
                            value={draft.status}
                            options={statusOptions.filter((option) => option.value !== "all").map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => update("status", value as Status)}
                        />
                    </Field>
                </div>
            </div>
        </Modal>
    );
}

type LinkProductsProps = {
    readonly auction: Auction;
    readonly products: readonly Product[];
    readonly onClose: () => void;
    readonly onSave: (productIds: readonly number[]) => void;
};

export function LinkProductsModal({ auction, products, onClose, onSave }: LinkProductsProps): JSX.Element {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(modalPageSizeOptions[0]);
    const [selectedIds, setSelectedIds] = useState<readonly number[]>(auction.linkedProductIds ?? []);

    const availableProducts = useMemo(
        () =>
            filterRows(products, search, { status: statusFilter }, (product, term, currentFilters) => {
                const notLinkedElsewhere = !product.linkedAuctionId || product.linkedAuctionId === auction.id;
                const matchesSearch = !term || product.name.toLowerCase().includes(term) || String(product.id).includes(term);
                const matchesStatus = currentFilters.status === "all" || product.status === currentFilters.status;
                return notLinkedElsewhere && matchesSearch && matchesStatus;
            }),
        [auction.id, products, search, statusFilter],
    );

    const toggleRow = (id: number) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
    const togglePage = (ids: readonly (string | number)[], checked: boolean) => {
        setSelectedIds((prev) => {
            const set = new Set(prev);
            ids.forEach((id) => {
                if (checked) set.add(Number(id));
                else set.delete(Number(id));
            });
            return Array.from(set);
        });
    };

    const columns: TableColumn<Product>[] = [
        { key: "id", header: "#", sortable: true, render: (row) => <span className="fw-semibold">#{row.id}</span>, getValue: (row) => row.id },
        { key: "name", header: "Naam", sortable: true, render: (row) => row.name, getValue: (row) => row.name },
        {
            key: "price",
            header: "Prijs",
            sortable: true,
            render: (row) => (
                <div className="d-flex flex-column">
                    <span>{formatCurrency(row.startPrice)}</span>
                    <small className="text-muted">Voorraad {row.stock}</small>
                </div>
            ),
            getValue: (row) => row.startPrice,
        },
        { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} />, getValue: (row) => row.status },
        { key: "category", header: "Categorie", sortable: true, render: (row) => row.category, getValue: (row) => row.category },
    ];

    const handleSave = () => {
        onSave(selectedIds);
        onClose();
    };

    const handleCancel = () => {
        setSelectedIds([]);
        onClose();
    };

    return (
        <Modal
            title="Koppel producten"
            subtitle={`Veiling #${auction.id}`}
            onClose={handleCancel}
            size="xl"
            controls={
                <div className="d-flex flex-wrap gap-2">
                    <Input value={search} onChange={setSearch} placeholder="Productnaam of nummer" />
                    <Select
                        value={statusFilter}
                        options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                        onChange={(value) => setStatusFilter(value as Status | "all")}
                    />
                    <span className="badge bg-success-subtle text-success-emphasis align-self-center">
                        {selectedIds.length} geselecteerd
                    </span>
                </div>
            }
            footer={
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-success" onClick={handleCancel}>
                        Annuleren
                    </button>
                    <button type="button" className="btn btn-success" onClick={handleSave} disabled={selectedIds.length === 0}>
                        Koppel selectie
                    </button>
                </div>
            }
        >
            {availableProducts.length === 0 ? (
                <EmptyState message="Geen beschikbare producten" />
            ) : (
                <Table
                    columns={columns}
                    rows={availableProducts}
                    getRowId={(row) => row.id}
                    page={page}
                    pageSize={pageSize}
                    pageSizeOptions={modalPageSizeOptions}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    onRowClick={(row) => toggleRow(row.id)}
                    selectable={{ selectedIds, onToggleRow: (id) => toggleRow(Number(id)), onTogglePage: togglePage }}
                />
            )}
        </Modal>
    );
}
