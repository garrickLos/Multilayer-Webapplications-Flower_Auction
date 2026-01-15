import type { JSX } from "react";
import type { Auction, Bid, Product, User } from "../api";
import { Modal } from "./Modal";
import { EmptyState } from "./ui";
import { UserBidCard } from "./GebruikerBodKaart.tsx";

/**
 * Props voor de modal:
 * - user: de gebruiker waarvan je biedingen toont
 * - bids: lijst met biedingen van de gebruiker
 * - products/auctions: referentielijsten om bij elk bod de juiste product/veiling info te vinden
 * - onClose: callback om de modal te sluiten
 */
type UserBidsModalProps = {
    readonly user: User;
    readonly bids: readonly Bid[];
    readonly products: readonly Product[];
    readonly auctions: readonly Auction[];
    readonly onClose: () => void;
};

/**
 * Modal die alle biedingen van een gebruiker toont.
 * Als er geen biedingen zijn, wordt een EmptyState getoond.
 * Per bod wordt het bijbehorende product en de veiling opgezocht en meegegeven aan de kaart.
 */
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
                {/* Geen biedingen: toon een nette lege state */}
                {bids.length === 0 && (
                    <EmptyState
                        title="Geen biedingen"
                        description="Deze gebruiker heeft nog geen biedingen."
                    />
                )}

                {/* Overzicht van biedingen: render per bod een kaart */}
                {bids.map((bid) => (
                    <UserBidCard
                        key={bid.id}
                        bid={bid}
                        product={products.find((product) => product.id === bid.productId)}
                        auction={auctions.find((auction) => auction.id === bid.auctionId)}
                    />
                ))}
            </div>
        </Modal>
    );
}
