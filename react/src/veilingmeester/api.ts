import type {
    BiedingCreateDto,
    BiedingUpdateDto,
    CategorieCreateDto,
    CategorieDetailDto,
    CategorieListDto,
    CategorieUpdateDto,
    GebruikerCreateDto,
    GebruikerUpdateDto,
    Klant_GebruikerDto,
    VeilingCreateDto,
    VeilingMeester_BiedingDto,
    VeilingMeester_VeilingDto,
    VeilingUpdateDto,
    VeilingproductCreateDto,
    VeilingproductDetailDto,
    VeilingproductListDto,
    VeilingproductUpdateDto,
} from "../api/dtos";
import { appConfig } from "./config";
import type { PaginatedResult } from "./types";

export type ApiError = { status: number; message: string };

const { baseUrl, requestTimeoutMs } = appConfig.api;
const jsonHeaders = { "Content-Type": "application/json", Accept: "application/json" };

type FetchInit = RequestInit & { signal?: AbortSignal };

type ListResponse<T> = { data: T[]; headers: Headers };

const buildQuery = (params: Record<string, unknown>): string => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        search.append(key, String(value));
    });
    const query = search.toString();
    return query ? `?${query}` : "";
};

async function normaliseError(response: Response): Promise<ApiError> {
    let message = response.statusText || "Onbekende fout";
    try {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
            const body = (await response.clone().json()) as { detail?: string; title?: string; message?: string };
            message = body.detail ?? body.title ?? body.message ?? message;
        } else {
            const text = (await response.clone().text()).trim();
            if (text) message = text;
        }
    } catch {
        // ignore parsing errors
    }
    return { status: response.status, message };
}

async function request<T>(path: string, init?: FetchInit): Promise<{ data: T; headers: Headers }> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    const signal = init?.signal;
    if (signal) {
        const abort = () => controller.abort();
        if (signal.aborted) abort();
        signal.addEventListener("abort", abort, { once: true });
        controller.signal.addEventListener("abort", () => signal.removeEventListener("abort", abort), { once: true });
    }

    try {
        const response = await fetch(`${baseUrl}${path}`, {
            ...init,
            signal: controller.signal,
            headers: { ...jsonHeaders, ...(init?.headers ?? {}) },
        });

        if (!response.ok) throw await normaliseError(response);
        if (response.status === 204) return { data: undefined as T, headers: response.headers };
        const data = (await response.json()) as T;
        return { data, headers: response.headers };
    } finally {
        clearTimeout(timeout);
    }
}

const normaliseList = <T,>(result: ListResponse<T>, page: number, pageSize: number): PaginatedResult<T> => {
    const totalHeader = result.headers.get("X-Total-Count");
    const totalCount = totalHeader ? Number.parseInt(totalHeader, 10) : undefined;
    const hasNext = totalCount != null ? page * pageSize < totalCount : result.data.length === pageSize;
    return { items: result.data, page, pageSize, totalCount, hasNext };
};

const fetchList = async <T,>(
    path: string,
    params: { page?: number; pageSize?: number } & Record<string, unknown>,
    init?: FetchInit,
): Promise<PaginatedResult<T>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const query = buildQuery(params);
    const result = await request<T[]>(`${path}${query}`, init);
    return normaliseList(result, page, pageSize);
};

// Biedingen
export const listBids = (
    params: { gebruikerNr?: number; veilingNr?: number; page?: number; pageSize?: number },
    signal?: AbortSignal,
) => fetchList<VeilingMeester_BiedingDto>("/api/Bieding", params, { signal });

export const getBid = (id: number, signal?: AbortSignal) => request<VeilingMeester_BiedingDto>(`/api/Bieding/${id}`, { signal }).then((r) => r.data);

