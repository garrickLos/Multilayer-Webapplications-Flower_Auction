import { useEffect, useState, type JSX } from "react";
import {
    createVeilingproduct,
    deleteVeilingproduct,
    listCategorieen,
    listVeilingproducten,
    updateVeilingproduct,
} from "../api";
import { Modal } from "../Modal";
import { Table, type TableColumn } from "../components/Table";
import { EmptyState, Field, Input, Select, StatusBadge } from "../components/ui";
import { appConfig } from "../config";
import type {
    CategorieListDto,
    StatusLabel,
    VeilingproductCreateDto,
    VeilingproductListDto,
    VeilingproductUpdateDto,
} from "../types";
import { formatCurrency, formatDate, normaliseStatus, toDateInputValue, toDateTimeLocalValue } from "../utils";

const { table: tablePageSizeOptions } = appConfig.pagination;

const emptyForm: VeilingproductCreateDto = {
    Naam: "",
    GeplaatstDatum: "",
    Fust: 1,
    Voorraad: 0,
    Startprijs: 0,
    CategorieNr: 0,
    VeilingNr: null,
    Plaats: "",
    Minimumprijs: 1,
    Kwekernr: 1,
    BeginDatum: "",
    Status: true,
    ImagePath: "",
};

export function ProductsTab(): JSX.Element {
    const [rows, setRows] = useState<VeilingproductListDto[]>([]);
    const [categories, setCategories] = useState<CategorieListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(tablePageSizeOptions[0]);
    const [total, setTotal] = useState<number | undefined>();
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<number | "">("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [modalState, setModalState] = useState<{ mode: "create" | "edit"; product?: VeilingproductListDto } | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [productResult, categoryResult] = await Promise.all([
                    listVeilingproducten({
                        page,
                        pageSize,
                        q: search || undefined,
                        categorieNr: categoryFilter === "" ? undefined : Number(categoryFilter),
                        signal: controller.signal,
                    }),
                    listCategorieen(controller.signal),
                ]);
                setRows(productResult.items);
                setTotal(productResult.totalCount);
                setCategories(categoryResult);
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Kon producten niet laden");
            } finally {
                setLoading(false);
            }
        };
        void load();
        return () => controller.abort();
    }, [categoryFilter, page, pageSize, refreshKey, search]);

    const columns: TableColumn<VeilingproductListDto>[] = [
        { key: "VeilingProductNr", header: "#", render: (row) => row.VeilingProductNr },
        { key: "Naam", header: "Naam", sortable: true },
        { key: "Startprijs", header: "Startprijs", render: (row) => formatCurrency(row.Startprijs) },
        { key: "Voorraad", header: "Voorraad", render: (row) => row.Voorraad },
        { key: "Minimumprijs", header: "Minimum", render: (row) => formatCurrency(row.Minimumprijs) },
        { key: "Categorie", header: "Categorie", render: (row) => row.Categorie ?? "—" },
        { key: "VeilingNr", header: "Veiling", render: (row) => row.VeilingNr ?? "—" },
        { key: "Kwekernr", header: "Kwekernr", render: (row) => row.Kwekernr },
        { key: "BeginDatum", header: "Begin", render: (row) => formatDate(row.BeginDatum) },
        {
            key: "Status",
            header: "Status",
            render: (row) => <StatusBadge status={normaliseStatus(row.Status ? "active" : "inactive")} />,
        },
        {
            key: "actions",
            header: "Acties",
            render: (row) => (
                <div className="d-flex gap-2 justify-content-end">
                    <button type="button" className="btn btn-outline-success btn-sm" onClick={() => setModalState({ mode: "edit", product: row })}>
                        Bewerken
                    </button>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(row.VeilingProductNr)}>
                        Verwijderen
                    </button>
                </div>
            ),
        },
    ];

    const handleSave = async (draft: VeilingproductCreateDto | VeilingproductUpdateDto, id?: number) => {
        try {
            if (id) await updateVeilingproduct(id, draft as VeilingproductUpdateDto);
            else await createVeilingproduct(draft as VeilingproductCreateDto);
            setModalState(null);
            setPage(1);
            setRefreshKey((value) => value + 1);
        } catch (err) {
            setError((err as { message?: string }).message ?? "Opslaan mislukt");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Verwijder dit product?")) return;
        try {
            await deleteVeilingproduct(id);
            setRows((prev) => prev.filter((row) => row.VeilingProductNr !== id));
            setTotal((prev) => (prev ? Math.max(prev - 1, 0) : prev));
            setRefreshKey((value) => value + 1);
        } catch (err) {
            setError((err as { message?: string }).message ?? "Verwijderen mislukt");
        }
    };

    const filters = (
        <div className="d-flex gap-3 flex-wrap">
            <Field label="Categorie">
                <select
                    className="form-select border-success-subtle"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value === "" ? "" : Number(event.target.value))}
                >
                    <option value="">Alle</option>
                    {categories.map((cat) => (
                        <option key={cat.CategorieNr} value={cat.CategorieNr}>
                            {cat.Naam}
                        </option>
                    ))}
                </select>
            </Field>
        </div>
    );

    return (
        <section className="d-flex flex-column gap-3" aria-label="Producten">
            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <div className="flex-grow-1">
                    <Field label="Zoeken">
                        <Input value={search} onChange={setSearch} placeholder="Productnaam" />
                    </Field>
                </div>
                <button type="button" className="btn btn-success" onClick={() => setModalState({ mode: "create" })}>
                    Nieuw product
                </button>
            </div>

            {error && <div className="alert alert-danger mb-0">{error}</div>}
            {loading && <div className="alert alert-info mb-0">Laden…</div>}

            <Table
                columns={columns}
                rows={rows}
                getRowId={(row) => row.VeilingProductNr}
                filters={filters}
                page={page}
                pageSize={pageSize}
                totalCount={total}
                serverPaginated
                pageSizeOptions={tablePageSizeOptions}
                onPageChange={setPage}
                onPageSizeChange={(value) => {
                    setPageSize(value);
                    setPage(1);
                }}
                emptyMessage={<EmptyState message="Geen producten" />}
            />

            {modalState && (
                <ProductModal
                    categories={categories}
                    mode={modalState.mode}
                    product={modalState.product}
                    onClose={() => setModalState(null)}
                    onSave={handleSave}
                />
            )}
        </section>
    );
}

