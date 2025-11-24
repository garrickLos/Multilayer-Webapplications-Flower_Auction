import { useEffect, useState } from "react";
import { getAuctions, getBids, getProducts, getUsers } from "../api";

export type LiveStats = { users: number; activeAuctions: number; products: number; bids: number };

export function useLiveStats() {
    const [stats, setStats] = useState<LiveStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [usersResponse, activeAuctionsResponse, productsResponse, bidsResponse] = await Promise.all([
                    getUsers({ pageSize: 200 }, controller.signal),
                    getAuctions({ onlyActive: true, pageSize: 200 }, controller.signal),
                    getProducts({ pageSize: 200 }, controller.signal),
                    getBids({ pageSize: 200 }, controller.signal),
                ]);

                setStats({
                    users: usersResponse.items.length,
                    activeAuctions: activeAuctionsResponse.items.length,
                    products: productsResponse.items.length,
                    bids: bidsResponse.items.length, // TODO: filter laatste 24u zodra de backend een timestamp exposeert.
                });
                setLastUpdated(new Date());
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                setError((err as { message?: string }).message ?? "Kan statistieken niet laden");
            } finally {
                setLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, []);

    return { stats, loading, error, lastUpdated };
}
