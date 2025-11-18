import { useEffect, useMemo, useState, type JSX } from "react";
import {
    DataTable,
    EmptyState,
    FilterChip,
    InlineAlert,
    LoadingPlaceholder,
    Pager,
    SearchField,
    SmallSelectField,
    StatusBadge,
} from "../components/ui.tsx";
import { appConfig } from "../config";
import { Modal } from "../Modal";
import { subscribeAuction } from "../api/live";
import { useAuctions, useProductCatalog } from "../hooks";
import type { VeilingProductRow, VeilingRow, Status } from "../types";
import { formatCurrency, formatDateTime } from "../utils";

const statusOptions: { value: "alle" | "actief" | "inactief"; label: string }[] = [
    { value: "alle", label: "Alle" },
    { value: "actief", label: "Actief" },
    { value: "inactief", label: "Inactief" },
];

type AuctionFormState = {
    readonly titel: string;
    readonly minPrice: number;
    readonly maxPrice: number;
    readonly startIso: string;
    readonly endIso: string;
    readonly status: Status;
};

const createEmptyAuction = (): AuctionFormState => ({
    titel: "Nieuwe veiling",
    minPrice: 0,
    maxPrice: 0,
    startIso: "",
    endIso: "",
    status: "inactive",
});

type AuctionsTabProps = { readonly onSelectAuction: (row: VeilingRow) => void };

type ProductLinkMap = Record<number, number[]>;

