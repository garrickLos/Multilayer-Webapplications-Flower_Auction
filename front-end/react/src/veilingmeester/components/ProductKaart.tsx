import type { JSX, ReactNode } from "react";
import type { Product } from "../api";
import { formatCurrency } from "../helpers";
import { mapProductStatusToUiStatus } from "../rules";
import { StatusBadge } from "./ui";
import MissingPicture from "../../assets/pictures/webp/MissingPicture.webp";
import { resolveImageUrl } from "../../config/api";

// Fallback-afbeelding bij ontbrekende productfoto
const fallbackImage = MissingPicture;

/**
 * Props voor de productkaart:
 * - product: product data die getoond wordt
 * - action: optionele actie rechtsboven (bijv. knop of menu)
 * - showStartPrice: toont startprijs naast minimumprijs (default true)
 * - showStatus: toont status badge (default false)
 * - className: extra classes voor layout/styling
 */
type ProductCardProps = {
    readonly product: Product;
    readonly action?: ReactNode;
    readonly showStartPrice?: boolean;
    readonly showStatus?: boolean;
    readonly className?: string;
};

/**
 * ProductKaart:
 * Toont een product met afbeelding, naam, categorie/locatie en prijsinformatie.
 * Optioneel:
 * - een actie element (bijv. knop)
 * - startprijs
 * - statusbadge
 */
export function ProductKaart({
                                 product,
                                 action,
                                 showStartPrice = true,
                                 showStatus = false,
                                 className,
                             }: ProductCardProps): JSX.Element {
    return (
        <div
            className={`d-flex flex-column flex-md-row gap-3 align-items-start p-3 bg-body-secondary rounded-4 ${
                className ?? ""
            }`}
        >
            {/* Productafbeelding (fallback als imagePath ontbreekt) */}
            <img
                src={resolveImageUrl(product.imagePath) || fallbackImage}
                alt={product.name}
                className="rounded-3 flex-shrink-0"
                style={{ width: 120, height: 90, objectFit: "cover" }}
            />

            {/* Productinformatie */}
            <div className="flex-grow-1">
                <div className="d-flex justify-content-between gap-2">
                    <div>
                        <p className="mb-1 fw-semibold">{product.name}</p>
                        <p className="mb-1 text-muted">
                            {product.category ?? "Onbekende categorie"} ·{" "}
                            {product.location ?? "Onbekende locatie"}
                        </p>
                    </div>

                    {/* Optionele actie (bijv. knop, dropdown, icon button) */}
                    {action}
                </div>

                {/* Prijsinformatie (min. prijs en optioneel startprijs) */}
                <p className="mb-0 text-muted">
                    Min. prijs {formatCurrency(product.minimumPrice / 100)}
                    {showStartPrice &&
                        ` · Start ${formatCurrency(
                            product.startPrice ?? product.minimumPrice
                        )}`}
                </p>
            </div>

            {/* Optionele statusbadge (bijv. active/inactive/sold) */}
            {showStatus && (
                <div className="align-self-start">
                    <StatusBadge status={mapProductStatusToUiStatus(product.status)} />
                </div>
            )}
        </div>
    );
}

/**
 * ProductThumbnail:
 * Kleine, compacte productafbeelding voor tabellen/lijsten/previews.
 */
export function ProductThumbnail({
                                     product,
                                 }: {
    readonly product: Product;
}): JSX.Element {
    return (
        <img
            src={resolveImageUrl(product.imagePath) || fallbackImage}
            alt={product.name}
            className="rounded-3"
            style={{ width: 48, height: 48, objectFit: "cover" }}
        />
    );
}
