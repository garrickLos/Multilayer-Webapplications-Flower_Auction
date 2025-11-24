import { useMemo, useState, type JSX } from "react";
import { Table, type TableColumn } from "../components/Table";
import { Chip, EmptyState, Input, Select, StatusBadge } from "../components/ui";
import type { Product, Status } from "../types";
import { filterRows } from "../types";
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

type ProductsTabProps = { readonly products: readonly Product[] };

export function ProductsTab({ products }: ProductsTabProps): JSX.Element {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<ProductFilters>({ status: "all", category: "", linkState: "all" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(perPageOptions[0]);

    const filteredRows = useMemo(
        () =>
            filterRows(products, search, filters, (row, term, currentFilters) => {
                const matchesSearch = !term || row.name.toLowerCase().includes(term) || String(row.id).includes(term);
                const matchesStatus = currentFilters.status === "all" || row.status === currentFilters.status;
                const matchesCategory = !currentFilters.category || row.category.toLowerCase().includes(currentFilters.category.toLowerCase());
                const matchesLink =
                    currentFilters.linkState === "all" ||
                    (currentFilters.linkState === "linked" && Boolean(row.linkedAuctionId)) ||
                    (currentFilters.linkState === "unlinked" && !row.linkedAuctionId);
                return matchesSearch && matchesStatus && matchesCategory && matchesLink;
            }),
        [filters, products, search],
    );

    const columns: TableColumn<Product>[] = [
        { key: "id", header: "#", sortable: true, render: (row) => <span className="fw-semibold">#{row.id}</span>, getValue: (row) => row.id },
        { key: "name", header: "Naam", sortable: true, render: (row) => row.name, getValue: (row) => row.name },
        { key: "category", header: "Categorie", sortable: true, render: (row) => row.category, getValue: (row) => row.category },
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
        {
            key: "linked",
            header: "Gekoppeld",
            render: (row) => (row.linkedAuctionId ? `Veiling #${row.linkedAuctionId}` : "—"),
            getValue: (row) => row.linkedAuctionId ?? 0,
        },
    ];

    const activeFilters = [
        filters.status !== "all" && `Status: ${filters.status}`,
        filters.category && `Categorie: ${filters.category}`,
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

            <Table
                columns={columns}
                rows={filteredRows}
                getRowId={(row) => row.id}
                search={{ value: search, onChange: setSearch, placeholder: "Naam of nummer" }}
                filters={
                    <div className="d-flex flex-wrap gap-2">
                        <Select
                            value={filters.status}
                            options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => setFilters((prev) => ({ ...prev, status: value as ProductFilters["status"] }))}
                        />
                        <Input value={filters.category} onChange={(value) => setFilters((prev) => ({ ...prev, category: value }))} placeholder="Categorie" />
                        <Select
                            value={filters.linkState}
                            options={linkedOptions.map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => setFilters((prev) => ({ ...prev, linkState: value as ProductFilters["linkState"] }))}
                        />
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
                emptyMessage={<EmptyState message="Geen producten gevonden." />}
            />
        </section>
    );
}
