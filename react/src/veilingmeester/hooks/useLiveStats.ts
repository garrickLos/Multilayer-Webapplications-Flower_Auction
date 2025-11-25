import { useEffect, useState } from "react";
import { listGebruikers, listVeilingen, listVeilingproducten } from "../api";
import { appConfig } from "../config";

export type LiveStats = { users: number; activeAuctions: number; products: number };

const { prefetchPageSize } = appConfig.api;

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
                const [usersResult, auctionsResult, productsResult] = await Promise.all([
                    listGebruikers({ page: 1, pageSize: prefetchPageSize, signal: controller.signal }),
                    listVeilingen({ onlyActive: true, page: 1, pageSize: prefetchPageSize, signal: controller.signal }),
                    listVeilingproducten({ page: 1, pageSize: prefetchPageSize, signal: controller.signal }),
                ]);

                setStats({
                    users: usersResult.totalCount ?? usersResult.items.length,
                    activeAuctions: auctionsResult.totalCount ?? auctionsResult.items.length,
                    products: productsResult.totalCount ?? productsResult.items.length,
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
