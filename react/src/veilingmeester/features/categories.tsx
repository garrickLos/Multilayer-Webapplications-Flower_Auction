import { useEffect, useState, type JSX } from "react";
import { createCategory, deleteCategory, listCategories, type ApiError, updateCategory } from "../api";
import { Section, InputField, FormRow, ErrorNotice, SuccessNotice } from "../components/ui";
import { Table, type TableColumn } from "../components/Table";
import type { CategorieDetailDto, PaginatedResult } from "../types";

export function CategoriesTab(): JSX.Element {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [data, setData] = useState<PaginatedResult<CategorieDetailDto> | null>(null);
    const [formValue, setFormValue] = useState("");
    const [selected, setSelected] = useState<CategorieDetailDto | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = async () => {
        setError(null);
        try {
            const response = await listCategories({ q: search || undefined, page, pageSize });
            setData(response);
        } catch (err) {
            setError((err as ApiError).message ?? "Kan categorieën niet laden");
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, page, pageSize]);

    const handleCreate = async () => {
        try {
            const created = await createCategory({ naam: formValue });
            setSuccess("Categorie aangemaakt");
            setData((prev) =>
                prev ? { ...prev, items: [created, ...(prev.items ?? [])], totalCount: (prev.totalCount ?? 0) + 1 } : { items: [created], page: 1, pageSize, hasNext: false },
            );
            setFormValue("");
        } catch (err) {
            setError((err as ApiError).message ?? "Categorie kon niet worden aangemaakt");
        }
    };

    const handleUpdate = async () => {
        if (!selected?.categorieNr) return;
        try {
            const updated = await updateCategory(selected.categorieNr, { naam: formValue });
            setSuccess("Categorie bijgewerkt");
            setData((prev) =>
                prev
                    ? { ...prev, items: prev.items.map((cat) => (cat.categorieNr === updated.categorieNr ? updated : cat)) }
                    : prev,
            );
            setSelected(null);
            setFormValue("");
        } catch (err) {
            setError((err as ApiError).message ?? "Categorie kon niet worden bijgewerkt");
        }
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!window.confirm("Weet je zeker dat je deze categorie wilt verwijderen?")) return;
        try {
            await deleteCategory(id);
            setData((prev) => (prev ? { ...prev, items: prev.items.filter((cat) => cat.categorieNr !== id) } : prev));
        } catch (err) {
            setError((err as ApiError).message ?? "Categorie kon niet worden verwijderd");
        }
    };

    const columns: TableColumn<CategorieDetailDto>[] = [
        { header: "Naam", render: (row) => row.naam ?? "-" },
        {
            header: "Acties",
            render: (row) => (
                <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => { setSelected(row); setFormValue(row.naam ?? ""); }}>
                        Bewerken
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => void handleDelete(row.categorieNr)}>
                        Verwijder
                    </button>
                </div>
            ),
        },
    ];

    return (
        <Section title="Categorieën">
            <FormRow>
                <InputField id="cat-search" label="Zoeken" value={search} onChange={(e) => setSearch(e.target.value)} />
                <InputField id="cat-page" label="Pagina" value={page} type="number" onChange={(e) => setPage(Number(e.target.value) || 1)} />
                <InputField
                    id="cat-pageSize"
                    label="Per pagina"
                    value={pageSize}
                    type="number"
                    onChange={(e) => setPageSize(Number(e.target.value) || 10)}
                />
                <button className="btn btn-success align-self-end" type="button" onClick={() => void load()}>
                    Verversen
                </button>
            </FormRow>

            {error && <ErrorNotice message={error} />}
            {success && <SuccessNotice message={success} />}

            <Table columns={columns} rows={data?.items ?? []} />

            <hr />
            <h3 className="h6">{selected ? "Categorie bijwerken" : "Nieuwe categorie"}</h3>
            <FormRow>
                <InputField id="cat-naam" label="Naam" value={formValue} onChange={(e) => setFormValue(e.target.value)} />
            </FormRow>
            <button className="btn btn-primary me-2" type="button" onClick={() => void (selected ? handleUpdate() : handleCreate())}>
                {selected ? "Opslaan" : "Aanmaken"}
            </button>
            {selected && (
                <button className="btn btn-outline-secondary" type="button" onClick={() => { setSelected(null); setFormValue(""); }}>
                    Annuleren
                </button>
            )}
        </Section>
    );
}
