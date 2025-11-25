import { useEffect, useMemo, useState, type ChangeEvent, type JSX } from "react";
import { createUser, deleteUser, getUser, listUsers, type ApiError, updateUser } from "../api";
import { Modal } from "../Modal";
import { Section, InputField, FormRow, ErrorNotice, SuccessNotice } from "../components/ui";
import { Table, type TableColumn } from "../components/Table";
import type { GebruikerCreateDto, GebruikerUpdateDto, Klant_GebruikerDto, PaginatedResult } from "../types";

const defaultUser: GebruikerCreateDto = {
    bedrijfsNaam: "",
    email: "",
    wachtwoord: "",
    soort: "",
    laatstIngelogd: null,
    kvk: null,
    straatAdres: null,
    postcode: null,
};

export function UsersTab(): JSX.Element {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [data, setData] = useState<PaginatedResult<Klant_GebruikerDto> | null>(null);
    const [selected, setSelected] = useState<Klant_GebruikerDto | null>(null);
    const [form, setForm] = useState<GebruikerCreateDto>(defaultUser);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = async () => {
        setError(null);
        try {
            const response = await listUsers({ q: search || undefined, page, pageSize });
            setData(response);
        } catch (err) {
            setError((err as ApiError).message ?? "Kan gebruikers niet laden");
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, page, pageSize]);

    const onChange = (field: keyof GebruikerCreateDto) => (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreate = async () => {
        try {
            await createUser(form);
            setSuccess("Gebruiker aangemaakt");
            setForm(defaultUser);
            await load();
        } catch (err) {
            setError((err as ApiError).message ?? "Gebruiker kon niet worden aangemaakt");
        }
    };

    const handleSelect = async (id?: number) => {
        if (!id) return;
        try {
            const detail = await getUser(id);
            setSelected(detail);
            const { bedrijfsNaam, email, wachtwoord, soort, laatstIngelogd, kvk, straatAdres, postcode } = detail;
            setForm({ bedrijfsNaam, email, wachtwoord, soort, laatstIngelogd, kvk, straatAdres, postcode });
        } catch (err) {
            setError((err as ApiError).message ?? "Kan gebruiker niet laden");
        }
    };

    const handleUpdate = async () => {
        if (!selected?.gebruikerNr) return;
        try {
            const payload: GebruikerUpdateDto = {
                bedrijfsNaam: form.bedrijfsNaam,
                email: form.email,
                wachtwoord: form.wachtwoord,
                soort: form.soort,
                laatstIngelogd: form.laatstIngelogd,
                kvk: form.kvk,
                straatAdres: form.straatAdres,
                postcode: form.postcode,
            };
            const updated = await updateUser(selected.gebruikerNr, payload);
            setSelected(updated);
            setData((prev) =>
                prev ? { ...prev, items: prev.items.map((user) => (user.gebruikerNr === updated.gebruikerNr ? updated : user)) } : prev,
            );
            setSuccess("Gebruiker bijgewerkt");
        } catch (err) {
            setError((err as ApiError).message ?? "Gebruiker kon niet worden bijgewerkt");
        }
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!window.confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")) return;
        try {
            await deleteUser(id);
            setData((prev) => (prev ? { ...prev, items: prev.items.filter((user) => user.gebruikerNr !== id) } : prev));
            if (selected?.gebruikerNr === id) setSelected(null);
        } catch (err) {
            setError((err as ApiError).message ?? "Gebruiker kon niet worden verwijderd");
        }
    };

    const columns: TableColumn<Klant_GebruikerDto>[] = useMemo(
        () => [
            { header: "Bedrijfsnaam", render: (row) => row.bedrijfsNaam },
            { header: "Email", render: (row) => row.email },
            { header: "Rol", render: (row) => row.soort },
            {
                header: "Acties",
                render: (row) => (
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => void handleSelect(row.gebruikerNr)}>
                            Details
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => void handleDelete(row.gebruikerNr)}>
                            Verwijder
                        </button>
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <Section title="Gebruikers">
            <FormRow>
                <InputField id="user-search" label="Zoeken" value={search} onChange={(e) => setSearch(e.target.value)} />
                <InputField id="user-page" label="Pagina" value={page} type="number" onChange={(e) => setPage(Number(e.target.value) || 1)} />
                <InputField id="user-pageSize" label="Per pagina" value={pageSize} type="number" onChange={(e) => setPageSize(Number(e.target.value) || 10)} />
                <button className="btn btn-success align-self-end" type="button" onClick={() => void load()}>
                    Verversen
                </button>
            </FormRow>

            {error && <ErrorNotice message={error} />}
            {success && <SuccessNotice message={success} />}

            <Table columns={columns} rows={data?.items ?? []} />

            <hr />
            <h3 className="h6">{selected ? "Gebruiker bijwerken" : "Nieuwe gebruiker"}</h3>
            <FormRow>
                <InputField id="user-bedrijf" label="Bedrijfsnaam" value={form.bedrijfsNaam} onChange={onChange("bedrijfsNaam")} />
                <InputField id="user-email" label="Email" value={form.email} onChange={onChange("email")} type="email" />
                <InputField id="user-wachtwoord" label="Wachtwoord" value={form.wachtwoord} onChange={onChange("wachtwoord")} type="password" />
                <InputField id="user-soort" label="Soort" value={form.soort} onChange={onChange("soort")} />
                <InputField id="user-kvk" label="KVK" value={form.kvk ?? ""} onChange={onChange("kvk")} />
            </FormRow>
            <FormRow>
                <InputField id="user-straat" label="Straat" value={form.straatAdres ?? ""} onChange={onChange("straatAdres")} />
                <InputField id="user-postcode" label="Postcode" value={form.postcode ?? ""} onChange={onChange("postcode")} />
            </FormRow>
            <button className="btn btn-primary me-2" type="button" onClick={() => void (selected ? handleUpdate() : handleCreate())}>
                {selected ? "Opslaan" : "Aanmaken"}
            </button>
            {selected && (
                <button className="btn btn-outline-secondary" type="button" onClick={() => { setSelected(null); setForm(defaultUser); }}>
                    Annuleren
                </button>
            )}

            {selected && (
                <Modal title={`Biedingen van ${selected.bedrijfsNaam}`} onClose={() => setSelected(null)}>
                    <div className="d-flex flex-column gap-2">
                        <div className="text-muted">Totaal biedingen: {selected.biedingen?.length ?? 0}</div>
                        <ul className="list-unstyled mb-0">
                            {selected.biedingen?.map((bid) => (
                                <li key={bid.biedingNr}>
                                    #{bid.biedingNr} – €{bid.bedragPerFust} x {bid.aantalStuks}
                                </li>
                            )) ?? <li className="text-muted">Geen biedingen</li>}
                        </ul>
                    </div>
                </Modal>
            )}
        </Section>
    );
}
