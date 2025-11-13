type EnvSource = Record<string, string | undefined>;

type RuntimeEnv = {
    readonly apiBaseUrl?: string;
    readonly requestTimeoutMs?: number;
    readonly pollIntervalMs?: number;
    readonly pollBackoffDelays?: readonly number[];
    readonly realtimePollSteps?: readonly number[];
    readonly perPageOptions?: readonly number[];
    readonly modalPerPageOptions?: readonly number[];
    readonly productThumbnailSize?: number;
    readonly dashboardSampleSize?: number;
    readonly dashboardRefreshMs?: number;
};

type AppConfig = {
    readonly api: {
        readonly baseUrl: string;
        readonly requestTimeoutMs: number;
    };
    readonly pagination: {
        readonly table: readonly number[];
        readonly modal: readonly number[];
    };
    readonly storageKeys: {
        readonly users: string;
        readonly auctions: string;
        readonly bids: string;
        readonly products: string;
    };
    readonly polling: {
        readonly defaultIntervalMs: number;
        readonly backoffDelaysMs: readonly number[];
    };
    readonly realtime: {
        readonly pollStepsMs: readonly number[];
    };
    readonly ui: {
        readonly productThumbnailSize: number;
        readonly dashboardSampleSize: number;
        readonly dashboardRefreshMs: number;
    };
};

function readEnvSource(): EnvSource {
    const sources: EnvSource[] = [];
    if (typeof import.meta !== "undefined" && typeof (import.meta as { env?: EnvSource }).env === "object") {
        sources.push(((import.meta as { env?: EnvSource }).env ?? {}) as EnvSource);
    }
    if (typeof process !== "undefined" && typeof process.env === "object") {
        sources.push(process.env as EnvSource);
    }
    return Object.assign({}, ...sources);
}

function toNumber(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function toNumberList(value: string | undefined): readonly number[] | undefined {
    if (!value) return undefined;
    const parts = value.split(",").map((part) => part.trim()).filter((part) => part.length > 0);
    const numbers = parts
        .map((part) => Number.parseInt(part, 10))
        .filter((num) => Number.isFinite(num) && num > 0);
    return numbers.length > 0 ? numbers : undefined;
}

const env = readEnvSource();

const runtimeEnv: RuntimeEnv = {
    apiBaseUrl:
        env.VITE_VEILINGMEESTER_API_BASE_URL ??
        env.REACT_APP_VEILINGMEESTER_API_BASE_URL ??
        env.VEILINGMEESTER_API_BASE_URL,
    requestTimeoutMs:
        toNumber(env.VITE_VEILINGMEESTER_REQUEST_TIMEOUT_MS ?? env.REACT_APP_VEILINGMEESTER_REQUEST_TIMEOUT_MS) ?? undefined,
    pollIntervalMs:
        toNumber(env.VITE_VEILINGMEESTER_POLL_INTERVAL_MS ?? env.REACT_APP_VEILINGMEESTER_POLL_INTERVAL_MS) ?? undefined,
    pollBackoffDelays:
        toNumberList(env.VITE_VEILINGMEESTER_POLL_BACKOFF_MS ?? env.REACT_APP_VEILINGMEESTER_POLL_BACKOFF_MS),
    realtimePollSteps:
        toNumberList(env.VITE_VEILINGMEESTER_REALTIME_STEPS_MS ?? env.REACT_APP_VEILINGMEESTER_REALTIME_STEPS_MS),
    perPageOptions:
        toNumberList(env.VITE_VEILINGMEESTER_PER_PAGE_OPTIONS ?? env.REACT_APP_VEILINGMEESTER_PER_PAGE_OPTIONS),
    modalPerPageOptions:
        toNumberList(env.VITE_VEILINGMEESTER_MODAL_PER_PAGE_OPTIONS ?? env.REACT_APP_VEILINGMEESTER_MODAL_PER_PAGE_OPTIONS),
    productThumbnailSize:
        toNumber(env.VITE_VEILINGMEESTER_PRODUCT_THUMBNAIL ?? env.REACT_APP_VEILINGMEESTER_PRODUCT_THUMBNAIL) ?? undefined,
    dashboardSampleSize:
        toNumber(env.VITE_VEILINGMEESTER_DASHBOARD_SAMPLE ?? env.REACT_APP_VEILINGMEESTER_DASHBOARD_SAMPLE) ?? undefined,
    dashboardRefreshMs:
        toNumber(env.VITE_VEILINGMEESTER_DASHBOARD_REFRESH_MS ?? env.REACT_APP_VEILINGMEESTER_DASHBOARD_REFRESH_MS) ?? undefined,
};

const defaultBaseUrl = typeof window !== "undefined" ? window.location.origin : "";

export const appConfig: AppConfig = {
    api: {
        baseUrl: runtimeEnv.apiBaseUrl && runtimeEnv.apiBaseUrl.trim().length > 0 ? runtimeEnv.apiBaseUrl : defaultBaseUrl,
        requestTimeoutMs: runtimeEnv.requestTimeoutMs ?? 10000,
    },
    pagination: {
        table: runtimeEnv.perPageOptions && runtimeEnv.perPageOptions.length > 0 ? runtimeEnv.perPageOptions : [10, 25, 50],
        modal:
            runtimeEnv.modalPerPageOptions && runtimeEnv.modalPerPageOptions.length > 0
                ? runtimeEnv.modalPerPageOptions
                : [10, 25, 50],
    },
    storageKeys: {
        users: "vm_users_filters",
        auctions: "vm_veilingen_filters",
        bids: "vm_bids_filters",
        products: "vm_products_filters",
    },
    polling: {
        defaultIntervalMs: runtimeEnv.pollIntervalMs ?? 5000,
        backoffDelaysMs:
            runtimeEnv.pollBackoffDelays && runtimeEnv.pollBackoffDelays.length > 0
                ? runtimeEnv.pollBackoffDelays
                : [1000, 2000, 4000],
    },
    realtime: {
        pollStepsMs:
            runtimeEnv.realtimePollSteps && runtimeEnv.realtimePollSteps.length > 0
                ? runtimeEnv.realtimePollSteps
                : [2000, 4000, 8000, 15000],
    },
    ui: {
        productThumbnailSize: runtimeEnv.productThumbnailSize ?? 48,
        dashboardSampleSize: runtimeEnv.dashboardSampleSize ?? 8,
        dashboardRefreshMs: runtimeEnv.dashboardRefreshMs ?? 60000,
    },
};
