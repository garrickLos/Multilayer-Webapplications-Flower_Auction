import { useMemo, type JSX } from "react";
import type { Auction, Product } from "../api";
import { TABLE_PAGE_SIZES, useProductsPage } from "../hooks";
import { mapProductStatusToUiStatus } from "../rules";
import { formatCurrency, paginate } from "../helpers";
import { Table, type TableColumn } from "./Table";
import { EmptyState, StatusBadge } from "./ui";
import { ProductsFilters } from "./ProductsFilters";
import { ProductThumbnail } from "./ProductCard";

type ProductsTabProps = {
    readonly auctions: readonly Auction[];
    readonly products: readonly Product[];
    readonly loading: boolean;
    readonly error: string | null;
    readonly onRefresh: () => void;
};

export function ProductsTab({ auctions, products, loading, error, onRefresh }: ProductsTabProps): JSX.Element {
    const { filtered, filters, page, pageSize, setFilters, setPage, setPageSize } = useProductsPage(products);

    const columns: TableColumn<Product>[] = [
        {
            key: "image",
            header: "",
            render: (row) => <ProductThumbnail product={row} />,
        },
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
                <ProductsFilters auctions={auctions} filters={filters} onFiltersChange={setFilters} onRefresh={onRefresh} />

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
