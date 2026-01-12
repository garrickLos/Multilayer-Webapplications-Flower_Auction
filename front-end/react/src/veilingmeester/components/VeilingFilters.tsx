// UI-component voor zoeken en filteren van veilingen.

import type { JSX } from "react";
import type { AuctionFilters } from "../hooks";
import { Field, Select } from "./ui";

type AuctionsFiltersProps = {
    readonly search: string;
    readonly filters: AuctionFilters;

    readonly onSearchChange: (value: string) => void;
    readonly onFiltersChange: (updater: (prev: AuctionFilters) => AuctionFilters) => void;

    readonly onCreateRequested: () => void;
    readonly onRefresh: () => void;
};

export function VeilingFilters({search, filters, onSearchChange, onFiltersChange, onCreateRequested, onRefresh,}: AuctionsFiltersProps): JSX.Element {
    const updateFilters = (patch: Partial<AuctionFilters>) =>
        onFiltersChange((prev) => ({ ...prev, ...patch }));

    return (
        <div className="card-body">
            {/* Topbar: acties + zoeken */}
            <div className="row g-2 align-items-end">
                <div className="col-12 col-lg">
                    <Field label="Zoeken in veilingen" htmlFor="auctionSearch">
                        <div className="input-group">
                            <input
                                id="auctionSearch"
                                className="form-control"
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Zoek in alle kolommen (titel, klokprijs, start, einde, status…)"
                            />
                        </div>
                    </Field>
                </div>
                <div className="col-12 col-lg-auto">
                    <div className="btn-group" role="group" aria-label="Acties">
                        <button type="button" className="btn btn-outline-success" onClick={onRefresh}>
                            Ververs
                        </button>
                        <button type="button" className="btn btn-success" onClick={onCreateRequested}>
                            Nieuwe veiling
                        </button>
                    </div>
                </div>
            </div>

            <div className="my-4" />

            {/* Filters */}
            <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-3">
                    <Field label="Alleen actief" htmlFor="onlyActive">
                        <div className="form-check form-switch">
                            <input
                                id="onlyActive"
                                className="form-check-input"
                                type="checkbox"
                                checked={filters.onlyActive}
                                onChange={(e) => updateFilters({ onlyActive: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="onlyActive">
                                Toon alleen lopende veilingen
                            </label>
                        </div>
                    </Field>
                </div>

                <div className="col-12 col-md-6 col-lg-3">
                    <Field label="Vanaf datum" htmlFor="from">
                        <input
                            id="from"
                            type="datetime-local"
                            className="form-control"
                            value={filters.from}
                            onChange={(e) => updateFilters({ from: e.target.value })}
                        />
                    </Field>
                </div>

                <div className="col-12 col-md-6 col-lg-3">
                    <Field label="Tot datum" htmlFor="to">
                        <input
                            id="to"
                            type="datetime-local"
                            className="form-control"
                            value={filters.to}
                            onChange={(e) => updateFilters({ to: e.target.value })}
                        />
                    </Field>
                </div>

                <div className="col-12 col-md-6 col-lg-3">
                    <Field label="Status" htmlFor="auctionStatus">
                        <Select
                            id="auctionStatus"
                            value={filters.status}
                            onChange={(event) => updateFilters({ status: event.target.value as AuctionFilters["status"] })}
                        >
                            <option value="all">Alle statussen</option>
                            <option value="active">Actief</option>
                            <option value="inactive">Inactief</option>
                            <option value="finished">Afgesloten</option>
                            <option value="sold">Uitverkocht</option>
                            <option value="deleted">Geannuleerd</option>
                        </Select>
                    </Field>
                </div>
            </div>
        </div>
    );
}
