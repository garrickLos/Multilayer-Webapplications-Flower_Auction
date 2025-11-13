import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAuctions, getUsers } from "../../api";
import { appConfig } from "../../config";
import { adaptAuction, type PaginatedList, type VeilingDto } from "../../types";

export type MetricCard = {
    readonly id: string;
    readonly label: string;
    readonly value: string;
    readonly helper: string;
    readonly accent?: string;
    readonly progress?: number;
};

type MetricsState = {
    readonly metrics: readonly MetricCard[];
    readonly loading: boolean;
    readonly refreshing: boolean;
    readonly error: string | null;
    readonly lastUpdated: Date | null;
};

const intFmt = new Intl.NumberFormat("nl-NL");
const decFmt = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatCount = (n?: number) => intFmt.format(n ?? 0);
const formatAverage = (n: number) => decFmt.format(n);

function resolveErrorMessage(error: unknown): string {
    if (!error) return "Er ging iets mis.";
    if (typeof error === "string") return error;
    const msg = (error as { message?: string }).message;
    return msg == "string" ? msg : "Er ging iets mis. Probeer het later opnieuw.";
}

const percentage = (part: number, total: number) =>
    total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((part / total) * 100)));

function averageProductCount(list: PaginatedList<VeilingDto>): number {
    if (!list.items.length) return 0;
    const rows = list.items.map(adaptAuction);
    const sum = rows.reduce((acc, r) => acc + r.productCount, 0);
    return rows.length ? sum / rows.length : 0;
}

/**
 * Aggregates KPI data for the dashboard and keeps it refreshed.
 */
export function useDashboardMetrics(): {
    readonly metrics: readonly MetricCard[];
    readonly loading: boolean;
    readonly refreshing: boolean;
    readonly error: string | null;
    readonly lastUpdated: Date | null;
    readonly refresh: () => void;
} {
    const [state, setState] = useState<MetricsState>({
        metrics: [],
        loading: true,
        refreshing: false,
        error: null,
        lastUpdated: null,
    });

    const controllerRef = useRef<AbortController | null>(null);
    const refreshInterval = appConfig.ui.dashboardRefreshMs as number;
    const sampleSize = appConfig.ui.dashboardSampleSize as number;

    const load = useCallback((options?: { readonly silent?: boolean }) => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        setState((prev) => ({
            ...prev,
            loading: options?.silent ? prev.loading : true,
            refreshing: Boolean(options?.silent),
            error: null,
        }));

        void Promise.all([
            getUsers({ page: 1, pageSize: 1 }, controller.signal),
            getAuctions({ page: 1, pageSize: sampleSize, status: "actief" } as never, controller.signal),
            getAuctions({ page: 1, pageSize: 1, status: "inactief" } as never, controller.signal),
            getAuctions({ page: 1, pageSize: 1 } as never, controller.signal),
        ])
            .then(([users, active, inactive, all]) => {
                const totals = {
                    users: users.totalResults ?? users.items.length,
                    active: active.totalResults ?? active.items.length,
                    inactive: inactive.totalResults ?? inactive.items.length,
                    all: all.totalResults ?? all.items.length,
                };

                const totalAuctions = totals.all > 0 ? totals.all : totals.active + totals.inactive;
                const activeShare = percentage(totals.active, totalAuctions);
                const inactiveShare = percentage(totals.inactive, totalAuctions);
                const avgProducts = averageProductCount(active);

                const metrics: MetricCard[] = [
                    {
                        id: "users",
                        label: "Gebruikers",
                        value: formatCount(totals.users),
                        helper: "Geactiveerde accounts",
                        accent: "Realtime toegang",
                    },
                    {
                        id: "active",
                        label: "Actieve veilingen",
                        value: formatCount(totals.active),
                        helper: "Live klokken",
                        accent: `${activeShare}% van totaal`,
                        progress: activeShare,
                    },
                    {
                        id: "inactive",
                        label: "Inactief of gepland",
                        value: formatCount(totals.inactive),
                        helper: "Gepland of afgerond",
                        accent: `${inactiveShare}% van totaal`,
                        progress: inactiveShare,
                    },
                    {
                        id: "inventory",
                        label: "Gem. producten",
                        value: formatAverage(avgProducts),
                        helper: "per actieve veiling",
                        accent: active.items.length > 0 ? `${active.items.length} veilingen gescand` : "Geen monsters",
                    },
                ];

                setState({
                    metrics,
                    loading: false,
                    refreshing: false,
                    error: null,
                    lastUpdated: new Date(),
                });
            })
            .catch((error) => {
                if ((error as { name?: string }).name === "AbortError") return;
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    refreshing: false,
                    error: resolveErrorMessage(error),
                }));
            });
    }, [sampleSize]);

    useEffect(() => load(), [load]);

    useEffect(() => {
        if (!refreshInterval || refreshInterval <= 0 || typeof window === "undefined") return;
        const timer = window.setInterval(() => load({ silent: true }), refreshInterval);
        return () => window.clearInterval(timer);
    }, [load, refreshInterval]);

    useEffect(() => () => controllerRef.current?.abort(), []);

    const refresh = useCallback(() => load(), [load]);

    return useMemo(
        () => ({
            metrics: state.metrics,
            loading: state.loading,
            refreshing: state.refreshing,
            error: state.error,
            lastUpdated: state.lastUpdated,
            refresh,
        }),
        [refresh, state.metrics, state.loading, state.refreshing, state.error, state.lastUpdated],
    );
}
