import {
    type BiedingCreateDto,
    type BiedingUpdateDto,
    type CategorieDetailDto,
    type CategorieListDto,
    type GebruikerAuctionViewDto,
    type VeilingCreateDto,
    type VeilingMeester_BiedingDto,
    type VeilingMeester_VeilingDto,
    type VeilingUpdateDto,
    type VeilingProductDto,
    type VeilingproductVeilingmeesterDetailDto,
    type VeilingproductVeilingmeesterListDto,
} from "./apiTypes";
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

const getAuthHeaders = (): Record<string, string> => {
    const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
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
    return fetchList<GebruikerAuctionViewDto, User>("/api/Gebruiker/veilingmeester", params, DomainMapper.mapUser, { signal });
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
        veilingProduct: params.veilingProduct,
        from: params.from,
        to: params.to,
        onlyActive: params.onlyActive,
        page: params.page,
        pageSize: params.pageSize,
    };
    return fetchList<VeilingMeester_VeilingDto, Auction>("/api/Veiling/VeilingMeester", queryParams, DomainMapper.mapAuction, { signal });
}

export async function fetchAuctionDetail(id: number, signal?: AbortSignal): Promise<Auction> {
    const { data } = await request<VeilingMeester_VeilingDto>(`/api/Veiling/${id}`, { signal });
    return DomainMapper.mapAuction(data);
}

export async function fetchProducts(
    params: {
        q?: string;
        categorieNr?: number | string;
        status?: string;
        minPrice?: number;
        maxPrice?: number;
        createdAfter?: string;
        title?: string;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
): Promise<PaginatedList<Product>> {
    return fetchList<VeilingproductVeilingmeesterListDto, Product>("/api/Veilingproduct/veilingmeester", params, DomainMapper.mapProduct, { signal });
}

export async function fetchProductDetail(id: number, signal?: AbortSignal): Promise<Product> {
    const { data } = await request<VeilingproductVeilingmeesterDetailDto>(`/api/Veilingproduct/veilingmeester/${id}`, { signal });
    return DomainMapper.mapProduct(data);
}

export async function fetchCategories(
    params: { q?: string; page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
): Promise<PaginatedList<Category>> {
    return fetchList<CategorieListDto, Category>("/api/Categorie", params, DomainMapper.mapCategory, { signal });
}

export async function fetchCategoryDetail(id: number, signal?: AbortSignal): Promise<Category> {
    const { data } = await request<CategorieDetailDto>(`/api/Categorie/${id}`, { signal });
    return DomainMapper.mapCategory(data);
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
