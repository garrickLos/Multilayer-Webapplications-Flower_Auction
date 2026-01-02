import { useMemo, type JSX } from "react";
import type { Auction, Product } from "../api";
import { TABLE_PAGE_SIZES, useProductsPage } from "../hooks";
import { mapProductStatusToUiStatus } from "../rules";
import { formatCurrency, paginate } from "../helpers";
import { Table, type TableColumn } from "./Table";
import { EmptyState, Field, Input, Select, StatusBadge } from "./ui";

type ProductsTabProps = {
    readonly auctions: readonly Auction[];
    readonly products: readonly Product[];
    readonly loading: boolean;
    readonly error: string | null;
};

export function ProductsTab({ auctions, products, loading, error }: ProductsTabProps): JSX.Element {
    const { filtered, filters, page, pageSize, setFilters, setPage, setPageSize } = useProductsPage(products);

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