export function AuctionsTab({ onSelectAuction }: AuctionsTabProps): JSX.Element {
    const { rows, setRows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults } = useAuctions();
    const perPage = appConfig.pagination.table.map((size) => ({ value: size, label: String(size) }));

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<(typeof statusOptions)[number]["value"]>("alle");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [creating, setCreating] = useState(false);
    const [linkingAuction, setLinkingAuction] = useState<VeilingRow | null>(null);
    const [linkedProducts, setLinkedProducts] = useState<ProductLinkMap>({});

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const matchesSearch =
                !search ||
                row.titel.toLowerCase().includes(search.toLowerCase()) ||
                String(row.id).includes(search.trim());
            const matchesStatus = status === "alle" || row.status === (status === "actief" ? "active" : "inactive");
            const startDate = row.startIso ? Date.parse(row.startIso) : null;
            const fromDate = from ? Date.parse(from) : null;
            const toDate = to ? Date.parse(to) : null;
            const matchesFrom = !fromDate || (startDate != null && startDate >= fromDate);
            const matchesTo = !toDate || (startDate != null && startDate <= toDate);
            return matchesSearch && matchesStatus && matchesFrom && matchesTo;
        });
    }, [rows, search, status, from, to]);

    const columns = [
        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
        {
            key: "titel",
            header: "Titel",
            sortable: true,
            render: (row: VeilingRow) => (
                <div className="d-flex flex-column">
                    <span className="fw-semibold text-break">{row.titel}</span>
                    <span className="text-muted small">#{row.id}</span>
                </div>
            ),
            getValue: (row: VeilingRow) => row.titel,
        },
        {
            key: "minPrice",
            header: "Prijs",
            sortable: true,
            render: (row: VeilingRow) => (
                <div className="d-flex flex-column">
                    <span>{formatCurrency(row.minPrice)}</span>
                    <small className="text-muted">Max {formatCurrency(row.maxPrice)}</small>
                </div>
            ),
            getValue: (row: VeilingRow) => row.minPrice,
        },
        {
            key: "startIso",
            header: "Start",
            sortable: true,
            render: (row: VeilingRow) => formatDateTime(row.startIso),
            getValue: (row: VeilingRow) => row.startIso ?? "",
        },
        {
            key: "endIso",
            header: "Einde",
            sortable: true,
            render: (row: VeilingRow) => formatDateTime(row.endIso),
            getValue: (row: VeilingRow) => row.endIso ?? "",
        },
        {
            key: "productCount",
            header: "Producten",
            sortable: true,
            render: (row: VeilingRow) => row.productCount + (linkedProducts[row.id]?.length ?? 0),
            getValue: (row: VeilingRow) => row.productCount + (linkedProducts[row.id]?.length ?? 0),
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row: VeilingRow) => <StatusBadge status={row.status} />,
            getValue: (row: VeilingRow) => row.status,
        },
        {
            key: "actions",
            header: "Acties",
            cellClassName: "text-end",
            render: (row: VeilingRow) => (
                <div className="d-flex gap-2 justify-content-end">
                    <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={(event) => {
                            event.stopPropagation();
                            setLinkingAuction(row);
                        }}
                    >
                        Koppel producten
                    </button>
                </div>
            ),
        },
    ];

    const handleCreate = (draft: AuctionFormState) => {
        const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
        const newRow: VeilingRow = {
            id: nextId,
            titel: draft.titel || `Veiling ${nextId}`,
            startIso: draft.startIso || undefined,
            endIso: draft.endIso || undefined,
            status: draft.status,
            minPrice: draft.minPrice,
            maxPrice: draft.maxPrice || draft.minPrice,
            productCount: 0,
        };
        setRows((prev) => [newRow, ...prev]);
    };

    const handleLinkProducts = (auctionId: number, products: readonly VeilingProductRow[]) => {
        setLinkedProducts((prev) => ({ ...prev, [auctionId]: products.map((product) => product.id) }));
    };

    return (
        <section className="d-flex flex-column gap-3" aria-label="Veilingen">
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-lg-4">
                            <SearchField label="Zoeken" value={search} onChange={setSearch} placeholder="Titel of nummer" />
                        </div>
                        <div className="col-6 col-lg-2">
                            <SmallSelectField
                                label="Status"
                                value={status}
                                onChange={(value) => setStatus(value as (typeof statusOptions)[number]["value"])}
                                options={statusOptions}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
                            <label htmlFor="from" className="form-label small text-uppercase text-success-emphasis mb-1">
                                Vanaf
                            </label>
                            <input
                                id="from"
                                type="date"
                                className="form-control form-control-sm border-success-subtle"
                                value={from}
                                onChange={(event) => setFrom(event.target.value)}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
                            <label htmlFor="to" className="form-label small text-uppercase text-success-emphasis mb-1">
                                Tot en met
                            </label>
                            <input
                                id="to"
                                type="date"
                                className="form-control form-control-sm border-success-subtle"
                                value={to}
                                onChange={(event) => setTo(event.target.value)}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
                            <SmallSelectField<number>
                                label="Per pagina"
                                value={pageSize}
                                onChange={setPageSize}
                                options={perPage}
                                parse={(raw) => Number(raw)}
                            />
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                        <button type="button" className="btn btn-success" onClick={() => setCreating(true)}>
                            Nieuwe veiling
                        </button>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2" aria-label="Actieve filters">
                {status !== "alle" && <FilterChip label={`Status: ${status}`} onRemove={() => setStatus("alle")} />}
                {from && <FilterChip label={`Vanaf: ${from}`} onRemove={() => setFrom("")} />}
                {to && <FilterChip label={`Tot: ${to}`} onRemove={() => setTo("")} />}
                {search && <FilterChip label={`Zoek: ${search}`} onRemove={() => setSearch("")} />}
                {status === "alle" && !from && !to && !search && (
                    <span className="text-muted small">Geen filters actief.</span>
                )}
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : filteredRows.length === 0 ? (
                <EmptyState message="Geen veilingen gevonden." />
            ) : (
                <DataTable
                    columns={columns}
                    rows={filteredRows}
                    totalResults={totalResults}
                    empty={<EmptyState message="Geen veilingen gevonden." />}
                    getRowKey={(row) => String(row.id)}
                    onRowClick={onSelectAuction}
                />
            )}

            <Pager
                page={page}
                pageSize={pageSize}
                hasNext={hasNext}
                onPrevious={() => setPage(Math.max(1, page - 1))}
                onNext={() => setPage(page + 1)}
                totalResults={totalResults}
            />

            {creating && (
                <AuctionCreateModal
                    onClose={() => setCreating(false)}
                    onCreate={(draft) => {
                        handleCreate(draft);
                        setCreating(false);
                    }}
                />
            )}

            {linkingAuction && (
                <ProductLinkModal
                    auction={linkingAuction}
                    onClose={() => setLinkingAuction(null)}
                    onSave={(products) => {
                        handleLinkProducts(linkingAuction.id, products);
                        setLinkingAuction(null);
                    }}
                    linkedMap={linkedProducts}
                />
            )}
        </section>
    );
}

