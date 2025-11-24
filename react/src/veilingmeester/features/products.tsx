import { useEffect, useMemo, useState, type JSX } from "react";
import { Table, type TableColumn } from "../components/Table";
import { Chip, EmptyState, Field, Input, Select, StatusBadge } from "../components/ui";
import { getAuctions, getCategories, getProducts } from "../api";
import type { Auction, Product, Status } from "../types";
import { adaptAuction, adaptProduct, filterRows } from "../types";
import { formatCurrency } from "../utils";

// Product listing with simple filters.
const statusOptions: readonly { value: Status | "all"; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "active", label: "Actief" },
    { value: "inactive", label: "Inactief" },
    { value: "sold", label: "Verkocht" },
    { value: "deleted", label: "Geannuleerd" },
];

const linkedOptions = [
    { value: "all", label: "Alle" },
    { value: "linked", label: "Gekoppeld" },
    { value: "unlinked", label: "Niet gekoppeld" },
] as const;

const perPageOptions = [10, 25, 50];

type ProductFilters = { status: Status | "all"; category: string; linkState: (typeof linkedOptions)[number]["value"] };

type ProductsTabProps = { readonly auctions: readonly Auction[] };

export function ProductsTab({ auctions }: ProductsTabProps): JSX.Element {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<ProductFilters>({ status: "all", category: "", linkState: "all" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(perPageOptions[0]);
    const [products, setProducts] = useState<readonly Product[]>([]);
    const [categories, setCategories] = useState<readonly { id: number; name: string }[]>([]);
    const [localAuctions, setLocalAuctions] = useState<readonly Auction[]>(auctions);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => setLocalAuctions(auctions), [auctions]);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                const [categoryResponse, auctionResponse] = await Promise.all([
                    getCategories(controller.signal),
                    auctions.length === 0 ? getAuctions({ pageSize: 200 }, controller.signal) : Promise.resolve(null),
                ]);
                setCategories(categoryResponse ?? []);
                if (auctionResponse) {
                    const mapped = auctionResponse.items.map(adaptAuction);
                    // keep local list for name lookup without overriding parent state
                    setLocalAuctions(mapped);
                }
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Filters konden niet laden.");
            }
        };
        void load();
        return () => controller.abort();
    }, [auctions]);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getProducts(
                    {
                        q: search || undefined,
                        categorieNr: filters.category ? Number(filters.category) : undefined,
                        page,
                        pageSize,
                    },
                    controller.signal,
                );
                setProducts(response.items.map(adaptProduct));
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Producten konden niet worden geladen.");
            } finally {
                setLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, [filters.category, page, pageSize, search]);

    const auctionNameMap = useMemo(() => {
        const source = localAuctions.length > 0 ? localAuctions : auctions;
        return new Map(source.map((auction) => [auction.id, auction.title]));
    }, [auctions, localAuctions]);

    const filteredRows = useMemo(
        () =>
            filterRows(products, "", filters, (row, _term, currentFilters) => {
                const selectedCategory = categories.find((category) => String(category.id) === currentFilters.category)?.name;
                const matchesStatus = currentFilters.status === "all" || row.status === currentFilters.status;
                const matchesCategory = !currentFilters.category || row.category === selectedCategory;
                const matchesLink =
                    currentFilters.linkState === "all" ||
                    (currentFilters.linkState === "linked" && Boolean(row.linkedAuctionId)) ||
                    (currentFilters.linkState === "unlinked" && !row.linkedAuctionId);
                return matchesStatus && matchesCategory && matchesLink;
            }),
        [categories, filters, products],
    );

    const columns: TableColumn<Product>[] = [
        { key: "name", header: "Naam", sortable: true, render: (row) => row.name, getValue: (row) => row.name },
        { key: "category", header: "Categorie", sortable: true, render: (row) => row.category, getValue: (row) => row.category },
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
        {
            key: "linked",
            header: "Gekoppeld",
            render: (row) => (row.linkedAuctionId ? auctionNameMap.get(row.linkedAuctionId) ?? "—" : "—"),
            getValue: (row) => (row.linkedAuctionId ? auctionNameMap.get(row.linkedAuctionId) ?? "" : ""),
        },
    ];

    const selectedCategoryLabel = categories.find((category) => String(category.id) === filters.category)?.name;
    const activeFilters = [
        filters.status !== "all" && `Status: ${filters.status}`,
        selectedCategoryLabel && `Categorie: ${selectedCategoryLabel}`,
        filters.linkState !== "all" && `Koppeling: ${filters.linkState}`,
        search && `Zoek: ${search}`,
    ].filter(Boolean) as string[];

    return (
        <section className="d-flex flex-column gap-3" aria-label="Producten">
            <div className="d-flex flex-wrap align-items-center gap-2">
                {activeFilters.length === 0 && <span className="text-muted small">Geen filters actief.</span>}
                {activeFilters.map((label) => (
                    <Chip key={label} label={label} onRemove={() => setFilters({ status: "all", category: "", linkState: "all" })} />
                ))}
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {loading && !error && (
                <div className="alert alert-info" role="status">
                    Producten laden…
                </div>
            )}

            <div className="row g-3">
                <div className="col-12 col-lg-4">
                    <label className="w-100 form-label text-success-emphasis fw-semibold small text-uppercase" htmlFor="product-search">
                        Zoeken
                    </label>
                    <div className="input-group">
                        <span className="input-group-text bg-white text-success-emphasis border-success-subtle">
                            <i className="bi bi-search" aria-hidden="true" />
                        </span>
                        <input
                            id="product-search"
                            type="search"
                            className="form-control border-success-subtle"
                            value={search}
                            placeholder="Naam"
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>
                <div className="col-12 col-lg-3">
                    <Field label="Status">
                        <Select
                            value={filters.status}
                            options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => setFilters((prev) => ({ ...prev, status: value as ProductFilters["status"] }))}
                        />
                    </Field>
                </div>
                <div className="col-12 col-lg-3">
                    <Field label="Categorie">
                        <Select
                            value={filters.category}
                            options={[{ value: "", label: "Alle" }, ...categories.map((category) => ({ value: String(category.id), label: category.name }))]}
                            onChange={(value) => {
                                setFilters((prev) => ({ ...prev, category: value }));
                                setPage(1);
                            }}
                        />
                    </Field>
                </div>
                <div className="col-12 col-lg-2">
                    <Field label="Koppeling">
                        <Select
                            value={filters.linkState}
                            options={linkedOptions.map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => setFilters((prev) => ({ ...prev, linkState: value as ProductFilters["linkState"] }))}
                        />
                    </Field>
                </div>
            </div>

            <Table
                columns={columns}
                rows={filteredRows}
                getRowId={(row) => row.id}
                page={page}
                pageSize={pageSize}
                pageSizeOptions={perPageOptions}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
                emptyMessage={<EmptyState message="Geen producten gevonden." />}
            />
        </section>
    );
}
