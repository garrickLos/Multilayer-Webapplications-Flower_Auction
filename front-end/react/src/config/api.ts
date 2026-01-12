const normalizeBaseUrl = (value?: string) => (value ? value.replace(/\/+$/, "") : "");

const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const devFallbackUrl = "http://localhost:5105";

export const API_BASE_URL = envBaseUrl || (import.meta.env.DEV ? devFallbackUrl : "");

if (!API_BASE_URL && !import.meta.env.DEV) {
    console.error("VITE_API_BASE_URL is not set. API requests may fail in production.");
}

export const resolveApiUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    if (!API_BASE_URL) return path;
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
