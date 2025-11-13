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

const integerFormatter = new Intl.NumberFormat("nl-NL");
const decimalFormatter = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatCount(value: number | undefined): string {
    return integerFormatter.format(value ?? 0);
}

function formatAverage(value: number): string {
    return decimalFormatter.format(value);
}

function resolveErrorMessage(error: unknown): string {
    if (!error) return "Er ging iets mis.";
    if (typeof error === "string") return error;
    if (typeof (error as { message?: string }).message === "string") {
        return (error as { message: string }).message;
    }
    return "Er ging iets mis. Probeer het later opnieuw.";
}

function percentage(part: number, total: number): number {
    if (total <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function averageProductCount(list: PaginatedList<VeilingDto>): number {
    if (!list.items.length) {
        return 0;
    }
    const rows = list.items.map((item) => adaptAuction(item));
    const sum = rows.reduce((total, row) => total + row.productCount, 0);
    return rows.length === 0 ? 0 : sum / rows.length;
}

/**
 * Aggregates KPI data for the dashboard and keeps it refreshed.
 *
 * @returns The live dashboard metrics with helpers and refresh controls.
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
    const refreshInterval = appConfig.ui.dashboardRefreshMs;

    const load = useCallback(
        (options?: { readonly silent?: boolean }) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            setState((previous) => ({
                ...previous,
                loading: options?.silent ? previous.loading : true,
                refreshing: Boolean(options?.silent),
                error: null,
            }));

            const sampleSize = appConfig.ui.dashboardSampleSize;

            void Promise.all([
                getUsers({ page: 1, pageSize: 1 }, controller.signal),
                getAuctions({ page: 1, pageSize: sampleSize, status: "actief" }, controller.signal),
                getAuctions({ page: 1, pageSize: 1, status: "inactief" }, controller.signal),
                getAuctions({ page: 1, pageSize: 1 }, controller.signal),
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
                    const averageProducts = averageProductCount(active);

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
                            value: formatAverage(averageProducts),
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
                    if ((error as { name?: string }).name === "AbortError") {
                        return;
                    }
                    setState((previous) => ({
                        ...previous,
                        loading: false,
                        refreshing: false,
                        error: resolveErrorMessage(error),
                    }));
                });
        },
        [],
    );

    useEffect(() => load(), [load]);

    useEffect(() => {
        if (!refreshInterval || refreshInterval <= 0) {
            return undefined;
        }
        if (typeof window === "undefined") {
            return undefined;
        }
        const timer = window.setInterval(() => load({ silent: true }), refreshInterval);
        return () => window.clearInterval(timer);
    }, [load, refreshInterval]);

    useEffect(() => {
        return () => {
            controllerRef.current?.abort();
        };
    }, []);

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
        [refresh, state.error, state.lastUpdated, state.loading, state.metrics, state.refreshing],
    );
}
