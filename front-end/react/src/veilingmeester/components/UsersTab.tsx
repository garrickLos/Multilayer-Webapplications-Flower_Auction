import { useMemo, useState, type JSX } from "react";
import type { User } from "../api";
import { TABLE_PAGE_SIZES } from "../hooks";
import { getUserActions, matchesUserFilters, type UserFilters } from "../rules";
import { paginate } from "../helpers";
import { Table, type TableColumn } from "./Table";
import { EmptyState, StatusBadge, UserBadge } from "./ui";
import { GebruikersFilters } from "./GebruikersFilters.tsx";

/**
 * Labels voor rollen (voor nette weergave in de tabel).
 * Fallback "Onbekend" voor onverwachte/nieuwe rollen.
 */
const roleLabels: Record<User["role"], string> = {
    Koper: "Koper",
    Bedrijf: "Bedrijf",
    Veilingmeester: "Veilingmeester",
    Admin: "Admin",
    Onbekend: "Onbekend",
};

/**
 * Props voor de gebruikers-tab:
 * - users: lijst met gebruikers
 * - loading/error: status voor UI meldingen
 * - onViewBids/onViewProducts: handlers om details te openen per gebruiker
 * - onRefresh: handmatige refresh actie
 */
type UsersTabProps = {
    readonly users: readonly User[];
    readonly loading: boolean;
    readonly error: string | null;
    readonly onViewBids: (userId: number) => void;
    readonly onViewProducts: (userId: number) => void;
    readonly onRefresh: () => void;
};

/**
 * Knoppen voor acties per gebruiker.
 * Wordt los gehouden zodat de tabelkolom "actions" schoon blijft.
 */
const UserActionButtons = ({
                               actions,
                               onViewBids,
                               onViewProducts,
                           }: {
    actions: { canViewBids: boolean; canViewProducts: boolean };
    onViewBids: () => void;
    onViewProducts: () => void;
}): JSX.Element => (
    <>
        {/* Alleen tonen als producten bekeken mogen worden */}
        {actions.canViewProducts && (
            <button
                type="button"
                className="btn btn-outline-success btn-sm"
                onClick={onViewProducts}
            >
                Producten
            </button>
        )}

        {/* Alleen tonen als biedingen bekeken mogen worden */}
        {actions.canViewBids && (
            <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={onViewBids}
            >
                Biedingen
            </button>
        )}
    </>
);

/**
 * UsersTab:
 * - beheert filters en paginering state
 * - filtert users met matchesUserFilters()
 * - toont tabel met sortering/paging via Table component
 */
export function UsersTab({
                             users,
                             loading,
                             error,
                             onViewBids,
                             onViewProducts,
                             onRefresh,
                         }: UsersTabProps): JSX.Element {
    // Filters voor rol/status (default: alles)
    const [filters, setFilters] = useState<UserFilters>({
        role: "all",
        status: "all",
    });

    // Paginering state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(TABLE_PAGE_SIZES[0]);

    /**
     * Gefilterde gebruikerslijst.
     * useMemo zodat filteren alleen opnieuw gebeurt bij wijziging van users/filters.
     */
    const filtered = useMemo(
        () => users.filter((user) => matchesUserFilters(user, filters)),
        [filters, users]
    );

    /**
     * Kolommen voor de tabel:
     * - Naam: toont UserBadge
     * - Rol: nette label mapping
     * - Status: StatusBadge
     * - Acties: knoppen afhankelijk van getUserActions()
     */
    const columns: TableColumn<User>[] = [
        {
            key: "name",
            header: "Naam",
            sortable: true,
            render: (row) => <UserBadge user={row} />,
            getValue: (row) => row.name,
        },
        {
            key: "role",
            header: "Rol",
            sortable: true,
            render: (row) => roleLabels[row.role],
            getValue: (row) => row.role,
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row) => <StatusBadge status={row.status} />,
            getValue: (row) => row.status,
        },
        {
            key: "actions",
            header: "Acties",
            render: (row) => {
                // Bepaalt welke acties beschikbaar zijn voor deze user
                const actions = getUserActions(row);

                return (
                    <div className="d-flex justify-content-end gap-2">
                        <UserActionButtons
                            actions={actions}
                            onViewBids={() => onViewBids(row.id)}
                            onViewProducts={() => onViewProducts(row.id)}
                        />
                    </div>
                );
            },
        },
    ];

    // Rows voor huidige pagina
    const pagedRows = useMemo(
        () => paginate(filtered, page, pageSize),
        [filtered, page, pageSize]
    );

    return (
        <section className="card border-0 shadow-sm rounded-4" aria-label="Gebruikers">
            <div className="card-body p-4 d-flex flex-column gap-3">
                {/* Filters bovenaan + refresh knop */}
                <GebruikersFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onRefresh={onRefresh}
                />

                {/* Statusmeldingen */}
                {loading && <div className="alert alert-info mb-0">Gebruikers laden…</div>}
                {error && <div className="alert alert-danger mb-0">{error}</div>}

                {/* Tabel met paginering en empty state */}
                <Table
                    columns={columns}
                    rows={pagedRows}
                    getRowId={(row) => row.id}
                    page={page}
                    pageSize={pageSize}
                    total={filtered.length}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={TABLE_PAGE_SIZES}
                    emptyState={
                        <EmptyState
                            title="Geen gebruikers"
                            description="Er zijn nog geen gebruikers gevonden."
                        />
                    }
                />
            </div>
        </section>
    );
}
