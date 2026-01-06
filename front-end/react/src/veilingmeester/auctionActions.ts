import { useCallback, type Dispatch, type SetStateAction } from "react";
import { createAuction, updateAuction, updateProductPlanning } from "./api";
import type { Auction, Product } from "./api";
import type { AuctionPayload } from "./types";

type AuctionActionState = {
    readonly auctions: readonly Auction[];
    readonly setAuctions: Dispatch<SetStateAction<Auction[]>>;
    readonly setProducts: Dispatch<SetStateAction<Product[]>>;
    readonly setError: Dispatch<SetStateAction<string | null>>;
};

export function useAuctionActions({ auctions, setAuctions, setProducts, setError }: AuctionActionState) {
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
                setError((err as { message?: string }).message ?? "Veiling kon niet worden aangemaakt");
            }
        },
        [setAuctions, setError],
    );

    const handleLinkProducts = useCallback(
        async (auctionId: number, productId: number, startPrice: number, onSuccess?: () => void) => {
            try {
                const updatedProduct = await updateProductPlanning(productId, { startprijs: startPrice, veilingNr: auctionId });
                setProducts((prev) => prev.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)));
                setAuctions((prev) =>
                    prev.map((auction) =>
                        auction.id === auctionId
                            ? {
                                  ...auction,
                                  linkedProductIds: Array.from(new Set([...(auction.linkedProductIds ?? []), updatedProduct.id])),
                                  products: auction.products
                                      ? [...auction.products.filter((product) => product.id !== updatedProduct.id), updatedProduct]
                                      : [updatedProduct],
                              }
                            : auction,
                    ),
                );
                onSuccess?.();
            } catch (err) {
                setError((err as { message?: string }).message ?? "Product kon niet gekoppeld worden.");
            }
        },
        [setAuctions, setError, setProducts],
    );

    const handleUnlinkProduct = useCallback(
        async (auctionId: number, productId: number) => {
            try {
                const updatedProduct = await updateProductPlanning(productId, { startprijs: null, veilingNr: null });
                setProducts((prev) => prev.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)));
                setAuctions((prev) =>
                    prev.map((auction) =>
                        auction.id === auctionId
                            ? {
                                  ...auction,
                                  linkedProductIds: (auction.linkedProductIds ?? []).filter((id) => id !== updatedProduct.id),
                                  products: auction.products ? auction.products.filter((product) => product.id !== updatedProduct.id) : auction.products,
                              }
                            : auction,
                    ),
                );
            } catch (err) {
                setError((err as { message?: string }).message ?? "Product kon niet ontkoppeld worden.");
            }
        },
        [setAuctions, setError, setProducts],
    );

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
                setAuctions((prev) => prev.map((auction) => (auction.id === updated.id ? updated : auction)));
            } catch (err) {
                setError((err as { message?: string }).message ?? "Veiling kon niet worden geannuleerd.");
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
