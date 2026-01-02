import { useMemo, type JSX } from "react";
import type { Auction } from "../api";
import { TABLE_PAGE_SIZES, useAuctionsPage } from "../hooks";
import { calculateClockPrice, deriveAuctionUiStatus } from "../rules";
import { formatCurrency, formatDateTime, paginate } from "../helpers";
import { Table, type TableColumn } from "./Table";
import { EmptyState, StatusBadge } from "./ui";
import { AuctionsFilters } from "./AuctionsFilters";

type AuctionsTabProps = {
    readonly auctions: readonly Auction[];
    readonly loading: boolean;
    readonly error: string | null;
    readonly onCreateRequested: () => void;
    readonly onOpenLinkProducts: (auctionId: number) => void;
    readonly onCancelAuction: (auctionId: number) => void;
    readonly onRefresh: () => void;
};

export function AuctionsTab({
    auctions,
    loading,
    error,
    onCreateRequested,
    onOpenLinkProducts,
    onCancelAuction,
    onRefresh,
}: AuctionsTabProps): JSX.Element {
    const { filtered, search, filters, now, page, pageSize, setSearch, setFilters, setPage, setPageSize } = useAuctionsPage(auctions);

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
            render: (row) => {
                const status = deriveAuctionUiStatus(row, now);
                const isActive = status === "active";
                const hasEnded = new Date(row.endDate) < now;
                const canCancel = !hasEnded && status !== "deleted";
                return (
                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                onOpenLinkProducts(row.id);
                            }}
                            disabled={isActive}
                        >
                            Koppel producten
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                onCancelAuction(row.id);
                            }}
                            disabled={!canCancel}
                            title={!canCancel ? "Annuleren kan niet meer na afloop of bij geannuleerde veilingen." : undefined}
                        >
                            Annuleer
                        </button>
                    </div>
                );
            },
        },
    ];

    const pagedRows = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

    return (
        <section className="card border-0 shadow-sm rounded-4" aria-label="Veilingen">
            <div className="card-body p-4 d-flex flex-column gap-3">
                <AuctionsFilters
                    search={search}
                    filters={filters}
                    onSearchChange={setSearch}
                    onFiltersChange={setFilters}
                    onCreateRequested={onCreateRequested}
                    onRefresh={onRefresh}
                />

                {loading && <div className="alert alert-info mb-0">Veilingen laden…</div>}
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
                    emptyState={<EmptyState title="Geen veilingen" description="Voeg een nieuwe veiling toe om te beginnen." />}
                />
            </div>
        </section>
    );
}
