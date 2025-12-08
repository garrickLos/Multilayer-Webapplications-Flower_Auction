import type {
    BiedingCreateDto,
    BiedingUpdateDto,
    CategorieCreateDto,
    CategorieDetailDto,
    CategorieListDto,
    CategorieUpdateDto,
    GebruikerAuctionViewDto,
    VeilingCreateDto,
    VeilingMeester_BiedingDto,
    VeilingMeester_VeilingDto,
    VeilingUpdateDto,
    VeilingproductVeilingmeesterDetailDto,
    VeilingproductVeilingmeesterListDto,
} from "./apiTypes";
import { appConfig } from "./config";
import {
    mapApiAuctionToAuction,
    mapApiBidToBid,
    mapApiCategoryToCategory,
    mapApiProductToProduct,
    mapApiUserToUser,
} from "./api/mappers";
import { jsonRequest, request } from "./api/client";
import type { Auction, Bid, Category, PaginatedList, Product, User } from "./types";

export type { ApiError } from "./types";

const { prefetchPageSize } = appConfig.api;

type ListResult<T> = { data: readonly T[]; headers: Headers };

type PaginatedParams = { page?: number; pageSize?: number } & Record<string, unknown>;

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
    return { items, page, pageSize, hasNext, totalResults } satisfies PaginatedList<TModel>;
}

async function fetchList<TDto, TModel>(
    path: string,
    params: PaginatedParams,
    map: (dto: TDto) => TModel,
    signal?: AbortSignal,
): Promise<PaginatedList<TModel>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? prefetchPageSize;
    const query = buildQuery({ ...params, page, pageSize });
    const result = await request<readonly TDto[]>(`${path}${query}`, { signal });
    return normaliseList(result, page, pageSize, map);
}

async function mutate<TDto, TModel>(
    path: string,
    map: (dto: TDto) => TModel,
    init: { method: "POST" | "PUT" | "DELETE"; body?: unknown; signal?: AbortSignal },
): Promise<TModel> {
    const { data } = await jsonRequest<TDto>(path, init);
    return map(data);
}

export async function fetchUsers(
    params: { role?: string; status?: string; pageSize?: number } = {},
    signal?: AbortSignal,
): Promise<PaginatedList<User>> {
    const query = buildQuery({ role: params.role, status: params.status });
    const { data } = await request<readonly GebruikerAuctionViewDto[]>(`/api/Gebruiker/veilingmeester${query}`, { signal });
    const items = (Array.isArray(data) ? data : []).map(mapApiUserToUser);
    const pageSize = params.pageSize ?? items.length || prefetchPageSize;
    return {
        items,
        page: 1,
        pageSize,
        hasNext: false,
        totalResults: items.length,
    } satisfies PaginatedList<User>;
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
    return fetchList<VeilingMeester_BiedingDto, Bid>("/api/Bieding", params, mapApiBidToBid, signal);
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
    return fetchList<VeilingMeester_VeilingDto, Auction>(
        "/api/Veiling/VeilingMeester",
        queryParams,
        mapApiAuctionToAuction,
        signal,
    );
}

export async function fetchAuctionDetail(id: number, signal?: AbortSignal): Promise<Auction> {
    const { data } = await request<VeilingMeester_VeilingDto>(`/api/Veiling/${id}`, { signal });
    return mapApiAuctionToAuction(data);
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
    return fetchList<VeilingproductVeilingmeesterListDto, Product>(
        "/api/Veilingproduct/veilingmeester",
        params,
        mapApiProductToProduct,
        signal,
    );
}

export async function fetchProductDetail(id: number, signal?: AbortSignal): Promise<Product> {
    const { data } = await request<VeilingproductVeilingmeesterDetailDto>(`/api/Veilingproduct/veilingmeester/${id}`, { signal });
    return mapApiProductToProduct(data);
}

export async function fetchCategories(
    params: { q?: string; page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
): Promise<PaginatedList<Category>> {
    return fetchList<CategorieListDto, Category>("/api/Categorie", params, mapApiCategoryToCategory, signal);
}

export async function fetchCategoryDetail(id: number, signal?: AbortSignal): Promise<Category> {
    const { data } = await request<CategorieDetailDto>(`/api/Categorie/${id}`, { signal });
    return mapApiCategoryToCategory(data);
}

export async function createAuction(payload: VeilingCreateDto, signal?: AbortSignal): Promise<Auction> {
    return mutate(`/api/Veiling`, mapApiAuctionToAuction, { method: "POST", body: payload, signal });
}

export async function updateAuction(id: number, payload: VeilingUpdateDto, signal?: AbortSignal): Promise<Auction> {
    return mutate(`/api/Veiling/${id}`, mapApiAuctionToAuction, { method: "PUT", body: payload, signal });
}

export async function deleteAuction(id: number, signal?: AbortSignal): Promise<void> {
    await request(`/api/Veiling/${id}`, { method: "DELETE", signal });
}

export async function createBid(payload: BiedingCreateDto, signal?: AbortSignal): Promise<Bid> {
    return mutate(`/api/Bieding`, mapApiBidToBid, { method: "POST", body: payload, signal });
}

export async function updateBid(id: number, payload: BiedingUpdateDto, signal?: AbortSignal): Promise<Bid> {
    return mutate(`/api/Bieding/${id}`, mapApiBidToBid, { method: "PUT", body: payload, signal });
}

export async function deleteBid(id: number, signal?: AbortSignal): Promise<void> {
    await request(`/api/Bieding/${id}`, { method: "DELETE", signal });
}

export async function createCategory(payload: CategorieCreateDto, signal?: AbortSignal): Promise<Category> {
    return mutate(`/api/Categorie`, mapApiCategoryToCategory, { method: "POST", body: payload, signal });
}

export async function updateCategory(id: number, payload: CategorieUpdateDto, signal?: AbortSignal): Promise<Category> {
    return mutate(`/api/Categorie/${id}`, mapApiCategoryToCategory, { method: "PUT", body: payload, signal });
}

export async function deleteCategory(id: number, signal?: AbortSignal): Promise<void> {
    await request(`/api/Categorie/${id}`, { method: "DELETE", signal });
}