export function AuctionModal({ row, onClose }: { readonly row: VeilingRow; readonly onClose: () => void }): JSX.Element {
    const [current, setCurrent] = useState<VeilingRow>(row);

    useEffect(() => {
        const cleanup = subscribeAuction(row.id, (patch) => setCurrent((prev) => ({ ...prev, ...patch })));
        return cleanup;
    }, [row.id]);

    return (
        <Modal
            title={
                <div className="d-flex flex-column">
                    <span className="fw-semibold">{current.titel}</span>
                    <span className="text-muted small">Veiling #{current.id}</span>
                </div>
            }
            onClose={onClose}
            footer={
                <button type="button" className="btn btn-success" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <div className="row g-3 mb-3">
                <Info label="Status">
                    <StatusBadge status={current.status} />
                </Info>
                <Info label="Start">{formatDateTime(current.startIso)}</Info>
                <Info label="Einde">{formatDateTime(current.endIso)}</Info>
                <Info label="Prijsbereik">
                    {formatCurrency(current.minPrice)} – {formatCurrency(current.maxPrice)}
                </Info>
                <Info label="Producten">{current.productCount}</Info>
            </div>
        </Modal>
    );
}

function AuctionCreateModal({
    onClose,
    onCreate,
}: {
    readonly onClose: () => void;
    readonly onCreate: (draft: AuctionFormState) => void;
}): JSX.Element {
    const [draft, setDraft] = useState<AuctionFormState>(createEmptyAuction());

    const update = <K extends keyof AuctionFormState>(key: K, value: AuctionFormState[K]) =>
        setDraft((prev) => ({ ...prev, [key]: value }));

    return (
        <Modal
            title="Nieuwe veiling"
            onClose={onClose}
            footer={
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-success" onClick={onClose}>
                        Annuleren
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => onCreate(draft)}>
                        Opslaan
                    </button>
                </div>
            }
        >
            <div className="row g-3">
                <div className="col-12">
                    <label htmlFor="auction-title" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Titel
                    </label>
                    <input
                        id="auction-title"
                        type="text"
                        className="form-control border-success-subtle"
                        value={draft.titel}
                        onChange={(event) => update("titel", event.target.value)}
                    />
                </div>
                <div className="col-6">
                    <label htmlFor="auction-min" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Min. prijs
                    </label>
                    <input
                        id="auction-min"
                        type="number"
                        className="form-control border-success-subtle"
                        value={draft.minPrice}
                        onChange={(event) => update("minPrice", Number(event.target.value))}
                    />
                </div>
                <div className="col-6">
                    <label htmlFor="auction-max" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Max. prijs
                    </label>
                    <input
                        id="auction-max"
                        type="number"
                        className="form-control border-success-subtle"
                        value={draft.maxPrice}
                        onChange={(event) => update("maxPrice", Number(event.target.value))}
                    />
                </div>
                <div className="col-6">
                    <label htmlFor="auction-start" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Startdatum
                    </label>
                    <input
                        id="auction-start"
                        type="datetime-local"
                        className="form-control border-success-subtle"
                        value={draft.startIso}
                        onChange={(event) => update("startIso", event.target.value)}
                    />
                </div>
                <div className="col-6">
                    <label htmlFor="auction-end" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Einddatum
                    </label>
                    <input
                        id="auction-end"
                        type="datetime-local"
                        className="form-control border-success-subtle"
                        value={draft.endIso}
                        onChange={(event) => update("endIso", event.target.value)}
                    />
                </div>
                <div className="col-12">
                    <label htmlFor="auction-status" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Status
                    </label>
                    <select
                        id="auction-status"
                        className="form-select border-success-subtle"
                        value={draft.status}
                        onChange={(event) => update("status", event.target.value as Status)}
                    >
                        <option value="active">Actief</option>
                        <option value="inactive">Inactief</option>
                        <option value="sold">Verkocht</option>
                        <option value="deleted">Geannuleerd</option>
                    </select>
                </div>
            </div>
        </Modal>
    );
}