export const createBid = (payload: BiedingCreateDto, signal?: AbortSignal) =>
    request<VeilingMeester_BiedingDto>("/api/Bieding", { method: "POST", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const updateBid = (id: number, payload: BiedingUpdateDto, signal?: AbortSignal) =>
    request<VeilingMeester_BiedingDto>(`/api/Bieding/${id}`, { method: "PUT", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const deleteBid = (id: number, signal?: AbortSignal) => request<void>(`/api/Bieding/${id}`, { method: "DELETE", signal }).then(() => undefined);

// Categorie
export const listCategories = (
    params: { q?: string; page?: number; pageSize?: number },
    signal?: AbortSignal,
) => fetchList<CategorieListDto>("/api/Categorie", params, { signal });

export const getCategory = (id: number, signal?: AbortSignal) => request<CategorieDetailDto>(`/api/Categorie/${id}`, { signal }).then((r) => r.data);

export const createCategory = (payload: CategorieCreateDto, signal?: AbortSignal) =>
    request<CategorieDetailDto>("/api/Categorie", { method: "POST", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const updateCategory = (id: number, payload: CategorieUpdateDto, signal?: AbortSignal) =>
    request<CategorieDetailDto>(`/api/Categorie/${id}`, { method: "PUT", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const deleteCategory = (id: number, signal?: AbortSignal) =>
    request<void>(`/api/Categorie/${id}`, { method: "DELETE", signal }).then(() => undefined);

// Gebruiker
export const listUsers = (
    params: { q?: string; page?: number; pageSize?: number },
    signal?: AbortSignal,
) => fetchList<Klant_GebruikerDto>("/api/Gebruiker", params, { signal });

export const getUser = (id: number, signal?: AbortSignal) => request<Klant_GebruikerDto>(`/api/Gebruiker/${id}`, { signal }).then((r) => r.data);

export const createUser = (payload: GebruikerCreateDto, signal?: AbortSignal) =>
    request<Klant_GebruikerDto>("/api/Gebruiker", { method: "POST", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const updateUser = (id: number, payload: GebruikerUpdateDto, signal?: AbortSignal) =>
    request<Klant_GebruikerDto>(`/api/Gebruiker/${id}`, { method: "PUT", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const deleteUser = (id: number, signal?: AbortSignal) => request<void>(`/api/Gebruiker/${id}`, { method: "DELETE", signal }).then(() => undefined);

// Veiling
export const listAuctions = (
    params: {
        rol?: string;
        veilingProduct?: number;
        from?: string;
        to?: string;
        onlyActive?: boolean;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
) => fetchList<VeilingMeester_VeilingDto>("/api/Veiling", params, { signal });

export const getAuction = (id: number, signal?: AbortSignal) => request<VeilingMeester_VeilingDto>(`/api/Veiling/${id}`, { signal }).then((r) => r.data);

export const createAuction = (payload: VeilingCreateDto, signal?: AbortSignal) =>
    request<VeilingMeester_VeilingDto>("/api/Veiling", { method: "POST", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const updateAuction = (id: number, payload: VeilingUpdateDto, signal?: AbortSignal) =>
    request<VeilingMeester_VeilingDto>(`/api/Veiling/${id}`, { method: "PUT", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const deleteAuction = (id: number, signal?: AbortSignal) =>
    request<void>(`/api/Veiling/${id}`, { method: "DELETE", signal }).then(() => undefined);

// Veilingproduct
export const listProducts = (
    params: { q?: string; categorieNr?: number; page?: number; pageSize?: number },
    signal?: AbortSignal,
) => fetchList<VeilingproductListDto>("/api/Veilingproduct", params, { signal });

export const getProduct = (id: number, signal?: AbortSignal) =>
    request<VeilingproductDetailDto>(`/api/Veilingproduct/${id}`, { signal }).then((r) => r.data);

export const createProduct = (payload: VeilingproductCreateDto, signal?: AbortSignal) =>
    request<VeilingproductDetailDto>("/api/Veilingproduct", { method: "POST", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const updateProduct = (id: number, payload: VeilingproductUpdateDto, signal?: AbortSignal) =>
    request<VeilingproductDetailDto>(`/api/Veilingproduct/${id}`, { method: "PUT", body: JSON.stringify(payload), signal }).then((r) => r.data);

export const deleteProduct = (id: number, signal?: AbortSignal) =>
    request<void>(`/api/Veilingproduct/${id}`, { method: "DELETE", signal }).then(() => undefined);
