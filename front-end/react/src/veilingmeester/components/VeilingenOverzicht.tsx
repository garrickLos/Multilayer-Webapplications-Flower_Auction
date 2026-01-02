import { useMemo, type JSX } from "react";
import type { Auction } from "../api";
import { TABLE_PAGE_SIZES, useAuctionsPage } from "../hooks";
import { calculateClockPrice, deriveAuctionUiStatus } from "../rules";
import { formatCurrency, formatDateTime, paginate } from "../helpers";
import { Table, type TableColumn } from "./Table";
import { EmptyState, StatusBadge } from "./ui";
import { VeilingFilters } from "./VeilingFilters.tsx";

type AuctionsTabProps = {
    readonly auctions: readonly Auction[];
    readonly loading: boolean;
    readonly error: string | null;

    readonly onCreateRequested: () => void;
    readonly onOpenLinkProducts: (auctionId: number) => void;
    readonly onCancelAuction: (auctionId: number) => void;
    readonly onRefresh: () => void;
};

export function VeilingenOverzicht({
                                       auctions,
                                       loading,
                                       error,
                                       onCreateRequested,
                                       onOpenLinkProducts,
                                       onCancelAuction,
                                       onRefresh,
                                   }: AuctionsTabProps): JSX.Element {

    // Zoeken, filters en paginering uit centrale hook
    const {
        filtered,
        search,
        filters,
        now,
        page,
        pageSize,
        setSearch,
        setFilters,
        setPage,
        setPageSize,
    } = useAuctionsPage(auctions);

    // Tabelkolommen
    const columns: TableColumn<Auction>[] = [
        {
            key: "title",
            header: "Titel",
            sortable: true,
            render: (auction) => auction.title,
            getValue: (auction) => auction.title,
        },

        {
            key: "price",
            header: "Klokprijs",
            sortable: true,
            render: (auction) => {
                // Startprijs bepalen
                const startPrice = auction.maxPrice ?? auction.minPrice ?? 0;
                const minPrice = auction.minPrice ?? 0;

                // Actuele klokprijs
                const currentPrice = calculateClockPrice(
                    startPrice,
                    minPrice,
                    new Date(auction.startDate),
                    new Date(auction.endDate),
                    now
                );

                return (
                    <div className="d-flex flex-column">
                        <span>{formatCurrency(currentPrice)}</span>
                        <small className="text-muted">
                            Start {formatCurrency(startPrice)}
                        </small>
                    </div>
                );
            },
            // Eenvoudige sorteerwaarde
            getValue: (auction) => auction.minPrice ?? 0,
        },

        {
            key: "startDate",
            header: "Start",
            sortable: true,
            render: (auction) => formatDateTime(auction.startDate),
            getValue: (auction) => auction.startDate,
        },

        {
            key: "endDate",
            header: "Einde",
            sortable: true,
            render: (auction) => formatDateTime(auction.endDate),
            getValue: (auction) => auction.endDate,
        },

        {
            key: "products",
            header: "Producten",
            sortable: true,
            // Aantal gekoppelde producten
            render: (auction) =>
                auction.linkedProductIds?.length ??
                auction.products?.length ??
                0,
            getValue: (auction) =>
                auction.linkedProductIds?.length ??
                auction.products?.length ??
                0,
        },

        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (auction) => (
                <StatusBadge status={deriveAuctionUiStatus(auction, now)} />
            ),
            getValue: (auction) => deriveAuctionUiStatus(auction, now),
        },

        {
            key: "actions",
            header: "Acties",
            render: (auction) => {
                const status = deriveAuctionUiStatus(auction, now);

                const isActive = status === "active";
                const hasEnded = new Date(auction.endDate) < now;
                const canCancel = !hasEnded && status !== "deleted";

                return (
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={(event) => {
                                event.stopPropagation(); // geen rij-click
                                onOpenLinkProducts(auction.id);
                            }}
                            disabled={isActive}
                            title={isActive ? "Actieve veiling" : undefined}> Koppel producten
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                onCancelAuction(auction.id);
                            }}
                            disabled={!canCancel}
                            title={
                                !canCancel
                                    ? "Annuleren niet meer mogelijk"
                                    : undefined
                            }> Annuleer
                        </button>
                    </div>
                );
            },
        },
    ];

    // Gepagineerde rijen
    const pagedRows = useMemo(
        () => paginate(filtered, page, pageSize),
        [filtered, page, pageSize]
    );

    return (
        <section className="card border-0 shadow-sm rounded-4" aria-label="Veilingen">
            <div className="card-body p-4 d-flex flex-column gap-3">
                <VeilingFilters
                    search={search}
                    filters={filters}
                    onSearchChange={setSearch}
                    onFiltersChange={setFilters}
                    onCreateRequested={onCreateRequested}
                    onRefresh={onRefresh}
                />

                {/* Statusmeldingen */}
                {loading && (
                    <div className="alert alert-info mb-0">
                        Veilingen aan het laden…
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger mb-0">
                        {error}
                    </div>
                )}

                <Table
                    columns={columns}
                    rows={pagedRows}
                    getRowId={(auction) => auction.id}
                    page={page}
                    pageSize={pageSize}
                    total={filtered.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={TABLE_PAGE_SIZES}
                    emptyState={
                        <EmptyState
                            title="Geen veilingen"
                            description="Voeg een nieuwe veiling toe om te beginnen."
                        />
                    }
                />
            </div>
        </section>
    );
}
