import type { JSX } from "react";
import type { Product, User } from "../api";
import { formatCurrency } from "../helpers";
import { mapProductStatusToUiStatus } from "../rules";
import { Modal } from "./Modal";
import { EmptyState, StatusBadge } from "./ui";

type UserProductsModalProps = { readonly user: User; readonly products: readonly Product[]; readonly onClose: () => void };

export function UserProductsModal({ user, products, onClose }: UserProductsModalProps): JSX.Element {
    return (
        <Modal title={`Producten van ${user.name}`} onClose={onClose}>
            <div className="d-flex flex-column gap-3">
                {products.length === 0 && <EmptyState title="Geen producten" description="Deze gebruiker heeft geen producten." />}
                {products.map((product) => (
                    <div key={product.id} className="d-flex justify-content-between align-items-center p-3 bg-body-secondary rounded-4">
                        <div>
                            <p className="mb-1 fw-semibold">{product.name}</p>
                            <p className="mb-0 text-muted">Min. prijs {formatCurrency(product.minimumPrice)}</p>
                        </div>
                        <StatusBadge status={mapProductStatusToUiStatus(product.status)} />
                    </div>
                ))}
            </div>
        </Modal>
    );
}
