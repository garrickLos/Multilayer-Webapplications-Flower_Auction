import type {
    BiedingDto,
    GebruikerDto,
    PaginatedList,
    VeilingDetailDto,
    VeilingDto,
    VeilingproductDto,
} from "./types";
import {appConfig} from "./config";

export type ApiError = { status: number; message: string };

type FetchInit = RequestInit & { signal?: AbortSignal };
type ListResult<T> = { data: readonly T[]; headers: Headers };

const BASE_URL = appConfig.api.baseUrl;
const REQUEST_TIMEOUT = appConfig.api.requestTimeoutMs;

async function fetchJsonWithMeta<T>(
    path: string,
    init?: FetchInit,
): Promise<{ data: T; headers: Headers }> {
    const controller = createAbortController(init?.signal);
    const timeoutId = startTimeout(controller);

    try {
        const request = new Request(`${BASE_URL}${path}`, {
            credentials: "include",
            ...init,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...(init?.headers ?? {}),
            },
            signal: controller.signal,
        });

        const response = await safeFetch(request);

        if (!response.ok) throw await normaliseError(response);

        if (response.status === 204) {
            return { data: undefined as T, headers: response.headers };
        }

        const data = (await response.json()) as T;
        return { data, headers: response.headers };
    } finally {
        clearTimeout(timeoutId);
    }
}

function createAbortController(linked?: AbortSignal): AbortController {
    const controller = new AbortController();
    if (!linked) return controller;

    if (linked.aborted) {
        controller.abort();
        return controller;
    }

    const onAbort = () => controller.abort();
    linked.addEventListener("abort", onAbort, { once: true });
    controller.signal.addEventListener(
        "abort",
        () => linked.removeEventListener("abort", onAbort),
        { once: true },
    );
    return controller;
}

function startTimeout(controller: AbortController): ReturnType<typeof setTimeout> {
    if (typeof window === "undefined") {
        return setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    }
    return window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
}

async function safeFetch(request: Request): Promise<Response> {
    try {
        return await fetch(request);
    } catch (error) {
        if ((error as { name?: string }).name === "AbortError") throw error;
        throw {status: 0, message: "Kan geen verbinding maken met de server."};
    }
}

async function normaliseError(response: Response): Promise<ApiError> {
    let message = response.statusText || "Onbekende fout";
    try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            const body = (await response.clone().json()) as {
                detail?: unknown;
                title?: unknown;
                message?: unknown;
            };
            const detail = typeof body.detail === "string" ? body.detail : undefined;
            const title = typeof body.title === "string" ? body.title : undefined;
            const generic = typeof body.message === "string" ? body.message : undefined;
            message = detail || title || generic || message;
        } else {
            const text = await response.clone().text();
            if (text.trim()) message = text.trim();
        }
    } catch {
        // negeer parsefouten
    }
    const clean = message.replaceAll(/https?:\/?\/?\S+/gu, "").trim();
    return { status: response.status, message: clean || `Er ging iets mis (${response.status}).` };
}

function buildQuery(params: Record<string, unknown>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value == null || value === "") continue;
        if (typeof value === "boolean") {
            if (value) search.append(key, "true");
            continue;
        }
        search.append(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : "";
}

function normaliseList<T>(
    result: ListResult<T>,
    page: number,
    pageSize: number,
): PaginatedList<T> {
    const items = Array.isArray(result.data) ? [...result.data] : [];
    const { headers } = result;

    const totalHeader = headers.get("X-Total-Count");
    const totalResults = totalHeader ? Number.parseInt(totalHeader, 10) : undefined;

    const pageHeader = headers.get("X-Page");
    const pageSizeHeader = headers.get("X-Page-Size");
    const resolvedPage = pageHeader ? Number.parseInt(pageHeader, 10) || page : page;
    const resolvedPageSize = pageSizeHeader ? Number.parseInt(pageSizeHeader, 10) || pageSize : pageSize;

    const hasNext =
        totalResults != null
            ? resolvedPage * resolvedPageSize < totalResults
            : items.length === resolvedPageSize;

    return { items, page: resolvedPage, pageSize: resolvedPageSize, hasNext, totalResults };
}

async function fetchList<T>(
    path: string,
    params: { page?: number; pageSize?: number } & Record<string, unknown>,
    init?: FetchInit,
): Promise<PaginatedList<T>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const query = buildQuery(params);
    const result = await fetchJsonWithMeta<readonly T[]>(`${path}${query}`, init);
    return normaliseList<T>(result, page, pageSize);
}

export async function getUsers(
    params: { q?: string; page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<PaginatedList<GebruikerDto>> {
    return fetchList<GebruikerDto>("/api/Gebruiker", params, { signal });
}

export async function getBids(
    params: {
        gebruikerNr?: number | string;
        veilingNr?: number | string;
        from?: string;
        to?: string;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
): Promise<PaginatedList<BiedingDto>> {
    return fetchList<BiedingDto>("/api/Bieding", params, { signal });
}

export async function getAuctions(
    params: {
        from?: string;
        to?: string;
        onlyActive?: boolean;
        status?: string;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
): Promise<PaginatedList<VeilingDto>> {
    return fetchList<VeilingDto>("/api/Veiling", params, { signal });
}

export async function getAuctionDetail(id: number, signal?: AbortSignal): Promise<VeilingDetailDto> {
    const { data } = await fetchJsonWithMeta<VeilingDetailDto>(`/api/Veiling/${id}`, { signal });
    return data;
}

export async function getProducts(
    params: { q?: string; categorieNr?: number | string; page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<PaginatedList<VeilingproductDto>> {
    return fetchList<VeilingproductDto>("/api/Veilingproduct", params, { signal });
}

export async function getProductsByGrower(
    growerId: number | string,
    params: { page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<PaginatedList<VeilingproductDto>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const collected: VeilingproductDto[] = [];
    let currentPage = page;
    let hasNext = true;

    while (collected.length < pageSize && hasNext) {
        const list = await getProducts({ ...params, page: currentPage }, signal);
        const matches = list.items.filter(
            (product) => String(product.kwekerNr ?? "") === String(growerId ?? ""),
        );
        collected.push(...matches);
        currentPage += 1;
        hasNext = list.hasNext;
        if (!list.hasNext || list.items.length === 0) break;
    }

    const sliced = collected.slice(0, pageSize);
    return {
        items: sliced,
        page,
        pageSize,
        hasNext: hasNext || collected.length > pageSize,
        totalResults: undefined,
    } satisfies PaginatedList<VeilingproductDto>;
}
