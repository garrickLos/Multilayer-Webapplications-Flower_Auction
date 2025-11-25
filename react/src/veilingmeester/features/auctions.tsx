import { useEffect, useMemo, useState, type JSX } from "react";
import { createVeiling, deleteVeiling, listVeilingen, updateVeiling } from "../api";
import { Modal } from "../Modal";
import { Table, type TableColumn } from "../components/Table";
import { EmptyState, Field, Input, Select, StatusBadge } from "../components/ui";
import { appConfig } from "../config";
import type { StatusLabel, VeilingCreateDto, VeilingMeester_VeilingDto, VeilingUpdateDto } from "../types";
import { formatDateTime, normaliseStatus, toDateTimeLocalValue } from "../utils";

const { table: tablePageSizeOptions } = appConfig.pagination;

const statusOptions: { value: StatusLabel | "all"; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "active", label: "Actief" },
    { value: "inactive", label: "Inactief" },
    { value: "sold", label: "Verkocht" },
];

type AuctionForm = {
    VeilingNaam: string;
    Begintijd: string;
    Eindtijd: string;
    Status?: string;
};

const defaultForm: AuctionForm = { VeilingNaam: "", Begintijd: "", Eindtijd: "", Status: "inactive" };

export function AuctionsTab(): JSX.Element {
    const [rows, setRows] = useState<VeilingMeester_VeilingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(tablePageSizeOptions[0]);
    const [total, setTotal] = useState<number | undefined>();
    const [filterStatus, setFilterStatus] = useState<StatusLabel | "all">("all");
    const [refreshKey, setRefreshKey] = useState(0);
    const [modalState, setModalState] = useState<{ mode: "create" | "edit"; auction?: VeilingMeester_VeilingDto } | null>(
        null,
    );

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await listVeilingen({ page, pageSize, signal: controller.signal });
                setRows(result.items);
                setTotal(result.totalCount);
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Kon veilingen niet laden");
            } finally {
                setLoading(false);
            }
        };
        void load();
        return () => controller.abort();
    }, [page, pageSize, refreshKey]);

    const filteredRows = useMemo(() => {
        if (filterStatus === "all") return rows;
        return rows.filter((row) => normaliseStatus(row.Status) === filterStatus);
    }, [filterStatus, rows]);

    const columns: TableColumn<VeilingMeester_VeilingDto>[] = [
        { key: "VeilingNr", header: "#", render: (row) => row.VeilingNr ?? "—" },
        { key: "VeilingNaam", header: "Naam", sortable: true },
        { key: "Begintijd", header: "Begintijd", render: (row) => formatDateTime(row.Begintijd) },
        { key: "Eindtijd", header: "Eindtijd", render: (row) => formatDateTime(row.Eindtijd) },
        {
            key: "Status",
            header: "Status",
            render: (row) => <StatusBadge status={normaliseStatus(row.Status)} />,
        },
        {
            key: "Producten",
            header: "Producten",
            render: (row) => row.Producten?.length ?? 0,
        },
        {
            key: "Biedingen",
            header: "Biedingen",
            render: (row) => row.Biedingen?.length ?? 0,
        },
        {
            key: "actions",
            header: "Acties",
            render: (row) => (
                <div className="d-flex gap-2 justify-content-end">
                    <button type="button" className="btn btn-outline-success btn-sm" onClick={() => setModalState({ mode: "edit", auction: row })}>
                        Bewerken
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(row.VeilingNr)}
                    >
                        Verwijderen
                    </button>
                </div>
            ),
        },
    ];

    const handleSave = async (form: AuctionForm, id?: number) => {
        try {
            if (id) {
                const payload: VeilingUpdateDto = {
                    VeilingNaam: form.VeilingNaam.trim(),
                    Begintijd: new Date(form.Begintijd).toISOString(),
                    Eindtijd: new Date(form.Eindtijd).toISOString(),
                };
                await updateVeiling(id, payload);
            } else {
                const payload: VeilingCreateDto = {
                    VeilingNaam: form.VeilingNaam.trim(),
                    Begintijd: new Date(form.Begintijd).toISOString(),
                    Eindtijd: new Date(form.Eindtijd).toISOString(),
                    Status: form.Status,
                };
                await createVeiling(payload);
            }
            setModalState(null);
            setPage(1);
            setRefreshKey((value) => value + 1);
        } catch (err) {
            setError((err as { message?: string }).message ?? "Opslaan mislukt");
        }
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (!window.confirm("Weet je zeker dat je deze veiling wilt verwijderen?")) return;
        try {
            await deleteVeiling(id);
            setRows((prev) => prev.filter((row) => row.VeilingNr !== id));
            setTotal((prev) => (prev ? Math.max(prev - 1, 0) : prev));
            setRefreshKey((value) => value + 1);
        } catch (err) {
            setError((err as { message?: string }).message ?? "Verwijderen mislukt");
        }
    };

    return (
        <section className="d-flex flex-column gap-3" aria-label="Veilingen">
            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                    <Field label="Status">
                        <Select
                            value={filterStatus}
                            options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => setFilterStatus(value as StatusLabel | "all")}
                        />
                    </Field>
                </div>
                <button type="button" className="btn btn-success" onClick={() => setModalState({ mode: "create" })}>
                    Nieuwe veiling
                </button>
            </div>

            {error && <div className="alert alert-danger mb-0">{error}</div>}
            {loading && <div className="alert alert-info mb-0">Laden…</div>}

            <Table
                columns={columns}
                rows={filteredRows}
                getRowId={(row) => row.VeilingNr ?? row.VeilingNaam}
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
                emptyMessage={<EmptyState message="Geen veilingen" />}
            />

            {modalState && (
                <AuctionModal
                    mode={modalState.mode}
                    auction={modalState.auction}
                    onClose={() => setModalState(null)}
                    onSave={handleSave}
                />
            )}
        </section>
    );
}

