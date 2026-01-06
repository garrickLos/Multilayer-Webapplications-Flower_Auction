import type { JSX } from "react";
import type { Auction, Bid, Product, User } from "../api";
import { Modal } from "./Modal";
import { EmptyState } from "./ui";
import { UserBidCard } from "./GebruikerBodKaart.tsx";

type UserBidsModalProps = {
    readonly user: User;
    readonly bids: readonly Bid[];
    readonly products: readonly Product[];
    readonly auctions: readonly Auction[];
    readonly onClose: () => void;
};

export function GebruikerBiedingenModal({
                                  user,
                                  bids,
                                  products,
                                  auctions,
                                  onClose,
                              }: UserBidsModalProps): JSX.Element {
    return (
        <Modal title={`Biedingen van ${user.name}`} onClose={onClose}>
            <div className="d-flex flex-column gap-3">
                {/* Geen biedingen */}
                {bids.length === 0 && (
                    <EmptyState
                        title="Geen biedingen"
                        description="Deze gebruiker heeft nog geen biedingen."
                    />
                )}

                {/* Overzicht van biedingen */}
                {bids.map((bid) => (
                    <UserBidCard
                        key={bid.id}
                        bid={bid}
                        product={products.find(
                            (product) => product.id === bid.productId,
                        )}
                        auction={auctions.find(
                            (auction) => auction.id === bid.auctionId,
                        )}
                    />
                ))}
            </div>
        </Modal>
    );
}