import { appConfig } from "./config";
import type {
    VeilingCreateDto,
    BiedingCreateDto,
    BiedingUpdateDto,
    GebruikerDto,
    GebruikerUpdateDto,
    PaginatedList,
    VeilingDetailDto,
    VeilingDto,
    VeilingMeester_BiedingDto,
    VeilingProductDto,
    VeilingUpdateDto,
    VeilingproductUpdateDto,
} from "./types";

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
        controller.signal.addEventListener("abort", () => linked.removeEventListener("abort", abort), {
            once: true,
        });
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

function normaliseList<T>(result: ListResult<T>, page: number, pageSize: number): PaginatedList<T> {
    const items = Array.isArray(result.data) ? [...result.data] : [];
    const totalHeader = result.headers.get("X-Total-Count");
    const totalResults = totalHeader ? Number.parseInt(totalHeader, 10) : undefined;
    const hasNext =
        totalResults != null ? page * pageSize < totalResults : items.length > 0 && items.length === pageSize;
    return { items, page, pageSize, hasNext, totalResults };
}

async function fetchList<T>(
    path: string,
    params: { page?: number; pageSize?: number } & Record<string, unknown>,
    init?: FetchInit,
): Promise<PaginatedList<T>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 25;
    const query = buildQuery(params);
    const result = await request<readonly T[]>(`${path}${query}`, init);
    return normaliseList(result, page, pageSize);
}

export async function getUsers(
    params: { q?: string; page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<PaginatedList<GebruikerDto>> {
    return fetchList("/api/Gebruiker", params, { signal });
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
): Promise<PaginatedList<VeilingMeester_BiedingDto>> {
    return fetchList("/api/Bieding", params, { signal });
}

export async function getAuctions(
    params: { from?: string; to?: string; onlyActive?: boolean; status?: string; rol?: string; veilingProduct?: number | string; q?: string; page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<PaginatedList<VeilingDto>> {
    return fetchList("/api/Veiling", params, { signal });
}

export async function getAuctionDetail(id: number, signal?: AbortSignal): Promise<VeilingDetailDto> {
    const { data } = await request<VeilingDetailDto>(`/api/Veiling/${id}`, { signal });
    return data;
}

export async function getProducts(
    params: { q?: string; categorieNr?: number | string; page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<PaginatedList<VeilingProductDto>> {
    return fetchList("/api/Veilingproduct", params, { signal });
}

export async function getCategories(signal?: AbortSignal): Promise<readonly { id: number; name: string }[]> {
    const { data } = await request<readonly { categorieNr: number; categorieNaam: string }[]>(`/api/Categorie`, { signal });
    return data.map((entry) => ({ id: entry.categorieNr, name: entry.categorieNaam }));
}

export async function getProductsByGrower(
    growerId: number | string,
    params: { page?: number; pageSize?: number },
    signal?: AbortSignal,
): Promise<PaginatedList<VeilingProductDto>> {
    // TODO: zodra de API kwekernr ondersteunt in de query, deze filter laten uitvoeren op de backend.
    const list = await getProducts({ ...params, pageSize: params.pageSize ?? 50 }, signal);
    const items = list.items.filter((product) => String(product.kwekerNr ?? "") === String(growerId));
    return { ...list, items };
}

export async function updateUser(id: number, payload: GebruikerUpdateDto, signal?: AbortSignal): Promise<GebruikerDto> {
    const { data } = await request<GebruikerDto>(`/api/Gebruiker/${id}`, { method: "PUT", body: JSON.stringify(payload), signal });
    return data;
}

export async function deleteUserSoft(id: number, signal?: AbortSignal): Promise<void> {
    // TODO: zodra de backend soft-delete ondersteunt, vervangen door een archief endpoint.
    await request(`/api/Gebruiker/${id}`, { method: "DELETE", signal });
}

export async function updateAuction(id: number, payload: VeilingUpdateDto, signal?: AbortSignal): Promise<VeilingDto> {
    const { data } = await request<VeilingDto>(`/api/Veiling/${id}`, { method: "PUT", body: JSON.stringify(payload), signal });
    return data;
}

export async function createAuction(payload: VeilingCreateDto, signal?: AbortSignal): Promise<VeilingDto> {
    const { data } = await request<VeilingDto>(`/api/Veiling`, { method: "POST", body: JSON.stringify(payload), signal });
    return data;
}

export async function deleteAuctionSoft(id: number, signal?: AbortSignal): Promise<void> {
    // TODO: backend soft delete zodra status veld beschikbaar is.
    await request(`/api/Veiling/${id}`, { method: "DELETE", signal });
}

export async function updateProduct(
    id: number,
    payload: VeilingproductUpdateDto,
    signal?: AbortSignal,
): Promise<VeilingProductDto> {
    const { data } = await request<VeilingProductDto>(`/api/Veilingproduct/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return data;
}

export async function deleteProductSoft(id: number, signal?: AbortSignal): Promise<void> {
    // TODO: vervangen door soft delete zodra beschikbaar.
    await request(`/api/Veilingproduct/${id}`, { method: "DELETE", signal });
}

export async function createBid(payload: BiedingCreateDto, signal?: AbortSignal): Promise<VeilingMeester_BiedingDto> {
    const { data } = await request<VeilingMeester_BiedingDto>("/api/Bieding", {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
    });
    return data;
}

export async function updateBid(id: number, payload: BiedingUpdateDto, signal?: AbortSignal): Promise<VeilingMeester_BiedingDto> {
    const { data } = await request<VeilingMeester_BiedingDto>(`/api/Bieding/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return data;
}

export async function deleteBid(id: number, signal?: AbortSignal): Promise<void> {
    await request(`/api/Bieding/${id}`, { method: "DELETE", signal });
}
