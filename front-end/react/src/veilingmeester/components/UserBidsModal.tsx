import type { JSX } from "react";
import type { Bid, User } from "../api";
import { formatCurrency } from "../helpers";
import { Modal } from "./Modal";
import { Chip, EmptyState } from "./ui";

type UserBidsModalProps = { readonly user: User; readonly bids: readonly Bid[]; readonly onClose: () => void };

export function UserBidsModal({ user, bids, onClose }: UserBidsModalProps): JSX.Element {
    return (
        <Modal title={`Biedingen van ${user.name}`} onClose={onClose}>
            <div className="d-flex flex-column gap-3">
                {bids.length === 0 && <EmptyState title="Geen biedingen" description="Deze gebruiker heeft nog geen biedingen." />}
                {bids.map((bid) => (
                    <div key={bid.id} className="d-flex justify-content-between align-items-center p-3 bg-body-secondary rounded-4">
                        <div>
                            <p className="mb-1 fw-semibold">Bod #{bid.id}</p>
                            <p className="mb-0 text-muted">
                                {bid.quantity} x {formatCurrency(bid.amount)} op veiling #{bid.auctionId}
                            </p>
                        </div>
                        <Chip label={bid.status ?? "actief"} />
                    </div>
                ))}
            </div>
        </Modal>
    );
}
