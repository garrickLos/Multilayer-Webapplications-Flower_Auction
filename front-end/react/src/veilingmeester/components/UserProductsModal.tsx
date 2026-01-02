import type { JSX } from "react";
import type { Product, User } from "../api";
import { Modal } from "./Modal";
import { EmptyState } from "./ui";
import { UserProductCard } from "./UserDetailCards";

type UserProductsModalProps = { readonly user: User; readonly products: readonly Product[]; readonly onClose: () => void };

export function UserProductsModal({ user, products, onClose }: UserProductsModalProps): JSX.Element {
    return (
        <Modal title={`Producten van ${user.name}`} onClose={onClose}>
            <div className="d-flex flex-column gap-3">
                {products.length === 0 && <EmptyState title="Geen producten" description="Deze gebruiker heeft geen producten." />}
                {products.map((product) => (
                    <UserProductCard key={product.id} product={product} />
                ))}
            </div>
        </Modal>
    );
}
