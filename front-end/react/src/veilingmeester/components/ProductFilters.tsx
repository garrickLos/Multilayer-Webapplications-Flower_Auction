import type { JSX } from "react";
import type { Auction } from "../api";
import type { ProductFilters } from "../hooks";
import { Field, Input, Select } from "./ui";

type ProductsFiltersProps = {
    readonly auctions: readonly Auction[];
    readonly filters: ProductFilters;
    readonly onFiltersChange: (updater: (prev: ProductFilters) => ProductFilters) => void;
    readonly onRefresh: () => void;
};

export function ProductFilters({auctions, filters, onFiltersChange, onRefresh,}: ProductsFiltersProps): JSX.Element {
    return (
        <div className="row g-3 align-items-end">
            {/* Statusfilter */}
            <div className="col-12 col-md-3">
                <Field label="Status" htmlFor="product-status">
                    <Select
                        id="product-status"
                        value={filters.status}
                        onChange={(event) =>
                            onFiltersChange((prev) => ({
                                ...prev,
                                status: event.target.value as typeof filters.status,
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

            {/* Verkoper */}
            <div className="col-12 col-md-3">
                <Field label="Verkoper" htmlFor="product-seller">
                    <Input
                        id="product-seller"
                        value={filters.seller}
                        onChange={(event) =>
                            onFiltersChange((prev) => ({
                                ...prev,
                                seller: event.target.value,
                            }))
                        }
                        placeholder="Naam verkoper"
                    />
                </Field>
            </div>

            {/* Veilingfilter */}
            <div className="col-12 col-md-3">
                <Field label="Veiling" htmlFor="product-auction">
                    <Select
                        id="product-auction"
                        value={filters.auctionId}
                        onChange={(event) =>
                            onFiltersChange((prev) => ({
                                ...prev,
                                auctionId: event.target.value,
                            }))
                        }
                    >
                        <option value="">Alle veilingen</option>
                        {auctions.map((auction) => (
                            <option key={auction.id} value={auction.id}>
                                {auction.title}
                            </option>
                        ))}
                    </Select>
                </Field>
            </div>

            {/* Vrij zoeken */}
            <div className="col-12 col-md-3">
                <Field label="Zoek" htmlFor="product-search">
                    <Input
                        id="product-search"
                        value={filters.search}
                        onChange={(event) =>
                            onFiltersChange((prev) => ({
                                ...prev,
                                search: event.target.value,
                            }))
                        }
                        placeholder="Zoek product"
                    />
                </Field>
            </div>

            {/* Handmatige refresh */}
            <div className="col-12 col-md-3">
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
