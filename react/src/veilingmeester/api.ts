import {
    type BiedingCreateDto,
    type BiedingUpdateDto,
    type CategorieCreateDto,
    type CategorieDetailDto,
    type CategorieListDto,
    type CategorieUpdateDto,
    type GebruikerCreateDto,
    type GebruikerUpdateDto,
    type Klant_GebruikerDto,
    type VeilingCreateDto,
    type VeilingMeester_BiedingDto,
    type VeilingMeester_VeilingDto,
    type VeilingUpdateDto,
    type VeilingproductCreateDto,
    type VeilingproductDetailDto,
    type VeilingproductListDto,
    type VeilingproductUpdateDto,
} from "../api/dtos";
import { appConfig } from "./config";
import { DomainMapper, type Auction, type Bid, type Category, type PaginatedList, type Product, type User } from "./types";

export type ApiError = { status: number; message: string };

type FetchInit = RequestInit & { signal?: AbortSignal };
type ListResult<T> = { data: readonly T[]; headers: Headers };

const { baseUrl, requestTimeoutMs } = appConfig.api;

const jsonHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
};

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
            headers: { ...jsonHeaders, ...(init?.headers ?? {}) },
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

async function normaliseError(response: Response): Promise<ApiError> {
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
    return { status: response.status, message };
}

function buildQuery(params: Record<string, unknown>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        if (typeof value === "boolean") {
            if (value) search.append(key, "true");
            continue;
        }
        search.append(key, String(value));
    }
    const query = search.toString();
    return query ? `?${query}` : "";
}

function normaliseList<TDto, TModel>(
    result: ListResult<TDto>,
    page: number,
    pageSize: number,
    map: (dto: TDto) => TModel,
): PaginatedList<TModel> {
    const items = Array.isArray(result.data) ? result.data.map(map) : [];
    const totalHeader = result.headers.get("X-Total-Count");
    const totalResults = totalHeader ? Number.parseInt(totalHeader, 10) : undefined;
    const hasNext = totalResults != null ? page * pageSize < totalResults : items.length > 0 && items.length === pageSize;
    return { items, page, pageSize, hasNext, totalResults };
}

async function fetchList<TDto, TModel>(
    path: string,
    params: { page?: number; pageSize?: number } & Record<string, unknown>,
    map: (dto: TDto) => TModel,
    init?: FetchInit,
): Promise<PaginatedList<TModel>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const query = buildQuery(params);
    const result = await request<readonly TDto[]>(`${path}${query}`, init);
    return normaliseList(result, page, pageSize, map);
}

