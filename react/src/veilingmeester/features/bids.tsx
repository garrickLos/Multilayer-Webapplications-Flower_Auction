import { useEffect, useState, type ChangeEvent, type JSX } from "react";
import { createBid, deleteBid, getBid, listBids, type ApiError, updateBid } from "../api";
import { Section, InputField, FormRow, ErrorNotice, SuccessNotice } from "../components/ui";
import { Table, type TableColumn } from "../components/Table";
import { Modal } from "../Modal";
import type { BiedingCreateDto, BiedingUpdateDto, PaginatedResult, VeilingMeester_BiedingDto } from "../types";

const defaultBid: BiedingCreateDto = {
    bedragPerFust: undefined,
    aantalStuks: undefined,
    gebruikerNr: undefined,
    veilingNr: undefined,
    veilingproductNr: undefined,
    biedingNr: undefined,
};

export function BidsTab(): JSX.Element {
    const [filters, setFilters] = useState({ gebruikerNr: "", veilingNr: "" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [data, setData] = useState<PaginatedResult<VeilingMeester_BiedingDto> | null>(null);
    const [selected, setSelected] = useState<VeilingMeester_BiedingDto | null>(null);
    const [form, setForm] = useState<BiedingCreateDto>(defaultBid);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = async () => {
        setError(null);
        try {
            const response = await listBids({
                gebruikerNr: filters.gebruikerNr ? Number(filters.gebruikerNr) : undefined,
                veilingNr: filters.veilingNr ? Number(filters.veilingNr) : undefined,
                page,
                pageSize,
            });
            setData(response);
        } catch (err) {
            setError((err as ApiError).message ?? "Kan biedingen niet laden");
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.gebruikerNr, filters.veilingNr, page, pageSize]);

    const onChange = (field: keyof BiedingCreateDto | keyof BiedingUpdateDto) => (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.type === "number" ? Number(event.target.value) || undefined : event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreate = async () => {
        try {
            const created = await createBid(form);
            setSuccess("Bieding aangemaakt");
            setData((prev) =>
                prev ? { ...prev, items: [created, ...(prev.items ?? [])], totalCount: (prev.totalCount ?? 0) + 1 } : { items: [created], page: 1, pageSize, hasNext: false },
            );
            setForm(defaultBid);
        } catch (err) {
            setError((err as ApiError).message ?? "Bieding kon niet worden aangemaakt");
        }
    };

    const handleSelect = async (id?: number) => {
        if (!id) return;
        try {
            const detail = await getBid(id);
            setSelected(detail);
            setForm({
                bedragPerFust: detail.bedragPerFust,
                aantalStuks: detail.aantalStuks,
                gebruikerNr: detail.gebruikerNr,
                veilingNr: detail.veilingNr,
                veilingproductNr: detail.veilingProductNr,
                biedingNr: detail.biedingNr,
            });
        } catch (err) {
            setError((err as ApiError).message ?? "Kan bieding niet laden");
        }
    };

    const handleUpdate = async () => {
        if (!selected?.biedingNr) return;
        const payload: BiedingUpdateDto = { bedragPerFust: form.bedragPerFust, aantalStuks: form.aantalStuks };
        try {
            const updated = await updateBid(selected.biedingNr, payload);
            setSelected(updated);
            setData((prev) =>
                prev ? { ...prev, items: prev.items.map((bid) => (bid.biedingNr === updated.biedingNr ? updated : bid)) } : prev,
            );
            setSuccess("Bieding bijgewerkt");
        } catch (err) {
            setError((err as ApiError).message ?? "Bieding kon niet worden bijgewerkt");
        }
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!window.confirm("Weet je zeker dat je deze bieding wilt verwijderen?")) return;
        try {
            await deleteBid(id);
            setData((prev) => (prev ? { ...prev, items: prev.items.filter((bid) => bid.biedingNr !== id) } : prev));
            if (selected?.biedingNr === id) setSelected(null);
        } catch (err) {
            setError((err as ApiError).message ?? "Bieding kon niet worden verwijderd");
        }
    };

    const columns: TableColumn<VeilingMeester_BiedingDto>[] = [
        { header: "Nr", render: (row) => row.biedingNr ?? "-" },
        { header: "Bedrag", render: (row) => row.bedragPerFust },
        { header: "Aantal", render: (row) => row.aantalStuks },
        { header: "Gebruiker", render: (row) => row.gebruikerNr },
        { header: "Veiling", render: (row) => row.veilingNr },
        {
            header: "Acties",
            render: (row) => (
                <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => void handleSelect(row.biedingNr)}>
                        Bewerken
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => void handleDelete(row.biedingNr)}>
                        Verwijder
                    </button>
                </div>
            ),
        },
    ];

    return (
        <Section title="Biedingen">
            <FormRow>
                <InputField
                    id="bid-user"
                    label="Gebruiker nr"
                    value={filters.gebruikerNr}
                    onChange={(e) => setFilters((prev) => ({ ...prev, gebruikerNr: e.target.value }))}
                    type="number"
                />
                <InputField
                    id="bid-auction"
                    label="Veiling nr"
                    value={filters.veilingNr}
                    onChange={(e) => setFilters((prev) => ({ ...prev, veilingNr: e.target.value }))}
                    type="number"
                />
                <InputField id="bid-page" label="Pagina" value={page} type="number" onChange={(e) => setPage(Number(e.target.value) || 1)} />
                <InputField id="bid-pageSize" label="Per pagina" value={pageSize} type="number" onChange={(e) => setPageSize(Number(e.target.value) || 10)} />
                <button className="btn btn-success align-self-end" type="button" onClick={() => void load()}>
                    Verversen
                </button>
            </FormRow>

            {error && <ErrorNotice message={error} />}
            {success && <SuccessNotice message={success} />}

            <Table columns={columns} rows={data?.items ?? []} />

            <hr />
            <h3 className="h6">{selected ? "Bieding bijwerken" : "Nieuwe bieding"}</h3>
            <FormRow>
                <InputField id="bid-bedrag" label="Bedrag per fust" value={form.bedragPerFust ?? ""} type="number" onChange={onChange("bedragPerFust") as any} />
                <InputField id="bid-aantal" label="Aantal stuks" value={form.aantalStuks ?? ""} type="number" onChange={onChange("aantalStuks") as any} />
                <InputField id="bid-userNr" label="Gebruiker nr" value={form.gebruikerNr ?? ""} type="number" onChange={onChange("gebruikerNr") as any} />
                <InputField id="bid-veilingNr" label="Veiling nr" value={form.veilingNr ?? ""} type="number" onChange={onChange("veilingNr") as any} />
                <InputField id="bid-productNr" label="Veilingproduct nr" value={form.veilingproductNr ?? ""} type="number" onChange={onChange("veilingproductNr") as any} />
            </FormRow>
            <button className="btn btn-primary me-2" type="button" onClick={() => void (selected ? handleUpdate() : handleCreate())}>
                {selected ? "Opslaan" : "Aanmaken"}
            </button>
            {selected && (
                <button className="btn btn-outline-secondary" type="button" onClick={() => { setSelected(null); setForm(defaultBid); }}>
                    Annuleren
                </button>
            )}

            {selected && (
                <Modal title={`Bieding ${selected.biedingNr}`} onClose={() => setSelected(null)}>
                    <div className="d-flex flex-column gap-2">
                        <div>Bedrag per fust: €{selected.bedragPerFust}</div>
                        <div>Aantal: {selected.aantalStuks}</div>
                        <div>Gebruiker: {selected.gebruikerNr}</div>
                        <div>Veiling: {selected.veilingNr}</div>
                        <div>Product: {selected.veilingProductNr}</div>
                    </div>
                </Modal>
            )}
        </Section>
    );
}