type AuctionModalProps = {
    mode: "create" | "edit";
    auction?: VeilingMeester_VeilingDto;
    onClose: () => void;
    onSave: (form: AuctionForm, id?: number) => void;
};

function AuctionModal({ mode, auction, onClose, onSave }: AuctionModalProps): JSX.Element {
    const [form, setForm] = useState<AuctionForm>(() =>
        auction
            ? {
                  VeilingNaam: auction.VeilingNaam,
                  Begintijd: toDateTimeLocalValue(auction.Begintijd),
                  Eindtijd: toDateTimeLocalValue(auction.Eindtijd),
                  Status: auction.Status,
              }
            : defaultForm,
    );

    const title = mode === "create" ? "Nieuwe veiling" : `Veiling #${auction?.VeilingNr ?? ""}`;

    const update = <K extends keyof AuctionForm>(key: K, value: AuctionForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <Modal
            title={title}
            onClose={onClose}
            footer={
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-success" onClick={onClose}>
                        Annuleren
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => onSave(form, auction?.VeilingNr)}>
                        Opslaan
                    </button>
                </div>
            }
        >
            <div className="row g-3">
                <div className="col-12">
                    <Field label="Naam">
                        <Input value={form.VeilingNaam} onChange={(value) => update("VeilingNaam", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Begintijd">
                        <Input type="datetime-local" value={form.Begintijd} onChange={(value) => update("Begintijd", value)} />
                    </Field>
                </div>
                <div className="col-12 col-md-6">
                    <Field label="Eindtijd">
                        <Input type="datetime-local" value={form.Eindtijd} onChange={(value) => update("Eindtijd", value)} />
                    </Field>
                </div>
                <div className="col-12">
                    <Field label="Status (optioneel)">
                        <Input value={form.Status ?? ""} onChange={(value) => update("Status", value)} placeholder="active" />
                    </Field>
                </div>
            </div>
        </Modal>
    );
}