type ProductModalProps = {
    mode: "create" | "edit";
    product?: VeilingproductListDto;
    categories: CategorieListDto[];
    onClose: () => void;
    onSave: (draft: VeilingproductCreateDto | VeilingproductUpdateDto, id?: number) => void;
};

function ProductModal({ mode, product, categories, onClose, onSave }: ProductModalProps): JSX.Element {
    const [form, setForm] = useState<VeilingproductCreateDto | VeilingproductUpdateDto>(() =>
        product
            ? {
                  Naam: product.Naam,
                  GeplaatstDatum: toDateTimeLocalValue(product.GeplaatstDatum),
                  Fust: product.Fust,
                  Voorraad: product.Voorraad,
                  Startprijs: product.Startprijs,
                  CategorieNr: categories.find((c) => c.Naam === product.Categorie)?.CategorieNr ?? 0,
                  VeilingNr: product.VeilingNr ?? null,
                  Plaats: product.Plaats,
                  Minimumprijs: product.Minimumprijs,
                  Kwekernr: product.Kwekernr,
                  BeginDatum: toDateInputValue(product.BeginDatum),
                  Status: product.Status,
                  ImagePath: product.ImagePath,
              }
            : emptyForm,
    );

    const update = <K extends keyof (VeilingproductCreateDto & VeilingproductUpdateDto)>(key: K, value: (VeilingproductCreateDto & VeilingproductUpdateDto)[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <Modal
            title={mode === "create" ? "Nieuw product" : `Product #${product?.VeilingProductNr}`}
            onClose={onClose}
            footer={
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-success" onClick={onClose}>
                        Annuleren
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => onSave(form, product?.VeilingProductNr)}>
                        Opslaan
                    </button>
                </div>
            }
        >
            <div className="row g-3">
                <div className="col-12">
                    <Field label="Naam">
                        <Input value={form.Naam} onChange={(value) => update("Naam", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Fust">
                        <Input type="number" value={form.Fust} min={1} onChange={(value) => update("Fust", Number(value) || 0)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Voorraad">
                        <Input type="number" value={form.Voorraad} min={0} onChange={(value) => update("Voorraad", Number(value) || 0)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Startprijs">
                        <Input type="number" value={form.Startprijs} min={0} onChange={(value) => update("Startprijs", Number(value) || 0)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Minimumprijs">
                        <Input type="number" value={form.Minimumprijs} min={1} onChange={(value) => update("Minimumprijs", Number(value) || 0)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Categorie">
                        <select
                            className="form-select border-success-subtle"
                            value={form.CategorieNr}
                            onChange={(event) => update("CategorieNr", Number(event.target.value))}
                        >
                            <option value={0}>Selecteer</option>
                            {categories.map((cat) => (
                                <option key={cat.CategorieNr} value={cat.CategorieNr}>
                                    {cat.Naam}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="VeilingNr (optioneel)">
                        <Input
                            type="number"
                            value={form.VeilingNr ?? ""}
                            onChange={(value) => update("VeilingNr", value === "" ? null : Number(value))}
                        />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Kwekernr">
                        <Input type="number" value={form.Kwekernr} min={1} onChange={(value) => update("Kwekernr", Number(value) || 0)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Plaats">
                        <Input value={form.Plaats} onChange={(value) => update("Plaats", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Begin datum">
                        <Input type="date" value={form.BeginDatum} onChange={(value) => update("BeginDatum", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Geplaatst datum">
                        <Input
                            type="datetime-local"
                            value={form.GeplaatstDatum ?? ""}
                            onChange={(value) => update("GeplaatstDatum", value)}
                        />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Status">
                        <select
                            className="form-select border-success-subtle"
                            value={form.Status ? "true" : "false"}
                            onChange={(event) => update("Status", event.target.value === "true")}
                        >
                            <option value="true">Actief</option>
                            <option value="false">Inactief</option>
                        </select>
                    </Field>
                </div>
                <div className="col-12">
                    <Field label="Afbeelding pad">
                        <Input value={form.ImagePath} onChange={(value) => update("ImagePath", value)} />
                    </Field>
                </div>
            </div>
        </Modal>
    );
}