export async function fetchUsers(
    params: { q?: string; page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<PaginatedList<User>> {
    return fetchList("/api/Gebruiker", params, DomainMapper.mapUser, { signal });
}

export async function fetchBids(
    params: {
        gebruikerNr?: number | string;
        veilingNr?: number | string;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
): Promise<PaginatedList<Bid>> {
    return fetchList("/api/Bieding", params, DomainMapper.mapBid, { signal });
}

export async function fetchAuctions(
    params: {
        rol?: string;
        veilingProduct?: number | string;
        from?: string;
        to?: string;
        onlyActive?: boolean;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
): Promise<PaginatedList<Auction>> {
    const queryParams = {
        rol: params.rol,
        veilingProduct: params.veilingProduct,
        from: params.from,
        to: params.to,
        onlyActive: params.onlyActive,
        page: params.page,
        pageSize: params.pageSize,
    };
    return fetchList("/api/Veiling", queryParams, DomainMapper.mapAuction, { signal });
}

export async function fetchAuctionDetail(id: number, signal?: AbortSignal): Promise<Auction> {
    const { data } = await request<VeilingMeester_VeilingDto>(`/api/Veiling/${id}`, { signal });
    return DomainMapper.mapAuction(data);
}

export async function fetchProducts(
    params: { q?: string; categorieNr?: number | string; page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<PaginatedList<Product>> {
    return fetchList("/api/Veilingproduct", params, DomainMapper.mapProduct, { signal });
}

export async function fetchProductDetail(id: number, signal?: AbortSignal): Promise<Product> {
    const { data } = await request<VeilingproductDetailDto>(`/api/Veilingproduct/${id}`, { signal });
    return DomainMapper.mapProduct(data);
}

export async function fetchCategories(
    params: { q?: string; page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
): Promise<PaginatedList<Category>> {
    return fetchList("/api/Categorie", params, DomainMapper.mapCategory, { signal });
}

export async function fetchCategoryDetail(id: number, signal?: AbortSignal): Promise<Category> {
    const { data } = await request<CategorieDetailDto>(`/api/Categorie/${id}`, { signal });
    return DomainMapper.mapCategory(data);
}

export async function updateUser(id: number, payload: GebruikerUpdateDto, signal?: AbortSignal): Promise<User> {
    const { data } = await request<Klant_GebruikerDto>(`/api/Gebruiker/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return DomainMapper.mapUser(data);
}

export async function createUser(payload: GebruikerCreateDto, signal?: AbortSignal): Promise<User> {
    const { data } = await request<Klant_GebruikerDto>(`/api/Gebruiker`, { method: "POST", body: JSON.stringify(payload), signal });
    return DomainMapper.mapUser(data);
}

export async function deleteUser(id: number, signal?: AbortSignal): Promise<void> {
    await request(`/api/Gebruiker/${id}`, { method: "DELETE", signal });
}

export async function createAuction(payload: VeilingCreateDto, signal?: AbortSignal): Promise<Auction> {
    const { data } = await request<VeilingMeester_VeilingDto>(`/api/Veiling`, {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
    });
    return DomainMapper.mapAuction(data);
}

export async function updateAuction(id: number, payload: VeilingUpdateDto, signal?: AbortSignal): Promise<Auction> {
    const { data } = await request<VeilingMeester_VeilingDto>(`/api/Veiling/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return DomainMapper.mapAuction(data);
}

export async function deleteAuction(id: number, signal?: AbortSignal): Promise<void> {
    await request(`/api/Veiling/${id}`, { method: "DELETE", signal });
}

export async function createBid(payload: BiedingCreateDto, signal?: AbortSignal): Promise<Bid> {
    const { data } = await request<VeilingMeester_BiedingDto>(`/api/Bieding`, {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
    });
    return DomainMapper.mapBid(data);
}

export async function updateBid(id: number, payload: BiedingUpdateDto, signal?: AbortSignal): Promise<Bid> {
    const { data } = await request<VeilingMeester_BiedingDto>(`/api/Bieding/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return DomainMapper.mapBid(data);
}

export async function deleteBid(id: number, signal?: AbortSignal): Promise<void> {
    await request(`/api/Bieding/${id}`, { method: "DELETE", signal });
}

export async function createCategory(payload: CategorieCreateDto, signal?: AbortSignal): Promise<Category> {
    const { data } = await request<CategorieDetailDto>(`/api/Categorie`, { method: "POST", body: JSON.stringify(payload), signal });
    return DomainMapper.mapCategory(data);
}

export async function updateCategory(id: number, payload: CategorieUpdateDto, signal?: AbortSignal): Promise<Category> {
    const { data } = await request<CategorieDetailDto>(`/api/Categorie/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return DomainMapper.mapCategory(data);
}

export async function deleteCategory(id: number, signal?: AbortSignal): Promise<void> {
    await request(`/api/Categorie/${id}`, { method: "DELETE", signal });
}

export async function createProduct(payload: VeilingproductCreateDto, signal?: AbortSignal): Promise<Product> {
    const { data } = await request<VeilingproductDetailDto>(`/api/Veilingproduct`, {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
    });
    return DomainMapper.mapProduct(data);
}

export async function updateProduct(id: number, payload: VeilingproductUpdateDto, signal?: AbortSignal): Promise<Product> {
    const { data } = await request<VeilingproductDetailDto>(`/api/Veilingproduct/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return DomainMapper.mapProduct(data);
}

export async function deleteProduct(id: number, signal?: AbortSignal): Promise<void> {
    await request(`/api/Veilingproduct/${id}`, { method: "DELETE", signal });
}
