const normalizeBaseUrl = (value?: string) => {
    if (!value) return "";
    const trimmed = value.replace(/\/+$/, "");
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) {
        return `http://${trimmed}`;
    }
    return `https://${trimmed}`;
};

const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
const envImageBaseUrl = normalizeBaseUrl(import.meta.env.VITE_IMAGE_URL);
const devFallbackUrl = "http://localhost:5105";
const isProd = import.meta.env.PROD;

export const API_BASE_URL = envBaseUrl || (import.meta.env.DEV ? devFallbackUrl : "");
export const IMAGE_BASE_URL = envImageBaseUrl;

if (isProd) {
    if (!envBaseUrl) {
        console.warn("VITE_API_URL is not set. API requests may fail in production.");
    } else if (/localhost|127\.0\.0\.1/i.test(envBaseUrl)) {
        console.warn(`VITE_API_URL points to localhost (${envBaseUrl}). Production requests may fail.`);
    }
}

export const resolveApiUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    if (!API_BASE_URL) return path;
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const resolveImageUrl = (path?: string | null) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
    if (!IMAGE_BASE_URL) return path;
    return `${IMAGE_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
