import type { JSX } from "react";
import type { UiStatus, User } from "../api";
import type { UserFilters } from "../rules";
import { Field, Select } from "./ui";

type UsersFiltersProps = {
    readonly filters: UserFilters;
    readonly onFiltersChange: (updater: (prev: UserFilters) => UserFilters) => void;
    readonly onRefresh: () => void;
};

export function UsersFilters({ filters, onFiltersChange, onRefresh }: UsersFiltersProps): JSX.Element {
    return (
        <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
                <Field label="Rol" htmlFor="user-role">
                    <Select
                        id="user-role"
                        value={filters.role}
                        onChange={(event) => onFiltersChange((prev) => ({ ...prev, role: event.target.value as User["role"] | "all" }))}
                    >
                        <option value="all">Alle</option>
                        <option value="Koper">Koper</option>
                        <option value="Bedrijf">Bedrijf</option>
                    </Select>
                </Field>
            </div>
            <div className="col-12 col-md-4">
                <Field label="Status" htmlFor="user-status">
                    <Select
                        id="user-status"
                        value={filters.status}
                        onChange={(event) => onFiltersChange((prev) => ({ ...prev, status: event.target.value as UiStatus | "all" }))}
                    >
                        <option value="all">Alle</option>
                        <option value="active">Actief</option>
                        <option value="inactive">Inactief</option>
                        <option value="sold">Verkocht</option>
                        <option value="deleted">Geannuleerd</option>
                    </Select>
                </Field>
            </div>
            <div className="col-12 col-md-4">
                <button type="button" className="btn btn-outline-success w-100" onClick={onRefresh}>
                    Ververs
                </button>
            </div>
        </div>
    );
}
