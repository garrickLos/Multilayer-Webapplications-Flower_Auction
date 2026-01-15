import { useEffect, useMemo, useState, type JSX } from "react";
import type { Auction, Product } from "../api";
import { canUnlinkProduct, isProductLinkingLocked } from "../rules";
import { formatCurrency, parseCurrencyValue } from "../helpers";
import { Modal } from "./Modal";
import { EmptyState, Field, Input, Select } from "./ui";
import { LinkedProductPreview, LinkedProductsList } from "./ProductLinking";

/**
 * Props voor de "product koppelen" modal:
 * - auction: de veiling waar je aan koppelt
 * - products: lijst met alle producten (gekoppeld + beschikbaar)
 * - onClose: sluit callback
 * - onSave: callback om een product te koppelen met startprijs
 * - onUnlink: callback om een product te ontkoppelen
 */
type LinkProductsModalProps = {
    readonly auction: Auction;
    readonly products: readonly Product[];
    readonly onClose: () => void;
    readonly onSave: (productId: number, startPrice: number) => void;
    readonly onUnlink: (productId: number) => void;
};

/**
 * Modal om producten aan een veiling te koppelen.
 * - toont gekoppelde producten (met optioneel ontkoppelen)
 * - toont een formulier om een beschikbaar product te kiezen + startprijs te zetten
 * - blokkeert wijzigingen als koppelen niet is toegestaan (actieve veiling)
 */
export function ProductKoppelenModal({
                                         auction,
                                         products,
                                         onClose,
                                         onSave,
                                         onUnlink,
                                     }: LinkProductsModalProps): JSX.Element {
    // Koppelen niet toegestaan bij actieve veiling (lock-regel)
    const isLocked = isProductLinkingLocked(auction);

    /**
     * Beschikbare producten: nog niet gekoppeld aan een veiling.
     * useMemo om niet telkens opnieuw te filteren bij renders.
     */
    const availableProducts = useMemo(
        () => products.filter((product) => !product.linkedAuctionId),
        [products]
    );

    /**
     * Gekoppelde producten: alleen producten die gekoppeld zijn aan deze veiling.
     */
    const linkedProducts = useMemo(
        () => products.filter((product) => product.linkedAuctionId === auction.id),
        [auction.id, products]
    );

    /**
     * Form state:
     * - productId: string omdat <select> values strings zijn
     * - startPrice: string voor inputveld (pas omzetten naar number bij opslaan)
     */
    const [productId, setProductId] = useState<string>(() =>
        availableProducts[0]?.id ? String(availableProducts[0].id) : ""
    );

    const [startPrice, setStartPrice] = useState<string>(() => {
        const first = availableProducts[0];
        return first ? String(first.startPrice ?? first.minimumPrice ?? 0) : "";
    });

    // Form error voor validatie/lock meldingen
    const [formError, setFormError] = useState<string | null>(null);

    /**
     * Startprijs automatisch aanpassen als de geselecteerde product verandert.
     * Zet ook errors terug naar null bij een geldige selectie.
     */
    useEffect(() => {
        const selected = availableProducts.find(
            (product) => product.id === Number(productId)
        );

        if (selected) {
            setStartPrice(String(selected.startPrice ?? selected.minimumPrice ?? 0));
            setFormError(null);
        }
    }, [availableProducts, productId]);

    /**
     * Opslaan met validatie:
     * - blokkeer als veiling actief is
     * - product moet gekozen zijn
     * - startprijs moet een geldig positief getal zijn
     * Daarna: onSave(productId, startPrice) aanroepen.
     */
    const handleSave = () => {
        if (isLocked) {
            setFormError("Aanpassingen zijn niet toegestaan tijdens een actieve veiling.");
            return;
        }

        if (!productId) {
            setFormError("Selecteer een product om te koppelen.");
            return;
        }

        const numericStartPrice = parseCurrencyValue(startPrice);
        if (numericStartPrice === null || numericStartPrice <= 0) {
            setFormError("Voer een geldige startprijs in.");
            return;
        }

        onSave(Number(productId), numericStartPrice);
    };

    // Huidig geselecteerd product (voor preview kaart)
    const selectedProduct = availableProducts.find(
        (product) => product.id === Number(productId)
    );

    return (
        <Modal
            title={`Koppel product aan ${auction.title}`}
            onClose={onClose}
            footer={
                <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSave}
                    disabled={availableProducts.length === 0}
                >
                    Opslaan
                </button>
            }
        >
            <div className="d-flex flex-column gap-3">
                <p className="text-muted mb-0">
                    Kies een product en stel de startprijs in.
                </p>

                {/* Waarschuwing wanneer de veiling actief is (koppelen/ontkoppelen uitgeschakeld) */}
                {isLocked && (
                    <div className="alert alert-warning mb-0">
                        Deze veiling is actief. Aanpassen is niet mogelijk.
                    </div>
                )}

                {/* Gekoppelde producten overzicht */}
                <div>
                    <p className="text-uppercase text-muted small mb-2">
                        Gekoppelde producten
                    </p>
                    <LinkedProductsList
                        products={linkedProducts}
                        canUnlink={canUnlinkProduct(auction)}
                        onUnlink={onUnlink}
                    />
                </div>

                {/* Koppelformulier: alleen tonen als er nog beschikbare producten zijn */}
                {availableProducts.length === 0 ? (
                    <EmptyState
                        title="Geen beschikbare producten"
                        description="Alle producten zijn al gekoppeld."
                    />
                ) : (
                    <div className="row g-3">
                        {/* Product select */}
                        <div className="col-12">
                            <Field label="Product" htmlFor="link-product">
                                <Select
                                    id="link-product"
                                    value={productId}
                                    onChange={(event) => {
                                        setProductId(event.target.value);
                                        setFormError(null);
                                    }}
                                    disabled={isLocked}
                                >
                                    <option value="" disabled>
                                        Kies een product
                                    </option>

                                    {availableProducts.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} (#{product.id}) ·{" "}
                                            {product.category ?? "Onbekend"} ·{" "}
                                            {formatCurrency(product.minimumPrice / 100)} ·{" "}
                                            {product.stock ?? 0} stuks
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        </div>

                        {/* Preview van geselecteerde product */}
                        {selectedProduct && (
                            <div className="col-12">
                                <LinkedProductPreview product={selectedProduct} />
                            </div>
                        )}

                        {/* Startprijs input */}
                        <div className="col-12">
                            <Field label="Startprijs" htmlFor="link-startprice">
                                <Input
                                    id="link-startprice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={startPrice}
                                    onChange={(event) => setStartPrice(event.target.value)}
                                    disabled={isLocked}
                                />
                            </Field>
                        </div>

                        {/* Validatie error */}
                        {formError && (
                            <div className="col-12 alert alert-danger mb-0">
                                {formError}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
