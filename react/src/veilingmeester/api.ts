import { buildQueryString } from "./types";
import type {
    AuctionDetailDto,
    AuctionDto,
    BidDto,
    CategoryDto,
    ListResult,
    ProductDto,
    UserDto,
} from "./types";

export type ApiError = { status: number; message: string };

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const { data } = await fetchJsonWithMeta<T>(path, init);
    return data;
}

async function fetchJsonWithMeta<T>(path: string, init?: RequestInit): Promise<{ data: T; headers: Headers }> {
    const request = new Request(`${BASE_URL}${path}`, {
        credentials: "include",
        ...init,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    const response = await fetch(request);

    if (!response.ok) {
        let message = response.statusText || "Onbekende fout";
        try {
            if (response.headers.get("content-type")?.includes("application/json")) {
                const payload = (await response.json()) as { title?: string; detail?: string; message?: string };
                message = payload.detail || payload.title || payload.message || message;
            } else {
                const text = await response.text();
                if (text.trim().length > 0) {
                    message = text.trim();
                }
            }
        } catch {
            // stilte; val terug op statusText
        }

        const safeMessage = message.replaceAll(/https?:\/\/[^\s]+/gu, "");
        throw { status: response.status, message: safeMessage.trim() || `Er ging iets mis (${response.status}).` } satisfies ApiError;
    }

    if (response.status === 204) {
        return { data: undefined as T, headers: response.headers };
    }

    const data = (await response.json()) as T;
    return { data, headers: response.headers };
}

function normaliseList<T>(
    items: readonly T[] | undefined,
    headers: Headers,
    fallbackPage: number,
    fallbackPageSize: number,
): ListResult<T> {
    const resultItems = Array.isArray(items) ? [...items] : [];
    const totalHeader = headers.get("X-Total-Count");
    const pageHeader = headers.get("X-Page");
    const pageSizeHeader = headers.get("X-Page-Size");

    const totalResults = totalHeader != null ? Number.parseInt(totalHeader, 10) : undefined;
    const page = pageHeader != null ? Number.parseInt(pageHeader, 10) || fallbackPage : fallbackPage;
    const pageSize = pageSizeHeader != null ? Number.parseInt(pageSizeHeader, 10) || fallbackPageSize : fallbackPageSize;

    const hasNext = totalResults != null ? page * pageSize < totalResults : resultItems.length === pageSize;

    return {
        items: resultItems,
        totalResults,
        page,
        pageSize,
        hasNext,
    };
}

export async function getUsers(
    params: { q?: string; page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<ListResult<UserDto>> {
    const search = buildQueryString({ q: params.q, page: params.page, pageSize: params.pageSize });
    const { data, headers } = await fetchJsonWithMeta<UserDto[]>(`/api/Gebruiker${search}`, { signal });
    return normaliseList(data, headers, params.page ?? 1, params.pageSize ?? 25);
}

export async function getBids(
    params: {
        gebruikerNr?: number | string;
        veilingNr?: number | string;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
): Promise<ListResult<BidDto>> {
    const search = buildQueryString({
        gebruikerNr: params.gebruikerNr,
        veilingNr: params.veilingNr,
        page: params.page,
        pageSize: params.pageSize,
    });
    const { data, headers } = await fetchJsonWithMeta<BidDto[]>(`/api/Bieding${search}`, { signal });
    return normaliseList(data, headers, params.page ?? 1, params.pageSize ?? 10);
}

export async function getAuctions(
    params: {
        from?: string;
        to?: string;
        onlyActive?: boolean;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
): Promise<ListResult<AuctionDto>> {
    const search = buildQueryString({
        from: params.from,
        to: params.to,
        onlyActive: params.onlyActive,
        page: params.page,
        pageSize: params.pageSize,
    });
    const { data, headers } = await fetchJsonWithMeta<AuctionDto[]>(`/api/Veiling${search}`, { signal });
    return normaliseList(data, headers, params.page ?? 1, params.pageSize ?? 25);
}

export async function getAuctionDetail(id: number): Promise<AuctionDetailDto> {
    const { data } = await fetchJsonWithMeta<AuctionDetailDto>(`/api/Veiling/${id}`);
    return data;
}

export async function getProducts(
    params: {
        q?: string;
        categorieNr?: number | string;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
): Promise<ListResult<ProductDto>> {
    const search = buildQueryString({
        q: params.q,
        categorieNr: params.categorieNr,
        page: params.page,
        pageSize: params.pageSize,
    });
    const { data, headers } = await fetchJsonWithMeta<ProductDto[]>(`/api/Veilingproduct${search}`, { signal });
    return normaliseList(data, headers, params.page ?? 1, params.pageSize ?? 25);
}

export async function getCategories(
    params: {
        q?: string;
        page?: number;
        pageSize?: number;
    },
    signal?: AbortSignal,
): Promise<ListResult<CategoryDto>> {
    const search = buildQueryString({ q: params.q, page: params.page, pageSize: params.pageSize });
    const { data, headers } = await fetchJsonWithMeta<CategoryDto[]>(`/api/Categorie${search}`, { signal });
    return normaliseList(data, headers, params.page ?? 1, params.pageSize ?? 50);
}
