import type { JSX } from "react";
import type { Product } from "../api";
import { ProductKaart } from "./ProductKaart.tsx";

type LinkedProductsListProps = {
    readonly products: readonly Product[];
    readonly canUnlink: boolean;
    readonly onUnlink: (productId: number) => void;
};

export function LinkedProductsList({ products, canUnlink, onUnlink }: LinkedProductsListProps): JSX.Element {
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

export function LinkedProductPreview({ product }: { readonly product: Product }): JSX.Element {
    return <ProductKaart product={product} />;
}
