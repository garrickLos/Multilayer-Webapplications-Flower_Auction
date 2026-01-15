import { useMemo, type JSX } from "react";
import type { Auction, Product } from "../api";
import { TABLE_PAGE_SIZES, useProductsPage } from "../hooks";
import { formatCurrency, formatDateTime, paginate } from "../helpers";
import { Table, type TableColumn } from "./Table";
import { EmptyState } from "./ui";
import { ProductFilters } from "./ProductFilters.tsx";
import { ProductThumbnail } from "./ProductKaart.tsx";

/**
 * Props voor het productenoverzicht:
 * - auctions: lijst met veilingen (voor naam lookup)
 * - products: alle producten die getoond/gefilterd worden
 * - loading/error: status voor UI meldingen
 * - onRefresh: handmatige refresh actie (bijv. opnieuw ophalen)
 */
type ProductsTabProps = {
    readonly auctions: readonly Auction[];
    readonly products: readonly Product[];
    readonly loading: boolean;
    readonly error: string | null;
    readonly onRefresh: () => void;
};

/**
 * ProductenOverzicht:
 * - gebruikt useProductsPage() om filters + paging te beheren
 * - bouwt tabelkolommen (incl. sorting en custom renders)
 * - toont filters, statusmeldingen en een paginated Table
 */
export function ProductenOverzicht({
                                       auctions,
                                       products,
                                       loading,
                                       error,
                                       onRefresh,
                                   }: ProductsTabProps): JSX.Element {
    // Filter- en paging logica voor producten (gefilterde lijst + paginering state)
    const { filtered, filters, page, pageSize, setFilters, setPage, setPageSize } =
        useProductsPage(products);

    // Map voor snelle lookup: auctionId -> auctionTitle
    const auctionNameById = useMemo(
        () => new Map(auctions.map((auction) => [auction.id, auction.title])),
        [auctions]
    );

    // Definitie van tabelkolommen (header, sorting en render gedrag)
    const columns: TableColumn<Product>[] = [
        {
            key: "image",
            header: "",
            render: (row) => <ProductThumbnail product={row} />,
        },
        {
            key: "name",
            header: "Product",
            sortable: true,
            render: (row) => row.name,
            getValue: (row) => row.name,
        },
        {
            key: "category",
            header: "Categorie",
            render: (row) => row.category ?? "—",
            getValue: (row) => row.category ?? "",
        },
        {
            key: "price",
            header: "Prijs",
            sortable: true,
            render: (row) => (
                <div className="d-flex flex-column">
                    <span>{formatCurrency(row.minimumPrice)}</span>
                    <small className="text-muted">
                        Start {formatCurrency(row.startPrice)}
                    </small>
                </div>
            ),
            getValue: (row) => row.minimumPrice,
        },
        {
            key: "placedDate",
            header: "Datum",
            sortable: true,
            render: (row) => formatDateTime(row.placedDate ?? null),
            getValue: (row) => row.placedDate ?? "",
        },
        {
            key: "auction",
            header: "Veiling",
            render: (row) => {
                // Niet gekoppeld aan een veiling -> streepje
                if (!row.linkedAuctionId) return "—";
                // Wel gekoppeld -> toon titel als bekend, anders fallback op id
                return (
                    auctionNameById.get(row.linkedAuctionId) ??
                    `#${row.linkedAuctionId}`
                );
            },
            getValue: (row) => row.linkedAuctionId ?? 0,
        },
    ];

    // Paginated rows op basis van filters + page + pageSize
    const pagedRows = useMemo(
        () => paginate(filtered, page, pageSize),
        [filtered, page, pageSize]
    );

    return (
        <section className="card border-0 shadow-sm rounded-4" aria-label="Producten">
            <div className="card-body p-4 d-flex flex-column gap-3">
                {/* Filters boven de tabel (categorie, status, veiling, etc.) */}
                <ProductFilters
                    auctions={auctions}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onRefresh={onRefresh}
                />

                {/* Statusmeldingen */}
                {loading && <div className="alert alert-info mb-0">Producten laden…</div>}
                {error && <div className="alert alert-danger mb-0">{error}</div>}

                {/* Tabel met sorting + paging + empty state */}
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
                    emptyState={
                        <EmptyState
                            title="Geen producten"
                            description="Er zijn nog geen producten gevonden."
                        />
                    }
                />
            </div>
        </section>
    );
}
