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
import { useUserBids, useUsers } from "../hooks";
import type { UserRow, Status } from "../types";
import { cx, formatCurrency, formatDateTime } from "../utils";

export type UsersTabProps = {
    readonly onSelectBidUser: (user: UserRow) => void;
    readonly onSelectGrower: (user: UserRow) => void;
};

const soortClass: Record<UserRow["soort"], string> = {
    koper: "text-bg-primary",
    kweker: "text-bg-success",
    veilingmeester: "text-bg-secondary",
    onbekend: "text-bg-secondary",
};

const statusFilterOptions = [
    { value: "alle", label: "Alle" },
    { value: "active", label: "Actief" },
    { value: "inactive", label: "Inactief" },
];

const roleOptions = [
    { value: "alle", label: "Alle rollen" },
    { value: "koper", label: "Koper" },
    { value: "kweker", label: "Kweker" },
    { value: "veilingmeester", label: "Veilingmeester" },
];

export function UsersTab({ onSelectBidUser, onSelectGrower }: UsersTabProps): JSX.Element {
    const { rows, setRows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, search, setSearch } =
        useUsers();
    const perPage = appConfig.pagination.table.map((size) => ({ value: size, label: String(size) }));

    const [status, setStatus] = useState<(typeof statusFilterOptions)[number]["value"]>("alle");
    const [role, setRole] = useState<(typeof roleOptions)[number]["value"]>("alle");
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const matchesRole = role === "alle" || row.soort === role;
            const matchesStatus = status === "alle" || row.status === status;
            const matchesSearch =
                !search ||
                row.naam.toLowerCase().includes(search.toLowerCase()) ||
                row.email?.toLowerCase().includes(search.toLowerCase()) ||
                String(row.id).includes(search.trim());
            return matchesRole && matchesStatus && matchesSearch;
        });
    }, [rows, role, status, search]);

    const columns = [
        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
        {
            key: "naam",
            header: "Naam",
            sortable: true,
            render: (row: UserRow) => (
                <div className="d-flex flex-column">
                    <span className="fw-semibold text-break">{row.naam}</span>
                    <span className="text-muted small">#{row.id}</span>
                </div>
            ),
            getValue: (row: UserRow) => row.naam,
        },
        {
            key: "email",
            header: "E-mail",
            sortable: true,
            render: (row: UserRow) => (row.email ? <span className="text-break">{row.email}</span> : <span className="text-muted">—</span>),
            getValue: (row: UserRow) => row.email ?? "",
        },
        {
            key: "kvk",
            header: "KVK",
            sortable: true,
            render: (row: UserRow) => <span className="font-monospace">{row.kvk ?? "—"}</span>,
            getValue: (row: UserRow) => row.kvk ?? "",
        },
        {
            key: "soort",
            header: "Rol",
            sortable: true,
            render: (row: UserRow) => <span className={cx("badge", "rounded-pill", soortClass[row.soort])}>{row.soort}</span>,
            getValue: (row: UserRow) => row.soort,
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row: UserRow) => <StatusBadge status={row.status} />,
            getValue: (row: UserRow) => row.status,
        },
        {
            key: "actions",
            header: "Acties",
            cellClassName: "text-end",
            render: (row: UserRow) => (
                <div className="d-flex gap-2 justify-content-end flex-wrap">
                    {row.soort === "koper" && (
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                onSelectBidUser(row);
                            }}
                        >
                            Biedingen
                        </button>
                    )}
                    {row.soort === "kweker" && (
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                onSelectGrower(row);
                            }}
                        >
                            Producten
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={(event) => {
                            event.stopPropagation();
                            setEditingUser(row);
                        }}
                    >
                        Bewerk
                    </button>
                </div>
            ),
        },
    ];

    const handleSave = (updated: UserRow) => {
        setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
        setEditingUser(null);
    };

    return (
        <section className="d-flex flex-column gap-3" aria-label="Gebruikersbeheer">
            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-6 col-lg-4">
                            <SearchField label="Zoeken" value={search} onChange={setSearch} placeholder="Naam of e-mail" />
                        </div>
                        <div className="col-6 col-md-3 col-lg-2">
                            <SmallSelectField
                                label="Rol"
                                value={role}
                                onChange={(value) => setRole(value as (typeof roleOptions)[number]["value"])}
                                options={roleOptions}
                            />
                        </div>
                        <div className="col-6 col-md-3 col-lg-2">
                            <SmallSelectField
                                label="Status"
                                value={status}
                                onChange={(value) => setStatus(value as (typeof statusFilterOptions)[number]["value"])}
                                options={statusFilterOptions}
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
                {role !== "alle" && <FilterChip label={`Rol: ${role}`} onRemove={() => setRole("alle")} />}
                {status !== "alle" && <FilterChip label={`Status: ${status}`} onRemove={() => setStatus("alle")} />}
                {search && <FilterChip label={`Zoek: ${search}`} onRemove={() => setSearch("")} />}
                {role === "alle" && status === "alle" && !search && <span className="text-muted small">Geen filters actief.</span>}
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : filteredRows.length === 0 ? (
                <EmptyState message="Geen gebruikers gevonden." />
            ) : (
                <DataTable
                    columns={columns}
                    rows={filteredRows}
                    totalResults={totalResults}
                    empty={<EmptyState message="Geen gebruikers gevonden." />}
                    getRowKey={(row) => String(row.id)}
                    onRowClick={setEditingUser}
                    isRowInteractive={() => true}
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

            {editingUser && <UserEditModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSave} />}
        </section>
    );
}

