import type { JSX } from "react";
import type { UiStatus, User } from "../api";
import type { UserFilters } from "../rules";
import { Field, Select } from "./ui";

/**
 * Props voor het filterblok:
 * - filters: huidige filterwaarden
 * - onFiltersChange: callback om filters te updaten (met updater functie)
 * - onRefresh: handmatige refresh actie (bijv. opnieuw ophalen van data)
 */
type UsersFiltersProps = {
    readonly filters: UserFilters;
    readonly onFiltersChange: (updater: (prev: UserFilters) => UserFilters) => void;
    readonly onRefresh: () => void;
};

/**
 * Filter UI voor gebruikersoverzicht.
 * Bevat:
 * - Rolfilter (Koper/Bedrijf/Alle)
 * - Statusfilter (active/inactive/sold/deleted/Alle)
 * - Knop om handmatig te verversen
 */
export function GebruikersFilters({
                                      filters,
                                      onFiltersChange,
                                      onRefresh,
                                  }: UsersFiltersProps): JSX.Element {
    return (
        <div className="row g-3 align-items-end">
            {/* Rolfilter: filter op type gebruiker */}
            <div className="col-12 col-md-4">
                <Field label="Rol" htmlFor="user-role">
                    <Select
                        id="user-role"
                        value={filters.role}
                        onChange={(event) =>
                            onFiltersChange((prev) => ({
                                ...prev,
                                role: event.target.value as User["role"] | "all",
                            }))
                        }
                    >
                        <option value="all">Alle</option>
                        <option value="Koper">Koper</option>
                        <option value="Bedrijf">Bedrijf</option>
                    </Select>
                </Field>
            </div>

            {/* Statusfilter: filter op status van de gebruiker/record */}
            <div className="col-12 col-md-4">
                <Field label="Status" htmlFor="user-status">
                    <Select
                        id="user-status"
                        value={filters.status}
                        onChange={(event) =>
                            onFiltersChange((prev) => ({
                                ...prev,
                                status: event.target.value as UiStatus | "all",
                            }))
                        }
                    >
                        <option value="all">Alle</option>
                        <option value="active">Actief</option>
                        <option value="inactive">Inactief</option>
                        <option value="sold">Uitverkocht</option>
                        <option value="deleted">Geannuleerd</option>
                    </Select>
                </Field>
            </div>

            {/* Handmatige refresh: triggert opnieuw laden van gebruikers/statistieken */}
            <div className="col-12 col-md-4">
                <button
                    type="button"
                    className="btn btn-outline-success w-100"
                    onClick={onRefresh}
                >
                    Ververs
                </button>
            </div>
        </div>
    );
}
