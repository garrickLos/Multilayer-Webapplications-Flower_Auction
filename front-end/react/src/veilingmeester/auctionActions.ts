import { useCallback, type Dispatch, type SetStateAction } from "react";
import { createAuction, updateAuction, updateProductPlanning } from "./api";
import type { Auction, Product } from "./api";
import type { AuctionPayload } from "./types";

/**
 * State + setters die deze hook nodig heeft om auctions/products in de UI bij te werken.
 */
type AuctionActionState = {
    readonly auctions: readonly Auction[];
    readonly setAuctions: Dispatch<SetStateAction<Auction[]>>;
    readonly setProducts: Dispatch<SetStateAction<Product[]>>;
    readonly setError: Dispatch<SetStateAction<string | null>>;
};

/**
 * useAuctionActions:
 * Bundelt alle "write" acties voor veilingen/product-koppelingen:
 * - aanmaken veiling
 * - product koppelen aan veiling + startprijs zetten
 * - product ontkoppelen
 * - veiling annuleren
 *
 * Elke actie:
 * - doet een API call
 * - werkt daarna lokale state bij (optimistisch / direct)
 * - zet een nette foutmelding bij errors
 */
export function useAuctionActions({
                                      auctions,
                                      setAuctions,
                                      setProducts,
                                      setError,
                                  }: AuctionActionState) {
    /**
     * Maakt een nieuwe veiling aan via de API en zet hem bovenaan in de lijst.
     * onSuccess wordt gebruikt om bv. modal te sluiten of formulier te resetten.
     */
    const handleCreateAuction = useCallback(
        async (draft: AuctionPayload, onSuccess?: () => void) => {
            try {
                const created = await createAuction({
                    veilingNaam: draft.title,
                    begintijd: draft.startIso,
                    eindtijd: draft.endIso,
                });

                setAuctions((prev) => [created, ...prev]);
                onSuccess?.();
            } catch (err) {
                setError(
                    (err as { message?: string }).message ??
                    "Veiling kon niet worden aangemaakt",
                );
            }
        },
        [setAuctions, setError],
    );

    /**
     * Koppelt een product aan een veiling en zet de startprijs.
     * Daarna wordt:
     * - productlijst geüpdatet (product vervangen)
     * - veilinglijst geüpdatet (linkedProductIds + products bijwerken)
     */
    const handleLinkProducts = useCallback(
        async (
            auctionId: number,
            productId: number,
            startPrice: number,
            onSuccess?: () => void,
        ) => {
            try {
                const updatedProduct = await updateProductPlanning(productId, {
                    startprijs: startPrice,
                    veilingNr: auctionId,
                });

                // Product state bijwerken
                setProducts((prev) =>
                    prev.map((product) =>
                        product.id === updatedProduct.id ? updatedProduct : product,
                    ),
                );

                // Auction state bijwerken (koppeling + product cache)
                setAuctions((prev) =>
                    prev.map((auction) =>
                        auction.id === auctionId
                            ? {
                                ...auction,
                                linkedProductIds: Array.from(
                                    new Set([
                                        ...(auction.linkedProductIds ?? []),
                                        updatedProduct.id,
                                    ]),
                                ),
                                products: auction.products
                                    ? [
                                        ...auction.products.filter(
                                            (product) => product.id !== updatedProduct.id,
                                        ),
                                        updatedProduct,
                                    ]
                                    : [updatedProduct],
                            }
                            : auction,
                    ),
                );

                onSuccess?.();
            } catch (err) {
                setError(
                    (err as { message?: string }).message ??
                    "Product kon niet gekoppeld worden.",
                );
            }
        },
        [setAuctions, setError, setProducts],
    );

    /**
     * Ontkoppelt een product van een veiling door startprijs en veilingNr op null te zetten.
     * Daarna wordt:
     * - productlijst geüpdatet (product vervangen)
     * - veilinglijst geüpdatet (productId verwijderen uit linkedProductIds en products)
     */
    const handleUnlinkProduct = useCallback(
        async (auctionId: number, productId: number) => {
            try {
                const updatedProduct = await updateProductPlanning(productId, {
                    startprijs: null,
                    veilingNr: null,
                });

                // Product state bijwerken
                setProducts((prev) =>
                    prev.map((product) =>
                        product.id === updatedProduct.id ? updatedProduct : product,
                    ),
                );

                // Auction state bijwerken (koppeling verwijderen)
                setAuctions((prev) =>
                    prev.map((auction) =>
                        auction.id === auctionId
                            ? {
                                ...auction,
                                linkedProductIds: (auction.linkedProductIds ?? []).filter(
                                    (id) => id !== updatedProduct.id,
                                ),
                                products: auction.products
                                    ? auction.products.filter(
                                        (product) => product.id !== updatedProduct.id,
                                    )
                                    : auction.products,
                            }
                            : auction,
                    ),
                );
            } catch (err) {
                setError(
                    (err as { message?: string }).message ??
                    "Product kon niet ontkoppeld worden.",
                );
            }
        },
        [setAuctions, setError, setProducts],
    );

    /**
     * Annuleert een veiling:
     * - zoekt eerst de huidige veiling in state (voor payload velden)
     * - update via API met status "geannuleerd"
     * - vervangt daarna de veiling in de lijst met de response
     */
    const handleCancelAuction = useCallback(
        async (auctionId: number) => {
            const current = auctions.find((auction) => auction.id === auctionId);
            if (!current) {
                setError("Veiling kon niet worden gevonden.");
                return;
            }

            try {
                const updated = await updateAuction(auctionId, {
                    veilingNaam: current.title,
                    begintijd: current.startDate,
                    eindtijd: current.endDate,
                    status: "geannuleerd",
                });

                setAuctions((prev) =>
                    prev.map((auction) => (auction.id === updated.id ? updated : auction)),
                );
            } catch (err) {
                setError(
                    (err as { message?: string }).message ??
                    "Veiling kon niet worden geannuleerd.",
                );
            }
        },
        [auctions, setAuctions, setError],
    );

    return {
        handleCreateAuction,
        handleLinkProducts,
        handleUnlinkProduct,
        handleCancelAuction,
    };
}