export type BidsModalProps = { readonly user: UserRow; readonly onClose: () => void };

export function BidsModal({ user, onClose }: BidsModalProps): JSX.Element {
    const { rows, loading, error, page, setPage, pageSize, setPageSize, hasNext, totalResults, from, setFrom, to, setTo } =
        useUserBids(user.id);
    const perPage = appConfig.pagination.modal.map((size) => ({ value: size, label: String(size) }));

    const columns = [
        { key: "id", header: "#", sortable: true, headerClassName: "text-nowrap", cellClassName: "text-nowrap" },
        {
            key: "bedragPerFust",
            header: "Bedrag per fust",
            sortable: true,
            render: (row: { bedragPerFust: number }) => formatCurrency(row.bedragPerFust),
            getValue: (row: { bedragPerFust: number }) => row.bedragPerFust,
        },
        {
            key: "aantalStuks",
            header: "Stuks",
            sortable: true,
            render: (row: { aantalStuks: number }) => row.aantalStuks,
            getValue: (row: { aantalStuks: number }) => row.aantalStuks,
        },
        {
            key: "datumIso",
            header: "Datum",
            sortable: true,
            render: (row: { datumIso?: string }) => formatDateTime(row.datumIso),
            getValue: (row: { datumIso?: string }) => row.datumIso ?? "",
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row: { status: UserRow["status"] }) => <StatusBadge status={row.status} />,
            getValue: (row: { status: UserRow["status"] }) => row.status,
        },
    ];

    return (
        <Modal
            title={
                <div>
                    <div className="fw-semibold">Biedingen koper {user.naam}</div>
                    <div className="text-muted small">#{user.id}</div>
                </div>
            }
            onClose={onClose}
            size="xl"
            filters={
                <div className="row g-3 align-items-end w-100">
                    <div className="col-6 col-lg-3">
                        <SmallSelectField<number>
                            label="Per pagina"
                            value={pageSize}
                            onChange={setPageSize}
                            options={perPage}
                            parse={(raw) => Number(raw)}
                        />
                    </div>
                    <div className="col-6 col-lg-3">
                        <label htmlFor="bids-from" className="form-label small text-uppercase text-success-emphasis mb-1">
                            Vanaf
                        </label>
                        <input
                            id="bids-from"
                            type="date"
                            className="form-control form-control-sm border-success-subtle"
                            value={from}
                            onChange={(event) => setFrom(event.target.value)}
                        />
                    </div>
                    <div className="col-6 col-lg-3">
                        <label htmlFor="bids-to" className="form-label small text-uppercase text-success-emphasis mb-1">
                            Tot en met
                        </label>
                        <input
                            id="bids-to"
                            type="date"
                            className="form-control form-control-sm border-success-subtle"
                            value={to}
                            onChange={(event) => setTo(event.target.value)}
                        />
                    </div>
                </div>
            }
            footer={
                <button type="button" className="btn btn-success" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Actieve filters">
                {from && <FilterChip label={`Vanaf: ${from}`} onRemove={() => setFrom("")} />}
                {to && <FilterChip label={`Tot: ${to}`} onRemove={() => setTo("")} />}
                {!from && !to && <span className="text-muted small">Geen extra filters actief.</span>}
            </div>

            {error && <InlineAlert>{error}</InlineAlert>}

            {loading && !rows.length ? (
                <LoadingPlaceholder />
            ) : rows.length === 0 ? (
                <EmptyState message="Geen biedingen gevonden." />
            ) : (
                <DataTable
                    columns={columns}
                    rows={rows}
                    totalResults={totalResults}
                    empty={<EmptyState message="Geen biedingen gevonden." />}
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

function UserEditModal({
    user,
    onClose,
    onSave,
}: {
    readonly user: UserRow;
    readonly onClose: () => void;
    readonly onSave: (user: UserRow) => void;
}): JSX.Element {
    const [draft, setDraft] = useState<UserRow>(user);

    const update = <K extends keyof UserRow>(key: K, value: UserRow[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

    return (
        <Modal
            title="Bewerk gebruiker"
            onClose={onClose}
            footer={
                <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-success" onClick={onClose}>
                        Annuleren
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => onSave(draft)}>
                        Opslaan
                    </button>
                </div>
            }
        >
            <div className="row g-3">
                <div className="col-12">
                    <label htmlFor="user-name" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Naam
                    </label>
                    <input
                        id="user-name"
                        type="text"
                        className="form-control border-success-subtle"
                        value={draft.naam}
                        onChange={(event) => update("naam", event.target.value)}
                    />
                </div>
                <div className="col-12">
                    <label htmlFor="user-email" className="form-label small text-uppercase text-success-emphasis mb-1">
                        E-mail
                    </label>
                    <input
                        id="user-email"
                        type="email"
                        className="form-control border-success-subtle"
                        value={draft.email}
                        onChange={(event) => update("email", event.target.value)}
                    />
                </div>
                <div className="col-6">
                    <label htmlFor="user-role" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Rol
                    </label>
                    <select
                        id="user-role"
                        className="form-select border-success-subtle"
                        value={draft.soort}
                        onChange={(event) => update("soort", event.target.value as UserRow["soort"])}
                    >
                        <option value="koper">Koper</option>
                        <option value="kweker">Kweker</option>
                        <option value="veilingmeester">Veilingmeester</option>
                    </select>
                </div>
                <div className="col-6">
                    <label htmlFor="user-status" className="form-label small text-uppercase text-success-emphasis mb-1">
                        Status
                    </label>
                    <select
                        id="user-status"
                        className="form-select border-success-subtle"
                        value={draft.status}
                        onChange={(event) => update("status", event.target.value as Status)}
                    >
                        <option value="active">Actief</option>
                        <option value="inactive">Inactief</option>
                        <option value="sold">Verkocht</option>
                        <option value="deleted">Geannuleerd</option>
                    </select>
                </div>
                <div className="col-12">
                    <p className="text-muted small mb-0">Rol en status bepalen de beschikbare acties.</p>
                </div>
            </div>
        </Modal>
    );
}
