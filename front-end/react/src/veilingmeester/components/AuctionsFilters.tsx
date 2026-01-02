import type { JSX } from "react";
import type { AuctionFilters } from "../hooks";
import { Field, Input } from "./ui";

type AuctionsFiltersProps = {
    readonly search: string;
    readonly filters: AuctionFilters;
    readonly onSearchChange: (value: string) => void;
    readonly onFiltersChange: (updater: (prev: AuctionFilters) => AuctionFilters) => void;
    readonly onCreateRequested: () => void;
    readonly onRefresh: () => void;
};

export function AuctionsFilters({
    search,
    filters,
    onSearchChange,
    onFiltersChange,
    onCreateRequested,
    onRefresh,
}: AuctionsFiltersProps): JSX.Element {
    return (
        <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-wrap align-items-end gap-2">
                <Input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Zoek in alle kolommen (titel, klokprijs, start, einde, status…)"
                    label="Zoeken in veilingen"
                    className="flex-grow-1"
                />
                <button type="button" className="btn btn-outline-success" onClick={onRefresh}>
                    Ververs
                </button>
                <button type="button" className="btn btn-success" onClick={onCreateRequested}>
                    Nieuwe veiling
                </button>
            </div>

            <div className="row g-3">
                <div className="col-6 col-md-3">
                    <Field label="Alleen actief" htmlFor="onlyActive">
                        <div className="form-check form-switch">
                            <input
                                id="onlyActive"
                                className="form-check-input"
                                type="checkbox"
                                checked={filters.onlyActive}
                                onChange={(event) => onFiltersChange((prev) => ({ ...prev, onlyActive: event.target.checked }))}
                            />
                            <label className="form-check-label" htmlFor="onlyActive">
                                Toon alleen lopende veilingen
                            </label>
                        </div>
                    </Field>
                </div>
                <div className="col-6 col-md-3">
                    <Field label="Vanaf datum" htmlFor="from">
                        <input
                            id="from"
                            type="datetime-local"
                            className="form-control"
                            value={filters.from}
                            onChange={(event) => onFiltersChange((prev) => ({ ...prev, from: event.target.value }))}
                        />
                    </Field>
                </div>
                <div className="col-6 col-md-3">
                    <Field label="Tot datum" htmlFor="to">
                        <input
                            id="to"
                            type="datetime-local"
                            className="form-control"
                            value={filters.to}
                            onChange={(event) => onFiltersChange((prev) => ({ ...prev, to: event.target.value }))}
                        />
                    </Field>
                </div>
                <div className="col-6 col-md-3">
                    <Field label="Product" htmlFor="veilingProduct">
                        <input
                            id="veilingProduct"
                            type="number"
                            className="form-control"
                            value={filters.veilingProduct}
                            onChange={(event) => onFiltersChange((prev) => ({ ...prev, veilingProduct: event.target.value }))}
                        />
                    </Field>
                </div>
            </div>
        </div>
    );
}
