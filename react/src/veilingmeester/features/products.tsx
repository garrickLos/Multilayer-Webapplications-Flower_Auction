import { useEffect, useMemo, useState, type ChangeEvent, type JSX } from "react";
import { createProduct, deleteProduct, getProduct, listProducts, type ApiError, updateProduct } from "../api";
import { Modal } from "../Modal";
import { Table, type TableColumn } from "../components/Table";
import { Section, InputField, FormRow, ErrorNotice, SuccessNotice } from "../components/ui";
import type {
    PaginatedResult,
    VeilingproductCreateDto,
    VeilingproductDetailDto,
    VeilingproductListDto,
    VeilingproductUpdateDto,
} from "../types";

const defaultCreate: VeilingproductCreateDto = {
    naam: "",
    geplaatstDatum: "",
    fust: undefined,
    voorraad: undefined,
    startprijs: undefined,
    categorieNr: undefined,
    veilingNr: undefined,
    plaats: "",
    minimumprijs: undefined,
    kwekernr: undefined,
    beginDatum: "",
    status: true,
    imagePath: "",
};

export function ProductsTab(): JSX.Element {
    const [filters, setFilters] = useState({ q: "", categorieNr: "" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [data, setData] = useState<PaginatedResult<VeilingproductListDto> | null>(null);
    const [selected, setSelected] = useState<VeilingproductDetailDto | null>(null);
    const [form, setForm] = useState<VeilingproductCreateDto>(defaultCreate);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await listProducts({
                q: filters.q || undefined,
                categorieNr: filters.categorieNr ? Number(filters.categorieNr) : undefined,
                page,
                pageSize,
            });
            setData(response);
        } catch (err) {
            setError((err as ApiError).message ?? "Kan producten niet laden");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.q, filters.categorieNr, page, pageSize]);

    const columns: TableColumn<VeilingproductListDto>[] = useMemo(
        () => [
            { header: "Naam", render: (row) => row.naam ?? "-" },
            { header: "Categorie", render: (row) => row.categorie ?? "-" },
            { header: "Startprijs", render: (row) => (row.startprijs ?? 0).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) },
            { header: "Voorraad", render: (row) => row.voorraad ?? 0 },
            {
                header: "Acties",
                render: (row) => (
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => void handleSelect(row.veilingProductNr)}>
                            Details
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => void handleDelete(row.veilingProductNr)}>
                            Verwijder
                        </button>
                    </div>
                ),
            },
        ],
        [],
    );

    const onFormChange = (field: keyof VeilingproductCreateDto | keyof VeilingproductUpdateDto) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            const value = event.target.type === "number" ? Number(event.target.value) || undefined : event.target.value;
            setForm((prev) => ({ ...prev, [field]: event.target.type === "checkbox" ? event.target.checked : value }));
        };

    const resetForm = () => setForm(defaultCreate);

    const handleCreate = async () => {
        try {
            const created = await createProduct(form);
            setSuccess("Product aangemaakt");
            setData((prev) =>
                prev
                    ? { ...prev, items: [created, ...prev.items], totalCount: (prev.totalCount ?? 0) + 1 }
                    : { items: [created], page: 1, pageSize: 10, hasNext: false },
            );
            resetForm();
        } catch (err) {
            setError((err as ApiError).message ?? "Product kon niet worden aangemaakt");
        }
    };

    const handleSelect = async (id?: number) => {
        if (!id) return;
        try {
            const detail = await getProduct(id);
            setSelected(detail);
            setForm({
                naam: detail.naam ?? "",
                geplaatstDatum: detail.geplaatstDatum ?? "",
                fust: detail.fust,
                voorraad: detail.voorraad,
                startprijs: detail.startprijs,
                categorieNr: undefined,
                veilingNr: detail.veilingNr ?? undefined,
                plaats: detail.plaats ?? "",
                minimumprijs: detail.minimumprijs,
                kwekernr: detail.kwekernr,
                beginDatum: detail.beginDatum ?? "",
                status: detail.status,
                imagePath: detail.imagePath ?? "",
            });
        } catch (err) {
            setError((err as ApiError).message ?? "Kan productdetails niet laden");
        }
    };

    const handleUpdate = async () => {
        if (!selected?.veilingProductNr) return;
        try {
            const payload: VeilingproductUpdateDto = {
                naam: form.naam,
                geplaatstDatum: form.geplaatstDatum,
                fust: form.fust,
                voorraad: form.voorraad,
                startprijs: form.startprijs,
                categorieNr: form.categorieNr,
                veilingNr: form.veilingNr,
                kwekernr: form.kwekernr,
                plaats: form.plaats,
                minimumprijs: form.minimumprijs,
                beginDatum: form.beginDatum,
                status: form.status,
                imagePath: form.imagePath,
            };
            const updated = await updateProduct(selected.veilingProductNr, payload);
            setSelected(updated);
            setData((prev) =>
                prev ? { ...prev, items: prev.items.map((item) => (item.veilingProductNr === updated.veilingProductNr ? updated : item)) } : prev,
            );
            setSuccess("Product bijgewerkt");
        } catch (err) {
            setError((err as ApiError).message ?? "Product kon niet worden bijgewerkt");
        }
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!window.confirm("Weet je zeker dat je dit product wilt verwijderen?")) return;
        try {
            await deleteProduct(id);
            setData((prev) => (prev ? { ...prev, items: prev.items.filter((item) => item.veilingProductNr !== id) } : prev));
            if (selected?.veilingProductNr === id) setSelected(null);
        } catch (err) {
            setError((err as ApiError).message ?? "Product kon niet worden verwijderd");
        }
    };

    return (
        <Section title="Producten">
            <FormRow>
                <InputField id="product-q" label="Zoek" value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} />
                <InputField
                    id="product-categorie"
                    label="Categorie nr"
                    value={filters.categorieNr}
                    onChange={(e) => setFilters((prev) => ({ ...prev, categorieNr: e.target.value }))}
                    type="number"
                />
                <InputField
                    id="product-page"
                    label="Pagina"
                    value={page}
                    type="number"
                    onChange={(e) => setPage(Number(e.target.value) || 1)}
                />
                <InputField
                    id="product-pageSize"
                    label="Per pagina"
                    value={pageSize}
                    type="number"
                    onChange={(e) => setPageSize(Number(e.target.value) || 10)}
                />
                <button className="btn btn-success align-self-end" type="button" onClick={() => void load()} disabled={loading}>
                    Verversen
                </button>
            </FormRow>

            {error && <ErrorNotice message={error} />}
            {success && <SuccessNotice message={success} />}

            <Table columns={columns} rows={data?.items ?? []} />

            <hr />
            <h3 className="h6">Nieuw product</h3>
            <FormRow>
                <InputField id="product-naam" label="Naam" value={form.naam} onChange={onFormChange("naam") as any} />
                <InputField id="product-image" label="Afbeelding pad" value={form.imagePath} onChange={onFormChange("imagePath") as any} />
                <InputField id="product-plaats" label="Plaats" value={form.plaats} onChange={onFormChange("plaats") as any} />
                <InputField id="product-categorieNr" label="Categorie nr" value={form.categorieNr ?? ""} onChange={onFormChange("categorieNr") as any} type="number" />
                <InputField id="product-startprijs" label="Startprijs" value={form.startprijs ?? ""} onChange={onFormChange("startprijs") as any} type="number" />
                <InputField id="product-voorraad" label="Voorraad" value={form.voorraad ?? ""} onChange={onFormChange("voorraad") as any} type="number" />
            </FormRow>
            <button className="btn btn-primary" type="button" onClick={() => void handleCreate()}>
                Aanmaken
            </button>

            {selected && (
                <Modal title={`Product ${selected.naam ?? selected.veilingProductNr}`} onClose={() => setSelected(null)}>
                    <div className="d-flex flex-column gap-3">
                        <FormRow>
                            <InputField id="edit-product-naam" label="Naam" value={form.naam} onChange={onFormChange("naam") as any} />
                            <InputField id="edit-product-image" label="Afbeelding" value={form.imagePath} onChange={onFormChange("imagePath") as any} />
                            <InputField id="edit-product-plaats" label="Plaats" value={form.plaats} onChange={onFormChange("plaats") as any} />
                            <InputField id="edit-product-start" label="Startprijs" value={form.startprijs ?? ""} type="number" onChange={onFormChange("startprijs") as any} />
                        </FormRow>
                        <FormRow>
                            <InputField id="edit-product-voorraad" label="Voorraad" value={form.voorraad ?? ""} type="number" onChange={onFormChange("voorraad") as any} />
                            <InputField id="edit-product-fust" label="Fust" value={form.fust ?? ""} type="number" onChange={onFormChange("fust") as any} />
                            <InputField id="edit-product-min" label="Minimumprijs" value={form.minimumprijs ?? ""} type="number" onChange={onFormChange("minimumprijs") as any} />
                        </FormRow>
                        <div>
                            <button className="btn btn-primary me-2" type="button" onClick={() => void handleUpdate()}>
                                Bijwerken
                            </button>
                            <button className="btn btn-outline-secondary" type="button" onClick={() => setSelected(null)}>
                                Sluiten
                            </button>
                        </div>
                        <div>
                            <h6>Biedingen</h6>
                            <ul className="list-unstyled mb-0">
                                {selected.biedingen?.map((bid) => (
                                    <li key={bid.biedNr}>
                                        #{bid.biedNr} – €{bid.bedragPerFust} x {bid.aantalStuks}
                                    </li>
                                )) ?? <li className="text-muted">Geen biedingen</li>}
                            </ul>
                        </div>
                    </div>
                </Modal>
            )}
        </Section>
    );
}
