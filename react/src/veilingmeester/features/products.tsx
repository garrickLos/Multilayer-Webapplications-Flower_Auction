import { useMemo, useState, type JSX } from "react";
import {
    DataTable,
    EmptyState,
    FilterChip,
    InlineAlert,
    LoadingPlaceholder,
    Pager,
    SearchField,
    SmallSelectField,
    StatusBadge,
} from "../components/ui.tsx";
import { appConfig } from "../config";
import { Modal } from "../Modal";
import { useProductCatalog, useProducts } from "../hooks";
import type { UserRow, VeilingProductRow } from "../types";
import { formatCurrency } from "../utils";

const statusOptions = [
    { value: "alle", label: "Alle" },
    { value: "actief", label: "Actief" },
    { value: "inactief", label: "Inactief" },
];

const productColumns = [
    { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
    {
        key: "naam",
        header: "Naam",
        sortable: true,
        render: (row: VeilingProductRow) => (
            <div className="d-flex align-items-center gap-2">
                {row.image && (
                    <img
                        src={row.image}
                        alt=""
                        width={appConfig.ui.productThumbnailSize}
                        height={appConfig.ui.productThumbnailSize}
                        className="rounded"
                    />
                )}
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
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<(typeof statusOptions)[number]["value"]>("alle");

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const matchesStatus = status === "alle" || row.status === (status === "actief" ? "active" : "inactive");
            const matchesSearch =
                !search || row.naam.toLowerCase().includes(search.toLowerCase()) || String(row.id).includes(search.trim());
            return matchesStatus && matchesSearch;
        });
    }, [rows, search, status]);

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
            searchLabel="Zoeken"
            searchPlaceholder="Productnaam of nummer"
            searchValue={search}
            onSearchChange={setSearch}
            filters={
                <SmallSelectField
                    label="Status"
                    value={status}
                    onChange={(value) => setStatus(value as (typeof statusOptions)[number]["value"])}
                    options={statusOptions}
                />
            }
            footer={
                <button type="button" className="btn btn-success" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <div className="col-6 col-lg-3">
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
            ) : filteredRows.length === 0 ? (
                <EmptyState message="Geen producten gevonden." />
            ) : (
                <DataTable
                    columns={productColumns}
                    rows={filteredRows}
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
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, search, setSearch } =
        useProductCatalog();
    const perPage = appConfig.pagination.table.map((size) => ({ value: size, label: String(size) }));
    const [status, setStatus] = useState<(typeof statusOptions)[number]["value"]>("alle");

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const matchesStatus = status === "alle" || row.status === (status === "actief" ? "active" : "inactive");
            const matchesSearch =
                !search || row.naam.toLowerCase().includes(search.toLowerCase()) || String(row.id).includes(search.trim());
            return matchesStatus && matchesSearch;
        });
    }, [rows, search, status]);

    return (
        <section className="d-flex flex-column gap-3" aria-label="Productcatalogus">
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-6 col-lg-4">
                            <SearchField label="Zoeken" value={search} onChange={setSearch} placeholder="Productnaam" />
                        </div>
                        <div className="col-6 col-md-3 col-lg-2">
                            <SmallSelectField
                                label="Status"
                                value={status}
                                onChange={(value) => setStatus(value as (typeof statusOptions)[number]["value"])}
                                options={statusOptions}
                            />
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

            <div className="d-flex flex-wrap gap-2" aria-label="Actieve filters">
                {status !== "alle" && <FilterChip label={`Status: ${status}`} onRemove={() => setStatus("alle")} />}
                {search && <FilterChip label={`Zoek: ${search}`} onRemove={() => setSearch("")} />}
                {status === "alle" && !search && <span className="text-muted small">Geen filters actief.</span>}
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : filteredRows.length === 0 ? (
                <EmptyState message="Geen producten gevonden." />
            ) : (
                <DataTable
                    columns={productColumns}
                    rows={filteredRows}
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
