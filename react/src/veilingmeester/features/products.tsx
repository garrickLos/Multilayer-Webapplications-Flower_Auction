import { useMemo, type JSX } from "react";
import {
    DataTable,
    EmptyState,
    InlineAlert,
    LoadingPlaceholder,
    Pager,
    SmallSelectField,
    StatusBadge,
} from "../components";
import { appConfig } from "../config";
import { Modal } from "../Modal";
import { useVeilingProductsByGrower } from "../hooks";
import type { UserRow, VeilingProductRow } from "../types";
import { formatCurrency } from "../utils";

export type ProductsModalProps = {
    readonly user: UserRow;
    readonly onClose: () => void;
};

/**
 * Presents paginated products for a selected grower.
 */
export function ProductsModal({ user, onClose }: ProductsModalProps): JSX.Element {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults } =
        useVeilingProductsByGrower(user.id);

    const perPageOptions = useMemo(
        () => appConfig.pagination.modal.map((size) => ({ value: size, label: String(size) })),
        [],
    );

    const thumbnailSize = appConfig.ui.productThumbnailSize;

    const columns = useMemo(
        () => [
            {
                key: "id",
                header: "#",
                sortable: true,
                headerClassName: "text-nowrap",
                cellClassName: "text-nowrap",
            },
            {
                key: "naam",
                header: "Product",
                sortable: true,
                render: (row: VeilingProductRow) => (
                    <div className="d-flex align-items-center gap-3">
                        {row.image ? (
                            <img
                                src={row.image}
                                alt=""
                                width={thumbnailSize}
                                height={thumbnailSize}
                                className="rounded-3 border border-success-subtle object-fit-cover flex-shrink-0"
                            />
                        ) : (
                            <span className="badge bg-success-subtle text-success-emphasis">Geen afbeelding</span>
                        )}
                        <div>
                            <div className="fw-semibold text-break">{row.naam}</div>
                            <div className="text-muted small">{row.categorie || "Categorie onbekend"}</div>
                        </div>
                    </div>
                ),
                getValue: (row: VeilingProductRow) => row.naam,
            },
            {
                key: "voorraad",
                header: "Voorraad (bloemen)",
                sortable: true,
                render: (row: VeilingProductRow) => (row.voorraad != null ? row.voorraad : "—"),
                getValue: (row: VeilingProductRow) => row.voorraad ?? "",
            },
            {
                key: "fust",
                header: "Fust",
                sortable: true,
                render: (row: VeilingProductRow) => (row.fust != null ? row.fust : "—"),
                getValue: (row: VeilingProductRow) => row.fust ?? "",
            },
            {
                key: "piecesPerBundle",
                header: "Stuks/bundel",
                sortable: true,
                render: (row: VeilingProductRow) => (row.piecesPerBundle != null ? row.piecesPerBundle : "—"),
                getValue: (row: VeilingProductRow) => row.piecesPerBundle ?? "",
            },
            {
                key: "minPrice",
                header: "Min. prijs",
                sortable: true,
                render: (row: VeilingProductRow) => formatCurrency(row.minPrice),
                getValue: (row: VeilingProductRow) => row.minPrice,
            },
            {
                key: "maxPrice",
                header: "Max. prijs",
                sortable: true,
                render: (row: VeilingProductRow) => formatCurrency(row.maxPrice),
                getValue: (row: VeilingProductRow) => row.maxPrice,
            },
            {
                key: "status",
                header: "Status",
                sortable: true,
                render: (row: VeilingProductRow) => <StatusBadge status={row.status} />,
                getValue: (row: VeilingProductRow) => row.status,
            },
        ],
        [thumbnailSize],
    );

    return (
        <Modal
            title={
                <div>
                    <div className="fw-semibold">Producten kweker {user.naam}</div>
                    <div className="text-muted small">#{user.id}</div>
                </div>
            }
            onClose={onClose}
            size="xl"
            footer={
                <button type="button" className="btn btn-success" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <div className="d-flex flex-column gap-2 mb-3">
                <p className="text-uppercase text-success-emphasis small fw-semibold mb-0">Overzicht</p>
                <p className="text-muted small mb-0">Selecteer het aantal resultaten per pagina.</p>
            </div>

            <div className="row g-3 align-items-end mb-3">
                <div className="col-6 col-lg-2">
                    <SmallSelectField<number>
                        label="Per pagina"
                        value={pageSize}
                        onChange={setPageSize}
                        options={perPageOptions}
                        parse={(raw) => Number(raw)}
                    />
                </div>
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : rows.length === 0 ? (
                <EmptyState message="Geen producten gevonden." />
            ) : (
                <DataTable
                    columns={columns}
                    rows={rows}
                    totalResults={totalResults}
                    empty={<EmptyState message="Geen producten gevonden." />}
                    getRowKey={(row) => String(row.id)}
                />
            )}

            <Pager
                page={page}
                pageSize={pageSize}
                hasNext={hasNext}
                onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setPage((prev) => prev + 1)}
                totalResults={totalResults}
            />
        </Modal>
    );
}
