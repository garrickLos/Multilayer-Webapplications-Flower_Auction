import type { JSX } from "react";
import type { Product } from "../api";
import { ProductKaart } from "./ProductKaart.tsx";

/**
 * Props voor de lijst met gekoppelde producten:
 * - products: producten die al gekoppeld zijn
 * - canUnlink: bepaalt of ontkoppelen is toegestaan (true/false)
 * - onUnlink: callback om een product te ontkoppelen
 */
type LinkedProductsListProps = {
    readonly products: readonly Product[];
    readonly canUnlink: boolean;
    readonly onUnlink: (productId: number) => void;
};

/**
 * Toont een lijst van gekoppelde producten.
 * - Als er geen producten zijn: toon een korte melding.
 * - Als ontkoppelen mag: toon een verwijderknop per product.
 */
export function LinkedProductsList({
                                       products,
                                       canUnlink,
                                       onUnlink,
                                   }: LinkedProductsListProps): JSX.Element {
    // Geen gekoppelde producten: toon fallback tekst
    if (products.length === 0) {
        return <p className="text-muted mb-0">Nog geen gekoppelde producten.</p>;
    }

    return (
        <div className="d-flex flex-column gap-2">
            {products.map((product) => (
                <ProductKaart
                    key={product.id}
                    product={product}
                    showStartPrice={false}
                    action={
                        canUnlink ? (
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm align-self-start"
                                onClick={() => onUnlink(product.id)}
                                aria-label={`Ontkoppel ${product.name}`}
                            >
                                ✕
                            </button>
                        ) : null
                    }
                />
            ))}
        </div>
    );
}

/**
 * Kleine preview van één geselecteerd product.
 * Hergebruikt dezelfde ProductKaart component.
 */
export function LinkedProductPreview({
                                         product,
                                     }: {
    readonly product: Product;
}): JSX.Element {
    return <ProductKaart product={product} />;
}
