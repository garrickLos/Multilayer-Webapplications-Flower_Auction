import { useMemo, useState, type JSX } from "react";
import { Modal } from "../Modal";
import { Table, type TableColumn } from "../components/Table";
import { Chip, EmptyState, Field, Input, Select, StatusBadge } from "../components/ui";
import type { Auction, Product, Status } from "../types";
import { filterRows } from "../types";
import { formatCurrency, formatDateTime } from "../utils";

// Auction list and related modals.
const statusOptions: readonly { value: Status | "all"; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "active", label: "Actief" },
    { value: "inactive", label: "Inactief" },
    { value: "sold", label: "Verkocht" },
    { value: "deleted", label: "Geannuleerd" },
];

const perPageOptions = [10, 25, 50];

type AuctionFilters = { status: Status | "all"; from: string; to: string };

export type AuctionsTabProps = {
    readonly auctions: readonly Auction[];
    readonly onCreateRequested: () => void;
    readonly onOpenDetails: (auctionId: number) => void;
    readonly onOpenLinkProducts: (auctionId: number) => void;
};

export function AuctionsTab({ auctions, onCreateRequested, onOpenDetails, onOpenLinkProducts }: AuctionsTabProps): JSX.Element {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<AuctionFilters>({ status: "all", from: "", to: "" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(perPageOptions[0]);

    const filteredRows = useMemo(
        () =>
            filterRows(auctions, search, filters, (row, term, currentFilters) => {
                const matchesSearch = !term || row.title.toLowerCase().includes(term) || String(row.id).includes(term);
                const matchesStatus = currentFilters.status === "all" || row.status === currentFilters.status;
                const start = Date.parse(row.startDate);
                const from = currentFilters.from ? Date.parse(currentFilters.from) : Number.NEGATIVE_INFINITY;
                const to = currentFilters.to ? Date.parse(currentFilters.to) : Number.POSITIVE_INFINITY;
                const matchesFrom = Number.isFinite(start) ? start >= from : true;
                const matchesTo = Number.isFinite(start) ? start <= to : true;
                return matchesSearch && matchesStatus && matchesFrom && matchesTo;
            }),
        [auctions, filters, search],
    );

    const columns: TableColumn<Auction>[] = [
        { key: "id", header: "#", sortable: true, render: (row) => <span className="fw-semibold">#{row.id}</span>, getValue: (row) => row.id },
        { key: "title", header: "Titel", sortable: true, render: (row) => row.title, getValue: (row) => row.title },
        {
            key: "price",
            header: "Prijs",
            sortable: true,
            render: (row) => (
                <div className="d-flex flex-column">
                    <span>{formatCurrency(row.minPrice)}</span>
                    <small className="text-muted">Max {formatCurrency(row.maxPrice)}</small>
                </div>
            ),
            getValue: (row) => row.minPrice,
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
        { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} />, getValue: (row) => row.status },
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

            <Table
                columns={columns}
                rows={filteredRows}
                getRowId={(row) => row.id}
                onRowClick={(row) => onOpenDetails(row.id)}
                search={{ value: search, onChange: setSearch, placeholder: "Titel of nummer" }}
                filters={
                    <div className="d-flex flex-wrap gap-2">
                        <Select
                            value={filters.status}
                            options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => setFilters((prev) => ({ ...prev, status: value as AuctionFilters["status"] }))}
                        />
                        <Input type="date" value={filters.from} onChange={(value) => setFilters((prev) => ({ ...prev, from: value }))} />
                        <Input type="date" value={filters.to} onChange={(value) => setFilters((prev) => ({ ...prev, to: value }))} />
                    </div>
                }
                page={page}
                pageSize={pageSize}
                pageSizeOptions={perPageOptions}
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

type AuctionFormState = { title: string; minPrice: number; maxPrice: number; startDate: string; endDate: string; status: Status };

type AuctionModalProps = { readonly onClose: () => void; readonly onSave: (draft: AuctionFormState) => void };

export function NewAuctionModal({ onClose, onSave }: AuctionModalProps): JSX.Element {
    const [draft, setDraft] = useState<AuctionFormState>({ title: "Nieuwe veiling", minPrice: 0, maxPrice: 0, startDate: "", endDate: "", status: "inactive" });

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
                    <Field label="Min. prijs">
                        <Input type="number" value={draft.minPrice} onChange={(value) => update("minPrice", Number(value) || 0)} min={0} />
                    </Field>
                </div>
                <div className="col-6">
                    <Field label="Max. prijs">
                        <Input type="number" value={draft.maxPrice} onChange={(value) => update("maxPrice", Number(value) || 0)} min={0} />
                    </Field>
                </div>
                <div className="col-6">
                    <Field label="Startdatum">
                        <Input type="datetime-local" value={draft.startDate} onChange={(value) => update("startDate", value)} />
                    </Field>
                </div>
                <div className="col-6">
                    <Field label="Einddatum">
                        <Input type="datetime-local" value={draft.endDate} onChange={(value) => update("endDate", value)} />
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

export function AuctionDetailsModal({ auction, onClose }: { readonly auction: Auction; readonly onClose: () => void }): JSX.Element {
    return (
        <Modal
            title={auction.title}
            subtitle={`Veiling #${auction.id}`}
            onClose={onClose}
            footer={
                <button type="button" className="btn btn-success" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <div className="row g-3">
                <Info label="Status">
                    <StatusBadge status={auction.status} />
                </Info>
                <Info label="Prijsbereik">{`${formatCurrency(auction.minPrice)} – ${formatCurrency(auction.maxPrice)}`}</Info>
                <Info label="Start">{formatDateTime(auction.startDate)}</Info>
                <Info label="Einde">{formatDateTime(auction.endDate)}</Info>
                <Info label="Gekoppelde producten">{auction.linkedProductIds?.length ?? auction.products?.length ?? 0}</Info>
            </div>
        </Modal>
    );
}

export function LinkProductsModal({
    auction,
    products,
    onClose,
    onSave,
}: {
    readonly auction: Auction;
    readonly products: readonly Product[];
    readonly onClose: () => void;
    readonly onSave: (productIds: readonly number[]) => void;
}): JSX.Element {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(perPageOptions[0]);
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
                    <span>{formatCurrency(row.minPrice)}</span>
                    <small className="text-muted">Max {formatCurrency(row.maxPrice)}</small>
                </div>
            ),
            getValue: (row) => row.minPrice,
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
                    pageSizeOptions={perPageOptions}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    onRowClick={(row) => toggleRow(row.id)}
                    selectable={{ selectedIds, onToggleRow: (id) => toggleRow(Number(id)), onTogglePage: togglePage }}
                />
            )}
        </Modal>
    );
}

const Info = ({ label, children }: { readonly label: string; readonly children: JSX.Element | string | number }): JSX.Element => (
    <div className="col-12 col-md-6">
        <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle h-100">
            <p className="text-uppercase small text-success-emphasis mb-1">{label}</p>
            <div className="fw-semibold text-success-emphasis">{children}</div>
        </div>
    </div>
);
