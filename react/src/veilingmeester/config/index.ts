type EnvSource = { env?: Record<string, string | undefined> };

const readEnv = (key: string): string | undefined => {
    const metaEnv = typeof import.meta !== "undefined" ? (import.meta as EnvSource).env : undefined;
    if (metaEnv?.[key]) return metaEnv[key];

    const nodeEnv = (typeof globalThis !== "undefined" ? (globalThis as { process?: EnvSource }).process : undefined)?.env;
    return nodeEnv?.[key];
};

const toNumber = (value: string | undefined, fallback: number): number => {
    const parsed = value ? Number.parseInt(value, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toNumberList = (value: string | undefined, fallback: readonly number[]): readonly number[] => {
    if (!value) return fallback;
    const numbers = value
        .split(",")
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((num) => Number.isFinite(num) && num > 0);
    return numbers.length ? numbers : fallback;
};

const defaultBaseUrl = "http://localhost:5105";

export type AppConfig = {
    readonly api: {
        readonly baseUrl: string;
        readonly requestTimeoutMs: number;
        readonly prefetchPageSize: number;
    };
    readonly pagination: {
        readonly table: readonly number[];
        readonly modal: readonly number[];
    };
    readonly polling: {
        readonly intervalMs: number;
        readonly backoffMs: readonly number[];
    };
    readonly realtime: { readonly pollStepsMs: readonly number[] };
    readonly ui: {
        readonly productThumbnailSize: number;
        readonly dashboardSampleSize: number;
        readonly dashboardRefreshMs: number;
    };
    readonly storageKeys: {
        readonly users: string;
        readonly auctions: string;
        readonly bids: string;
        readonly products: string;
    };
};

export const appConfig: AppConfig = {
    api: {
        baseUrl:
            readEnv("VITE_VEILINGMEESTER_API_BASE_URL") ||
            readEnv("REACT_APP_VEILINGMEESTER_API_BASE_URL") ||
            readEnv("VEILINGMEESTER_API_BASE_URL") ||
            defaultBaseUrl,
        requestTimeoutMs: toNumber(readEnv("VITE_VEILINGMEESTER_REQUEST_TIMEOUT_MS"), 10000),
        prefetchPageSize: toNumber(readEnv("VITE_VEILINGMEESTER_PREFETCH_PAGE_SIZE"), 200),
    },
    pagination: {
        table: toNumberList(readEnv("VITE_VEILINGMEESTER_PER_PAGE_OPTIONS"), [10, 25, 50]),
        modal: toNumberList(readEnv("VITE_VEILINGMEESTER_MODAL_PER_PAGE_OPTIONS"), [10, 25, 50]),
    },
    polling: {
        intervalMs: toNumber(readEnv("VITE_VEILINGMEESTER_POLL_INTERVAL_MS"), 5000),
        backoffMs: toNumberList(readEnv("VITE_VEILINGMEESTER_POLL_BACKOFF_MS"), [1000, 2000, 4000]),
    },
    realtime: {
        pollStepsMs: toNumberList(readEnv("VITE_VEILINGMEESTER_REALTIME_STEPS_MS"), [2000, 4000, 8000, 15000]),
    },
    ui: {
        productThumbnailSize: toNumber(readEnv("VITE_VEILINGMEESTER_PRODUCT_THUMBNAIL"), 48),
        dashboardSampleSize: toNumber(readEnv("VITE_VEILINGMEESTER_DASHBOARD_SAMPLE"), 8),
        dashboardRefreshMs: toNumber(readEnv("VITE_VEILINGMEESTER_DASHBOARD_REFRESH_MS"), 60000),
    },
    storageKeys: {
        users: "vm_users_filters",
        auctions: "vm_veilingen_filters",
        bids: "vm_bids_filters",
        products: "vm_products_filters",
    },
} as const;