function ProductLinkModal({
    auction,
    onClose,
    onSave,
    linkedMap,
}: {
    readonly auction: VeilingRow;
    readonly onClose: () => void;
    readonly onSave: (products: readonly VeilingProductRow[]) => void;
    readonly linkedMap: ProductLinkMap;
}): JSX.Element {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, search, setSearch } =
        useProductCatalog();
    const perPage = appConfig.pagination.modal.map((size) => ({ value: size, label: String(size) }));
    const [status, setStatus] = useState<"alle" | "actief" | "inactief">("alle");
    const preselected = linkedMap[auction.id] ?? [];
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(preselected));

    useEffect(() => setSelectedIds(new Set(preselected)), [preselected]);

    const alreadyLinked = useMemo(() => new Set(Object.values(linkedMap).flat()), [linkedMap]);

    const availableRows = useMemo(() => {
        return rows.filter((row) => {
            const reservedElsewhere = alreadyLinked.has(row.id) && !selectedIds.has(row.id);
            if (reservedElsewhere) return false;
            const matchesStatus = status === "alle" || row.status === (status === "actief" ? "active" : "inactive");
            const matchesSearch =
                !search || row.naam.toLowerCase().includes(search.toLowerCase()) || String(row.id).includes(search.trim());
            return matchesStatus && matchesSearch;
        });
    }, [alreadyLinked, rows, search, selectedIds, status]);

    const toggleSelection = (row: VeilingProductRow) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(row.id)) next.delete(row.id);
            else next.add(row.id);
            return next;
        });
    };

    return (
        <Modal
            title={
                <div className="d-flex flex-column">
                    <span className="fw-semibold">Koppel producten</span>
                    <span className="text-muted small">Veiling #{auction.id}</span>
                </div>
            }
            onClose={onClose}
            size="xl"
            searchLabel="Zoeken"
            searchPlaceholder="Productnaam of nummer"
            searchValue={search}
            onSearchChange={setSearch}
            filters={
                <SmallSelectField
                    label="Status"
                    value={status}
                    onChange={(value) => setStatus(value as "alle" | "actief" | "inactief")}
                    options={statusOptions}
                />
            }
            footer={
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-success" onClick={onClose}>
                        Annuleren
                    </button>
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={() =>
                            onSave(availableRows.filter((row) => selectedIds.has(row.id)))
                        }
                    >
                        Koppel selectie
                    </button>
                </div>
            }
        >
            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : availableRows.length === 0 ? (
                <EmptyState message="Geen beschikbare producten." />
            ) : (
                <DataTable
                    columns={[
                        {
                            key: "select",
                            header: "",
                            headerClassName: "text-center",
                            cellClassName: "text-center",
                            render: (row: VeilingProductRow) => (
                                <input
                                    type="checkbox"
                                    className="form-check-input border-success-subtle"
                                    checked={selectedIds.has(row.id)}
                                    onChange={(event) => {
                                        event.stopPropagation();
                                        toggleSelection(row);
                                    }}
                                />
                            ),
                        },
                        {
                            key: "naam",
                            header: "Naam",
                            sortable: true,
                            render: (row: VeilingProductRow) => (
                                <div className="d-flex flex-column text-start">
                                    <span className="fw-semibold">{row.naam}</span>
                                    <span className="text-muted small">#{row.id}</span>
                                </div>
                            ),
                            getValue: (row: VeilingProductRow) => row.naam,
                        },
                        {
                            key: "minPrice",
                            header: "Prijs",
                            sortable: true,
                            render: (row: VeilingProductRow) => (
                                <div className="d-flex flex-column">
                                    <span>{formatCurrency(row.minPrice)}</span>
                                    <small className="text-muted">Max {formatCurrency(row.maxPrice)}</small>
                                </div>
                            ),
                            getValue: (row: VeilingProductRow) => row.minPrice,
                        },
                        {
                            key: "status",
                            header: "Status",
                            sortable: true,
                            render: (row: VeilingProductRow) => <StatusBadge status={row.status} />,
                            getValue: (row: VeilingProductRow) => row.status,
                        },
                    ]}
                    rows={availableRows}
                    totalResults={totalResults}
                    empty={<EmptyState message="Geen beschikbare producten." />}
                    getRowKey={(row) => String(row.id)}
                    onRowClick={toggleSelection}
                    isRowInteractive={() => true}
                />
            )}

            <Pager
                page={page}
                pageSize={pageSize}
                hasNext={hasNext}
                onPrevious={() => setPage(Math.max(1, page - 1))}
                onNext={() => setPage(page + 1)}
                totalResults={totalResults}
            />
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
