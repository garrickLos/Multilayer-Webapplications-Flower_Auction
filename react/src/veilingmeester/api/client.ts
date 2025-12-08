import { appConfig } from "../config";
import type { ApiError } from "../types";

type FetchInit = RequestInit & { signal?: AbortSignal };
type JsonRequestInit = Omit<FetchInit, "body"> & { body?: unknown };

const { baseUrl, requestTimeoutMs } = appConfig.api;

const jsonHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
};

const getAuthHeaders = (): Record<string, string> => {
    const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

async function normaliseError(response: Response): Promise<ApiError> {
    if (response.status === 401)
        return { status: 401, message: "Niet geautoriseerd. Log opnieuw in om verder te gaan." } satisfies ApiError;
    if (response.status === 403)
        return { status: 403, message: "Je hebt geen toegang tot deze resource." } satisfies ApiError;

    let message = response.statusText || "Onbekende fout";
    try {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
            const body = (await response.clone().json()) as { detail?: string; title?: string; message?: string };
            message = body.detail || body.title || body.message || message;
        } else {
            const text = (await response.clone().text()).trim();
            if (text) message = text;
        }
    } catch {
        // ignore parse errors
    }
    return { status: response.status, message } satisfies ApiError;
}

async function request<T>(path: string, init?: FetchInit): Promise<{ data: T; headers: Headers }> {
    const controller = new AbortController();
    const linked = init?.signal;
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    if (linked) {
        const abort = () => controller.abort();
        if (linked.aborted) abort();
        linked.addEventListener("abort", abort, { once: true });
        controller.signal.addEventListener(
            "abort",
            () => linked.removeEventListener("abort", abort),
            { once: true },
        );
    }

    try {
        const response = await fetch(`${baseUrl}${path}`, {
            credentials: "include",
            ...init,
            headers: { ...jsonHeaders, ...getAuthHeaders(), ...(init?.headers ?? {}) },
            signal: controller.signal,
        });

        if (!response.ok) throw await normaliseError(response);
        if (response.status === 204) return { data: undefined as T, headers: response.headers };

        const data = (await response.json()) as T;
        return { data, headers: response.headers };
    } catch (error) {
        if ((error as { name?: string }).name === "AbortError") throw error;
        if ((error as ApiError).message) throw error;
        throw { status: 0, message: "Kan geen verbinding maken met de server." } satisfies ApiError;
    } finally {
        clearTimeout(timeout);
    }
}

export async function jsonRequest<T>(path: string, init?: JsonRequestInit): Promise<{ data: T; headers: Headers }> {
    const body = init?.body !== undefined ? JSON.stringify(init.body) : undefined;
    return request<T>(path, { ...init, body });
}

export { request };
