import { useEffect, useState } from "react";
import { apiConfig, fetchAuctions, fetchBids, fetchProducts, fetchUsers, type ApiError } from "./api";

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
                    fetchUsers({ pageSize: apiConfig.defaultPageSize }, controller.signal),
                    fetchAuctions({ onlyActive: true, pageSize: apiConfig.defaultPageSize }, controller.signal),
                    fetchProducts({ pageSize: apiConfig.defaultPageSize }, controller.signal),
                    fetchBids({ pageSize: apiConfig.defaultPageSize }, controller.signal),
                ]);

                setStats({
                    users: usersResponse.items.length,
                    activeAuctions: activeAuctionsResponse.items.length,
                    products: productsResponse.items.length,
                    bids: bidsResponse.items.length,
                });
                setLastUpdated(new Date());
            } catch (err) {
                if ((err as { name?: string }).name === "AbortError") return;
                const apiError = err as ApiError;
                if (apiError.status === 401 || apiError.status === 403) {
                    setError("Je bent uitgelogd of hebt geen toegang. Log opnieuw in om verder te gaan.");
                } else {
                    setError((apiError as { message?: string }).message ?? "Kan statistieken niet laden");
                }
            } finally {
                setLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, []);

    return { stats, loading, error, lastUpdated };
}
