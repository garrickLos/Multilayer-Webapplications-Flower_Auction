import { useMemo, type JSX } from "react";
import type { Auction } from "../api";
import { TABLE_PAGE_SIZES, useAuctionsPage } from "../hooks";
import { calculateClockPrice, deriveAuctionUiStatus } from "../rules";
import { formatCurrency, formatDateTime, formatTimeInput, paginate } from "../helpers";
import { Table, type TableColumn } from "./Table";
import { EmptyState, StatusBadge } from "./ui";
import { VeilingFilters } from "./VeilingFilters.tsx";

/**
 * Props voor het veilingen-overzicht:
 * - auctions: lijst met veilingen
 * - loading/error: status voor UI meldingen
 * - onCreateRequested: openen van "nieuwe veiling" flow
 * - onOpenLinkProducts: openen van product-koppelen modal per veiling
 * - onCancelAuction: actie om veiling te annuleren
 * - onRefresh: handmatige refresh (data opnieuw ophalen)
 */
type AuctionsTabProps = {
    readonly auctions: readonly Auction[];
    readonly loading: boolean;
    readonly error: string | null;

    readonly onCreateRequested: () => void;
    readonly onOpenLinkProducts: (auctionId: number) => void;
    readonly onCancelAuction: (auctionId: number) => void;
    readonly onRefresh: () => void;
};

/**
 * VeilingenOverzicht:
 * Toont een tabel met veilingen inclusief:
 * - titel
 * - klokprijs (dynamisch op basis van tijd)
 * - start/eindtijd
 * - aantal gekoppelde producten
 * - statusbadge
 * - acties (koppelen/annuleren) met regels op basis van status/tijd
 */
export function VeilingenOverzicht({
                                       auctions,
                                       loading,
                                       error,
                                       onCreateRequested,
                                       onOpenLinkProducts,
                                       onCancelAuction,
                                       onRefresh,
                                   }: AuctionsTabProps): JSX.Element {
    /**
     * Centrale hook regelt:
     * - filteren + zoeken
     * - paging state
     * - "now" tijdstip (voor live status/klokprijs)
     */
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

    /**
     * Tabelkolommen definitie:
     * getValue wordt gebruikt voor sortering waar nodig.
     */
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
                // Eerst naar cent-bedragen met veilige fallbacks, daarna naar euro
                const startPriceCents = auction?.maxPrice ?? auction?.minPrice ?? 0;
                const minPriceCents = auction?.minPrice ?? 0;
                const startPrice = startPriceCents / 100;
                const minPrice = minPriceCents / 100;

                // Actuele klokprijs (op basis van start/eind + huidige tijd)
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
            // Sorteren op minimumprijs (simpel en stabiel)
            getValue: (auction) => auction.minPrice ?? 0,
        },

        {
            key: "startDate",
            header: "Tijd",
            sortable: true,
            render: (auction) => {
                // Startdatum als label + eindtijd als tijd-only
                const startLabel = formatDateTime(auction.startDate);
                const end = new Date(auction.endDate);
                const endTime = Number.isNaN(end.getTime()) ? "—" : formatTimeInput(end);
                return `${startLabel} - ${endTime}`;
            },
            getValue: (auction) => auction.startDate,
        },

        {
            key: "products",
            header: "Producten",
            sortable: true,
            // Aantal gekoppelde producten (fallback op products array)
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
            // Status wordt berekend op basis van veilingdata + huidige tijd
            render: (auction) => (
                <StatusBadge status={deriveAuctionUiStatus(auction, now)} />
            ),
            getValue: (auction) => deriveAuctionUiStatus(auction, now),
        },

        {
            key: "actions",
            header: "Acties",
            render: (auction) => {
                // Status + regels voor knoppen
                const status = deriveAuctionUiStatus(auction, now);

                const isActive = status === "active";
                const hasEnded = new Date(auction.endDate) < now;

                // Annuleren mag niet na afloop en niet als al geannuleerd
                const canCancel = !hasEnded && status !== "deleted";

                return (
                    <div className="d-flex justify-content-end gap-2">
                        {/* Producten koppelen: niet toegestaan tijdens actieve veiling */}
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={(event) => {
                                event.stopPropagation(); // geen rij-click
                                onOpenLinkProducts(auction.id);
                            }}
                            disabled={isActive}
                            title={isActive ? "Actieve veiling" : undefined}
                        >
                            Koppel producten
                        </button>

                        {/* Annuleren: alleen als het nog kan volgens regels */}
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                onCancelAuction(auction.id);
                            }}
                            disabled={!canCancel}
                            title={!canCancel ? "Annuleren niet meer mogelijk" : undefined}
                        >
                            Annuleer
                        </button>
                    </div>
                );
            },
        },
    ];

    // Gepagineerde rijen voor huidige pagina
    const pagedRows = useMemo(
        () => paginate(filtered, page, pageSize),
        [filtered, page, pageSize]
    );

    return (
        <section className="card border-0 shadow-sm rounded-4" aria-label="Veilingen">
            <div className="card-body p-4 d-flex flex-column gap-3">
                {/* Filters + zoeken + actions boven de tabel */}
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

                {/* Tabel met paginering + empty state */}
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
