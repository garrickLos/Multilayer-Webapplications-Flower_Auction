import type { JSX } from "react";
import type { Product, User } from "../api";
import { Modal } from "./Modal";
import { EmptyState } from "./ui";
import { UserProductCard } from "./GebruikerBodKaart.tsx";

/**
 * Props voor de modal met producten van een gebruiker:
 * - user: gebruiker waarvoor je de producten toont
 * - products: lijst met producten van deze gebruiker
 * - onClose: sluit callback voor de modal
 */
type UserProductsModalProps = {
    readonly user: User;
    readonly products: readonly Product[];
    readonly onClose: () => void;
};

/**
 * UserProductsModal:
 * Toont in een modal alle producten van een gebruiker.
 * - Als de lijst leeg is: toont een EmptyState
 * - Anders: toont per product een UserProductCard
 */
export function UserProductsModal({
                                      user,
                                      products,
                                      onClose,
                                  }: UserProductsModalProps): JSX.Element {
    return (
        <Modal title={`Producten van ${user.name}`} onClose={onClose}>
            <div className="d-flex flex-column gap-3">
                {/* Geen producten */}
                {products.length === 0 && (
                    <EmptyState
                        title="Geen producten"
                        description="Deze gebruiker heeft geen producten."
                    />
                )}

                {/* Overzicht van producten */}
                {products.map((product) => (
                    <UserProductCard key={product.id} product={product} />
                ))}
            </div>
        </Modal>
    );
}
