import { useEffect, useMemo, useState, type JSX } from "react";
import type { Auction, Product } from "../api";
import { canUnlinkProduct, isProductLinkingLocked } from "../rules";
import { formatCurrency, parseCurrencyValue } from "../helpers";
import { Modal } from "./Modal";
import { EmptyState, Field, Input, Select } from "./ui";
import { LinkedProductPreview, LinkedProductsList } from "./ProductLinking";

type LinkProductsModalProps = {
    readonly auction: Auction;
    readonly products: readonly Product[];
    readonly onClose: () => void;
    readonly onSave: (productId: number, startPrice: number) => void;
    readonly onUnlink: (productId: number) => void;
};


export function LinkProductsModal({ auction, products, onClose, onSave, onUnlink }: LinkProductsModalProps): JSX.Element {
    const isLocked = isProductLinkingLocked(auction);
    const availableProducts = useMemo(() => products.filter((product) => !product.linkedAuctionId), [products]);
    const linkedProducts = useMemo(() => products.filter((product) => product.linkedAuctionId === auction.id), [auction.id, products]);
    const [productId, setProductId] = useState<string>(() => (availableProducts[0]?.id ? String(availableProducts[0].id) : ""));
    const [startPrice, setStartPrice] = useState<string>(() => {
        const first = availableProducts[0];
        return first ? String(first.startPrice ?? first.minimumPrice ?? 0) : "";
    });
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        const selected = availableProducts.find((product) => product.id === Number(productId));
        if (selected) {
            setStartPrice(String(selected.startPrice ?? selected.minimumPrice ?? 0));
            setFormError(null);
        }
    }, [availableProducts, productId]);

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

    const selectedProduct = availableProducts.find((product) => product.id === Number(productId));

    return (
        <Modal
            title={`Koppel product aan ${auction.title}`}
            onClose={onClose}
            footer={
                <button type="button" className="btn btn-success" onClick={handleSave} disabled={availableProducts.length === 0}>
                    Opslaan
                </button>
            }
        >
            <div className="d-flex flex-column gap-3">
                <p className="text-muted mb-0">Kies een product dat nog niet is gekoppeld en vul de startprijs in.</p>
                {isLocked && <div className="alert alert-warning mb-0">Deze veiling is actief. Koppelen of ontkoppelen is nu niet mogelijk.</div>}
                <div>
                    <p className="text-uppercase text-muted small mb-2">Gekoppelde producten</p>
                    <LinkedProductsList products={linkedProducts} canUnlink={canUnlinkProduct(auction)} onUnlink={onUnlink} />
                </div>
                {availableProducts.length === 0 ? (
                    <EmptyState title="Geen beschikbare producten" description="Alle producten zijn al gekoppeld aan een veiling." />
                ) : (
                    <div className="row g-3">
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
                                            {product.name} (#{product.id}) · {product.category ?? "Onbekend"} · {formatCurrency(product.minimumPrice)} · {product.stock ?? 0} stuks
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        </div>
                        {selectedProduct && (
                            <div className="col-12">
                                <LinkedProductPreview product={selectedProduct} />
                            </div>
                        )}
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
                        {formError && <div className="col-12 alert alert-danger mb-0">{formError}</div>}
                    </div>
                )}
            </div>
        </Modal>
    );
}
