import { useMemo, useState, type JSX } from "react";
import { Modal } from "../Modal";
import { Table, type TableColumn } from "../components/Table";
import { Chip, EmptyState, Field, Input, RoleBadge, Select, StatusBadge } from "../components/ui";
import type { Bid, Product, Status, User, UserRole } from "../types";
import { filterRows } from "../types";
import { formatCurrency, formatDateTime } from "../utils";

// User listing with simple modals.
const statusOptions: readonly { value: Status | "all"; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "active", label: "Actief" },
    { value: "inactive", label: "Inactief" },
];

const roleOptions: readonly { value: UserRole | "all"; label: string }[] = [
    { value: "all", label: "Alle rollen" },
    { value: "buyer", label: "Koper" },
    { value: "grower", label: "Kweker" },
    { value: "auctioneer", label: "Veilingmeester" },
];

const perPageOptions = [10, 25, 50];

type UserFilters = { status: Status | "all"; role: UserRole | "all" };

export type UsersTabProps = {
    readonly users: readonly User[];
    readonly bids: readonly Bid[];
    readonly onEditUser: (user: User) => void;
    readonly onViewBids: (userId: number) => void;
    readonly onViewProducts: (userId: number) => void;
};

export function UsersTab({ users, onEditUser, onViewBids, onViewProducts }: UsersTabProps): JSX.Element {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<UserFilters>({ status: "all", role: "all" });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(perPageOptions[0]);

    const filteredRows = useMemo(
        () =>
            filterRows(users, search, filters, (row, term, currentFilters) => {
                const matchesSearch = !term || row.name.toLowerCase().includes(term) || row.email.toLowerCase().includes(term);
                const matchesStatus = currentFilters.status === "all" || row.status === currentFilters.status;
                const matchesRole = currentFilters.role === "all" || row.role === currentFilters.role;
                return matchesSearch && matchesStatus && matchesRole;
            }),
        [filters, search, users],
    );

    const columns: TableColumn<User>[] = [
        { key: "name", header: "Naam", sortable: true, render: (row) => row.name, getValue: (row) => row.name },
        { key: "email", header: "E-mail", sortable: true, render: (row) => row.email, getValue: (row) => row.email },
        { key: "role", header: "Rol", sortable: true, render: (row) => <RoleBadge role={row.role} />, getValue: (row) => row.role },
        { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} />, getValue: (row) => row.status },
        {
            key: "actions",
            header: "Acties",
            render: (row) => (
                <div className="d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => onEditUser(row)}
                    >
                        Bewerk
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => onViewBids(row.id)}
                    >
                        Biedingen
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => onViewProducts(row.id)}
                    >
                        Producten
                    </button>
                </div>
            ),
        },
    ];

    const activeFilters = [
        filters.status !== "all" && `Status: ${filters.status}`,
        filters.role !== "all" && `Rol: ${filters.role}`,
        search && `Zoek: ${search}`,
    ].filter(Boolean) as string[];

    return (
        <section className="d-flex flex-column gap-3" aria-label="Gebruikers">
            <div className="d-flex flex-wrap align-items-center gap-2">
                {activeFilters.length === 0 && <span className="text-muted small">Geen filters actief.</span>}
                {activeFilters.map((label) => (
                    <Chip key={label} label={label} onRemove={() => setFilters({ status: "all", role: "all" })} />
                ))}
            </div>

            <Table
                columns={columns}
                rows={filteredRows}
                getRowId={(row) => row.id}
                search={{ value: search, onChange: setSearch, placeholder: "Naam of e-mail" }}
                filters={
                    <div className="d-flex flex-wrap gap-2">
                        <Select
                            value={filters.status}
                            options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => setFilters((prev) => ({ ...prev, status: value as UserFilters["status"] }))}
                        />
                        <Select
                            value={filters.role}
                            options={roleOptions.map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => setFilters((prev) => ({ ...prev, role: value as UserFilters["role"] }))}
                        />
                    </div>
                }
                page={page}
                pageSize={pageSize}
                pageSizeOptions={perPageOptions}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
                emptyMessage={<EmptyState message="Geen gebruikers gevonden." /> as unknown as string}
            />
        </section>
    );
}

type UserFormState = { name: string; email: string; role: UserRole; status: Status };

type UserModalProps = { readonly user: User; readonly onClose: () => void; readonly onSave: (value: UserFormState) => void };

