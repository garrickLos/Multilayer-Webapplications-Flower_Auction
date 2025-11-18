import type { JSX } from "react";
import { DataTable, EmptyState, InlineAlert, LoadingPlaceholder, Pager, SearchField, SmallSelectField, StatusBadge } from "../components/ui.tsx";
import { appConfig } from "../config";
import { Modal } from "../Modal";
import { useProductCatalog, useProducts } from "../hooks";
import type { UserRow, VeilingProductRow } from "../types";
import { formatCurrency } from "../utils";

const productColumns = [
    { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
    {
        key: "naam",
        header: "Naam",
        sortable: true,
        render: (row: VeilingProductRow) => (
            <div className="d-flex align-items-center gap-2">
                {row.image && <img src={row.image} alt="" width={appConfig.ui.productThumbnailSize} height={appConfig.ui.productThumbnailSize} className="rounded" />}
                <div className="d-flex flex-column">
                    <span className="fw-semibold text-break">{row.naam}</span>
                    <span className="text-muted small">#{row.id}</span>
                </div>
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
        key: "voorraad",
        header: "Voorraad",
        sortable: true,
        render: (row: VeilingProductRow) => (row.voorraad != null ? row.voorraad : "—"),
        getValue: (row: VeilingProductRow) => row.voorraad ?? 0,
    },
    {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row: VeilingProductRow) => <StatusBadge status={row.status} />,
        getValue: (row: VeilingProductRow) => row.status,
    },
];

export function ProductsModal({ user, onClose }: { readonly user: UserRow; readonly onClose: () => void }): JSX.Element {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults } = useProducts(user.id);
    const perPage = appConfig.pagination.modal.map((size) => ({ value: size, label: String(size) }));

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
            <div className="col-6 col-lg-3 mb-3">
                <SmallSelectField<number>
                    label="Per pagina"
                    value={pageSize}
                    onChange={setPageSize}
                    options={perPage}
                    parse={(raw) => Number(raw)}
                />
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : rows.length === 0 ? (
                <EmptyState message="Geen producten gevonden." />
            ) : (
                <DataTable
                    columns={productColumns}
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
                onPrevious={() => setPage(Math.max(1, page - 1))}
                onNext={() => setPage(page + 1)}
                totalResults={totalResults}
            />
        </Modal>
    );
}

export function ProductsTab(): JSX.Element {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, search, setSearch } = useProductCatalog();
    const perPage = appConfig.pagination.table.map((size) => ({ value: size, label: String(size) }));

    return (
        <section className="d-flex flex-column gap-3" aria-label="Productcatalogus">
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-6 col-lg-4">
                            <SearchField label="Zoeken" value={search} onChange={setSearch} placeholder="Productnaam" />
                        </div>
                        <div className="col-6 col-md-3 col-lg-2">
                            <SmallSelectField<number>
                                label="Per pagina"
                                value={pageSize}
                                onChange={setPageSize}
                                options={perPage}
                                parse={(raw) => Number(raw)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {search && <span className="text-muted small">Filter: {search}</span>}
            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : rows.length === 0 ? (
                <EmptyState message="Geen producten gevonden." />
            ) : (
                <DataTable
                    columns={productColumns}
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
                onPrevious={() => setPage(Math.max(1, page - 1))}
                onNext={() => setPage(page + 1)}
                totalResults={totalResults}
            />
        </section>
    );
}
