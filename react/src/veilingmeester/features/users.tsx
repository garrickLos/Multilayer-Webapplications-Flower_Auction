import { useEffect, useState, type JSX } from "react";
import { createGebruiker, deleteGebruiker, listGebruikers, updateGebruiker } from "../api";
import { Modal } from "../Modal";
import { Table, type TableColumn } from "../components/Table";
import { EmptyState, Field, Input } from "../components/ui";
import { appConfig } from "../config";
import type { GebruikerCreateDto, GebruikerUpdateDto, Klant_GebruikerDto } from "../types";
import { formatDateTime } from "../utils";

const { table: tablePageSizeOptions } = appConfig.pagination;

const emptyForm: GebruikerCreateDto = {
    BedrijfsNaam: "",
    Email: "",
    Wachtwoord: "",
    Soort: "",
    LaatstIngelogd: undefined,
    Kvk: "",
    StraatAdres: "",
    Postcode: "",
};

export function UsersTab(): JSX.Element {
    const [rows, setRows] = useState<Klant_GebruikerDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(tablePageSizeOptions[0]);
    const [total, setTotal] = useState<number | undefined>();
    const [search, setSearch] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [modalState, setModalState] = useState<{ mode: "create" | "edit"; user?: Klant_GebruikerDto } | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await listGebruikers({ page, pageSize, q: search || undefined, signal: controller.signal });
                setRows(result.items);
                setTotal(result.totalCount);
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Kon gebruikers niet laden");
            } finally {
                setLoading(false);
            }
        };
        void load();
        return () => controller.abort();
    }, [page, pageSize, refreshKey, search]);

    const columns: TableColumn<Klant_GebruikerDto>[] = [
        { key: "GebruikerNr", header: "#", render: (row) => row.GebruikerNr },
        { key: "BedrijfsNaam", header: "Bedrijfsnaam", sortable: true },
        { key: "Email", header: "Email" },
        { key: "Soort", header: "Soort" },
        { key: "Kvk", header: "KVK", render: (row) => row.Kvk ?? "—" },
        { key: "LaatstIngelogd", header: "Laatst ingelogd", render: (row) => formatDateTime(row.LaatstIngelogd) },
        { key: "Biedingen", header: "Biedingen", render: (row) => row.Biedingen?.length ?? 0 },
        {
            key: "actions",
            header: "Acties",
            render: (row) => (
                <div className="d-flex gap-2 justify-content-end">
                    <button type="button" className="btn btn-outline-success btn-sm" onClick={() => setModalState({ mode: "edit", user: row })}>
                        Bewerken
                    </button>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(row.GebruikerNr)}>
                        Verwijderen
                    </button>
                </div>
            ),
        },
    ];

    const handleSave = async (draft: GebruikerCreateDto | GebruikerUpdateDto, id?: number) => {
        try {
            if (id) await updateGebruiker(id, draft as GebruikerUpdateDto);
            else await createGebruiker(draft as GebruikerCreateDto);
            setModalState(null);
            setPage(1);
            setRefreshKey((value) => value + 1);
        } catch (err) {
            setError((err as { message?: string }).message ?? "Opslaan mislukt");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Verwijder deze gebruiker?")) return;
        try {
            await deleteGebruiker(id);
            setRows((prev) => prev.filter((row) => row.GebruikerNr !== id));
            setTotal((prev) => (prev ? Math.max(prev - 1, 0) : prev));
            setRefreshKey((value) => value + 1);
        } catch (err) {
            setError((err as { message?: string }).message ?? "Verwijderen mislukt");
        }
    };

    return (
        <section className="d-flex flex-column gap-3" aria-label="Gebruikers">
            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <div className="flex-grow-1">
                    <Field label="Zoeken">
                        <Input value={search} onChange={setSearch} placeholder="Bedrijfsnaam of email" />
                    </Field>
                </div>
                <button type="button" className="btn btn-success" onClick={() => setModalState({ mode: "create" })}>
                    Nieuwe gebruiker
                </button>
            </div>

            {error && <div className="alert alert-danger mb-0">{error}</div>}
            {loading && <div className="alert alert-info mb-0">Laden…</div>}

            <Table
                columns={columns}
                rows={rows}
                getRowId={(row) => row.GebruikerNr}
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
                emptyMessage={<EmptyState message="Geen gebruikers" />}
            />

            {modalState && (
                <UserModal
                    mode={modalState.mode}
                    user={modalState.user}
                    onClose={() => setModalState(null)}
                    onSave={handleSave}
                />
            )}
        </section>
    );
}

type UserModalProps = {
    mode: "create" | "edit";
    user?: Klant_GebruikerDto;
    onClose: () => void;
    onSave: (draft: GebruikerCreateDto | GebruikerUpdateDto, id?: number) => void;
};

function UserModal({ mode, user, onClose, onSave }: UserModalProps): JSX.Element {
    const [form, setForm] = useState<GebruikerCreateDto | GebruikerUpdateDto>(() =>
        user
            ? {
                  BedrijfsNaam: user.BedrijfsNaam,
                  Email: user.Email,
                  Wachtwoord: user.Wachtwoord,
                  Soort: user.Soort,
                  Kvk: user.Kvk,
                  StraatAdres: user.StraatAdres,
                  Postcode: user.Postcode,
                  LaatstIngelogd: user.LaatstIngelogd,
              }
            : emptyForm,
    );

    const update = <K extends keyof (GebruikerCreateDto & GebruikerUpdateDto)>(key: K, value: (GebruikerCreateDto & GebruikerUpdateDto)[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <Modal
            title={mode === "create" ? "Nieuwe gebruiker" : `Gebruiker #${user?.GebruikerNr}`}
            onClose={onClose}
            footer={
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-success" onClick={onClose}>
                        Annuleren
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => onSave(form, user?.GebruikerNr)}>
                        Opslaan
                    </button>
                </div>
            }
        >
            <div className="row g-3">
                <div className="col-12">
                    <Field label="Bedrijfsnaam">
                        <Input value={form.BedrijfsNaam} onChange={(value) => update("BedrijfsNaam", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Email">
                        <Input value={form.Email} onChange={(value) => update("Email", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Wachtwoord">
                        <Input type="password" value={form.Wachtwoord} onChange={(value) => update("Wachtwoord", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Soort">
                        <Input value={form.Soort} onChange={(value) => update("Soort", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="KVK">
                        <Input value={form.Kvk ?? ""} onChange={(value) => update("Kvk", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Straatadres">
                        <Input value={form.StraatAdres ?? ""} onChange={(value) => update("StraatAdres", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Postcode">
                        <Input value={form.Postcode ?? ""} onChange={(value) => update("Postcode", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Laatst ingelogd (optioneel)">
                        <Input
                            type="datetime-local"
                            value={form.LaatstIngelogd ?? ""}
                            onChange={(value) => update("LaatstIngelogd", value)}
                        />
                    </Field>
                </div>
            </div>
        </Modal>
    );
}