export function EditUserModal({ user, onClose, onSave }: UserModalProps): JSX.Element {
    const [draft, setDraft] = useState<UserFormState>({ name: user.name, email: user.email, role: user.role, status: user.status });
    const update = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

    return (
        <Modal
            title="Bewerk gebruiker"
            subtitle={user.name}
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
                    <Field label="Naam">
                        <Input value={draft.name} onChange={(value) => update("name", value)} />
                    </Field>
                </div>
                <div className="col-12">
                    <Field label="E-mail">
                        <Input value={draft.email} onChange={(value) => update("email", value)} />
                    </Field>
                </div>
                <div className="col-6">
                    <Field label="Rol">
                        <Select
                            value={draft.role}
                            options={roleOptions.filter((option) => option.value !== "all").map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => update("role", value as UserRole)}
                        />
                    </Field>
                </div>
                <div className="col-6">
                    <Field label="Status">
                        <Select
                            value={draft.status}
                            options={statusOptions.filter((option) => option.value !== "all").map((option) => ({ value: option.value, label: option.label }))}
                            onChange={(value) => update("status", value as Status)}
                        />
                    </Field>
                </div>
            </div>
        </Modal>
    );
}

export function UserBidsModal({ user, bids, onClose }: { readonly user: User; readonly bids: readonly Bid[]; readonly onClose: () => void }): JSX.Element {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(perPageOptions[0]);

    const userBids = useMemo(
        () =>
            filterRows(bids, search, { status: statusFilter }, (row, term, currentFilters) => {
                const matchesSearch = !term || String(row.auctionId).includes(term);
                const matchesStatus = currentFilters.status === "all" || row.status === currentFilters.status;
                return matchesSearch && matchesStatus;
            }),
        [bids, search, statusFilter],
    );

    const columns: TableColumn<Bid>[] = [
        { key: "auction", header: "Veiling", render: (row) => `#${row.auctionId}` },
        { key: "amount", header: "Bedrag", sortable: true, render: (row) => formatCurrency(row.amount), getValue: (row) => row.amount },
        { key: "quantity", header: "Aantal", sortable: true, render: (row) => row.quantity, getValue: (row) => row.quantity },
        { key: "date", header: "Datum", sortable: true, render: (row) => formatDateTime(row.date), getValue: (row) => row.date },
        { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} />, getValue: (row) => row.status },
    ];

    return (
        <Modal
            title="Biedingen"
            subtitle={user.name}
            onClose={onClose}
            size="lg"
            controls={
                <div className="d-flex flex-wrap gap-2">
                    <Input value={search} onChange={setSearch} placeholder="Veilingnummer" />
                    <Select
                        value={statusFilter}
                        options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                        onChange={(value) => setStatusFilter(value as Status | "all")}
                    />
                </div>
            }
            footer={
                <button type="button" className="btn btn-success" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <Table
                columns={columns}
                rows={userBids}
                getRowId={(row) => row.id}
                page={page}
                pageSize={pageSize}
                pageSizeOptions={perPageOptions}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
            />
        </Modal>
    );
}

export function UserProductsModal({ user, products, onClose }: { readonly user: User; readonly products: readonly Product[]; readonly onClose: () => void }): JSX.Element {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(perPageOptions[0]);

    const growerProducts = useMemo(
        () =>
            filterRows(products, search, { status: statusFilter }, (row, term, currentFilters) => {
                const matchesSearch = !term || row.name.toLowerCase().includes(term) || String(row.id).includes(term);
                const matchesStatus = currentFilters.status === "all" || row.status === currentFilters.status;
                return matchesSearch && matchesStatus;
            }),
        [products, search, statusFilter],
    );

    const columns: TableColumn<Product>[] = [
        { key: "id", header: "#", render: (row) => `#${row.id}` },
        { key: "name", header: "Naam", render: (row) => row.name },
        { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
        { key: "linked", header: "Veiling", render: (row) => (row.linkedAuctionId ? `#${row.linkedAuctionId}` : "—") },
    ];

    return (
        <Modal
            title="Producten"
            subtitle={user.name}
            onClose={onClose}
            size="lg"
            controls={
                <div className="d-flex flex-wrap gap-2">
                    <Input value={search} onChange={setSearch} placeholder="Naam of nummer" />
                    <Select
                        value={statusFilter}
                        options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                        onChange={(value) => setStatusFilter(value as Status | "all")}
                    />
                </div>
            }
            footer={
                <button type="button" className="btn btn-success" onClick={onClose}>
                    Sluiten
                </button>
            }
        >
            <Table
                columns={columns}
                rows={growerProducts}
                getRowId={(row) => row.id}
                page={page}
                pageSize={pageSize}
                pageSizeOptions={perPageOptions}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
            />
        </Modal>
    );
}
