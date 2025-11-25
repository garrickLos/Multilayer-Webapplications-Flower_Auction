import { useEffect, useMemo, useState, type ChangeEvent, type JSX } from "react";
import { createAuction, deleteAuction, listAuctions, type ApiError, updateAuction } from "../api";
import { Modal } from "../Modal";
import { Section, InputField, FormRow, ErrorNotice, SuccessNotice } from "../components/ui";
import { Table, type TableColumn } from "../components/Table";
import type { PaginatedResult, VeilingCreateDto, VeilingMeester_VeilingDto, VeilingUpdateDto } from "../types";

const defaultForm: VeilingCreateDto = { veilingNaam: "", begintijd: "", eindtijd: "", status: "" };

export function AuctionsTab(): JSX.Element {
    const [filters, setFilters] = useState({ rol: "", veilingProduct: "", from: "", to: "", onlyActive: false });
    const [data, setData] = useState<PaginatedResult<VeilingMeester_VeilingDto> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selected, setSelected] = useState<VeilingMeester_VeilingDto | null>(null);
    const [form, setForm] = useState<VeilingCreateDto>(defaultForm);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await listAuctions(
                {
                    rol: filters.rol || undefined,
                    veilingProduct: filters.veilingProduct ? Number(filters.veilingProduct) : undefined,
                    from: filters.from || undefined,
                    to: filters.to || undefined,
                    onlyActive: filters.onlyActive || undefined,
                    page,
                    pageSize,
                },
            );
            setData(response);
        } catch (err) {
            setError((err as ApiError).message ?? "Kan veilingen niet laden");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.rol, filters.veilingProduct, filters.from, filters.to, filters.onlyActive, page, pageSize]);

    const resetForm = () => setForm(defaultForm);

    useEffect(() => {
        if (!selected) return;
        setForm({
            veilingNaam: selected.veilingNaam,
            begintijd: selected.begintijd,
            eindtijd: selected.eindtijd,
            status: selected.status ?? "",
        });
    }, [selected]);

    const handleCreate = async () => {
        try {
            await createAuction(form);
            setSuccess("Veiling aangemaakt");
            resetForm();
            await load();
        } catch (err) {
            setError((err as ApiError).message ?? "Veiling kon niet worden aangemaakt");
        }
    };

    const handleUpdate = async () => {
        if (!selected?.veilingNr) return;
        try {
            const payload: VeilingUpdateDto = {
                veilingNaam: form.veilingNaam,
                begintijd: form.begintijd,
                eindtijd: form.eindtijd,
            };
            await updateAuction(selected.veilingNr, payload);
            const updated: VeilingMeester_VeilingDto = { ...selected, ...payload };
            setSelected(updated);
            setData((prev) => (prev ? { ...prev, items: prev.items.map((item) => (item.veilingNr === updated.veilingNr ? updated : item)) } : prev));
            setSuccess("Veiling bijgewerkt");
        } catch (err) {
            setError((err as ApiError).message ?? "Veiling kon niet worden bijgewerkt");
        }
    };

    const handleDelete = async (id?: number | null) => {
        if (!id) return;
        if (!window.confirm("Weet je zeker dat je deze veiling wilt verwijderen?")) return;
        try {
            await deleteAuction(id);
            setData((prev) => (prev ? { ...prev, items: prev.items.filter((item) => item.veilingNr !== id) } : prev));
            if (selected?.veilingNr === id) setSelected(null);
        } catch (err) {
            setError((err as ApiError).message ?? "Verwijderen mislukt");
        }
    };

    const columns: TableColumn<VeilingMeester_VeilingDto>[] = useMemo(
        () => [
            { header: "Naam", render: (row) => row.veilingNaam },
            { header: "Status", render: (row) => row.status ?? "-" },
            { header: "Start", render: (row) => new Date(row.begintijd).toLocaleString() },
            { header: "Einde", render: (row) => new Date(row.eindtijd).toLocaleString() },
            {
                header: "Acties",
                render: (row) => (
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setSelected(row)}>
                            Details
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => void handleDelete(row.veilingNr)}>
                            Verwijder
                        </button>
                    </div>
                ),
            },
        ],
        [],
    );

    const onFormChange = (field: keyof VeilingCreateDto) => (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const selectedDetail = selected;

    return (
        <Section title="Veilingen">
            <FormRow>
                <InputField
                    id="auction-rol"
                    label="Rol"
                    value={filters.rol}
                    onChange={(e) => setFilters((prev) => ({ ...prev, rol: e.target.value }))}
                    placeholder="bijv. koper"
                />
                <InputField
                    id="auction-product"
                    label="Veilingproduct nr"
                    value={filters.veilingProduct}
                    onChange={(e) => setFilters((prev) => ({ ...prev, veilingProduct: e.target.value }))}
                    type="number"
                />
                <InputField
                    id="auction-from"
                    label="Vanaf"
                    value={filters.from}
                    onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                    type="datetime-local"
                />
                <InputField
                    id="auction-to"
                    label="Tot"
                    value={filters.to}
                    onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                    type="datetime-local"
                />
                <label className="form-check align-self-end ms-2">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={filters.onlyActive}
                        onChange={(e) => setFilters((prev) => ({ ...prev, onlyActive: e.target.checked }))}
                    />
                    <span className="form-check-label">Alleen actief</span>
                </label>
            </FormRow>

            <FormRow>
                <InputField
                    id="auction-page"
                    label="Pagina"
                    value={page}
                    type="number"
                    onChange={(e) => setPage(Number(e.target.value) || 1)}
                />
                <InputField
                    id="auction-pageSize"
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
            <h3 className="h6">Nieuwe veiling</h3>
            <FormRow>
                <InputField id="veiling-naam" label="Naam" value={form.veilingNaam} onChange={onFormChange("veilingNaam")} />
                <InputField
                    id="veiling-start"
                    label="Begintijd"
                    value={form.begintijd}
                    type="datetime-local"
                    onChange={onFormChange("begintijd")}
                />
                <InputField
                    id="veiling-einde"
                    label="Eindtijd"
                    value={form.eindtijd}
                    type="datetime-local"
                    onChange={onFormChange("eindtijd")}
                />
                <InputField id="veiling-status" label="Status" value={form.status ?? ""} onChange={onFormChange("status")} />
            </FormRow>
            <button className="btn btn-primary" type="button" onClick={() => void handleCreate()}>
                Aanmaken
            </button>

            {selectedDetail && (
                <Modal title={`Veiling ${selectedDetail.veilingNaam}`} onClose={() => setSelected(null)}>
                    <div className="d-flex flex-column gap-3">
                        <div className="d-flex flex-wrap gap-3">
                            <InputField id="edit-naam" label="Naam" value={form.veilingNaam} onChange={onFormChange("veilingNaam")} />
                            <InputField
                                id="edit-start"
                                label="Begintijd"
                                value={form.begintijd}
                                type="datetime-local"
                                onChange={onFormChange("begintijd")}
                            />
                            <InputField
                                id="edit-einde"
                                label="Eindtijd"
                                value={form.eindtijd}
                                type="datetime-local"
                                onChange={onFormChange("eindtijd")}
                            />
                        </div>
                        <div>
                            <button className="btn btn-primary me-2" type="button" onClick={() => void handleUpdate()}>
                                Bijwerken
                            </button>
                            <button className="btn btn-outline-secondary" type="button" onClick={() => setSelected(null)}>
                                Sluiten
                            </button>
                        </div>
                        <div>
                            <h6>Producten</h6>
                            <ul className="list-unstyled mb-2">
                                {selectedDetail.producten?.map((product) => (
                                    <li key={product.veilingProductNr}>{product.naam ?? "Onbekend"}</li>
                                )) ?? <li className="text-muted">Geen producten</li>}
                            </ul>
                            <h6>Biedingen</h6>
                            <ul className="list-unstyled mb-0">
                                {selectedDetail.biedingen?.map((bid) => (
                                    <li key={bid.biedingNr}>
                                        #{bid.biedingNr} – €{bid.bedragPerFust} x {bid.aantalStuks}
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
