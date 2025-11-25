import { appConfig } from "./config";
import type {
    CategorieListDto,
    GebruikerCreateDto,
    GebruikerUpdateDto,
    Klant_GebruikerDto,
    PagedResult,
    VeilingCreateDto,
    VeilingMeester_VeilingDto,
    VeilingUpdateDto,
    VeilingproductCreateDto,
    VeilingproductDetailDto,
    VeilingproductListDto,
    VeilingproductUpdateDto,
} from "./types";

const { baseUrl, requestTimeoutMs } = appConfig.api;

const defaultHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
};

function buildQuery(params: Record<string, unknown>): string {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        search.append(key, String(value));
    });
    const query = search.toString();
    return query ? `?${query}` : "";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<{ data: T; headers: Headers }> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
        const response = await fetch(`${baseUrl}${path}`, {
            ...init,
            credentials: "include",
            headers: { ...defaultHeaders, ...(init?.headers ?? {}) },
            signal: init?.signal ?? controller.signal,
        });

        if (!response.ok) {
            let message = response.statusText;
            try {
                const text = await response.clone().text();
                if (text) message = text;
            } catch {
                // ignore parse issues
            }
            throw new Error(message || "Onbekende fout");
        }

        if (response.status === 204) return { data: undefined as T, headers: response.headers };
        const data = (await response.json()) as T;
        return { data, headers: response.headers };
    } finally {
        clearTimeout(timeout);
    }
}

function parsePagedResult<T>(result: { data: T[]; headers: Headers }, page: number, pageSize: number): PagedResult<T> {
    const totalHeader = result.headers.get("X-Total-Count");
    const totalCount = totalHeader ? Number.parseInt(totalHeader, 10) : undefined;
    return { items: result.data, page, pageSize, totalCount };
}

// ---- Veiling ----
export async function listVeilingen(params: {
    rol?: string;
    veilingProduct?: number;
    from?: string;
    to?: string;
    onlyActive?: boolean;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
}): Promise<PagedResult<VeilingMeester_VeilingDto>> {
    const { page = 1, pageSize = 25, signal, ...rest } = params;
    const query = buildQuery({ ...rest, page, pageSize });
    const result = await apiFetch<VeilingMeester_VeilingDto[]>(`/api/Veiling${query}`, { signal });
    return parsePagedResult(result, page, pageSize);
}

export async function getVeiling(id: number, signal?: AbortSignal): Promise<VeilingMeester_VeilingDto> {
    const { data } = await apiFetch<VeilingMeester_VeilingDto>(`/api/Veiling/${id}`, { signal });
    return data;
}

export async function createVeiling(payload: VeilingCreateDto, signal?: AbortSignal): Promise<VeilingMeester_VeilingDto> {
    const { data } = await apiFetch<VeilingMeester_VeilingDto>(`/api/Veiling`, {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
    });
    return data;
}

export async function updateVeiling(id: number, payload: VeilingUpdateDto, signal?: AbortSignal): Promise<VeilingUpdateDto> {
    const { data } = await apiFetch<VeilingUpdateDto>(`/api/Veiling/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return data;
}

export async function deleteVeiling(id: number, signal?: AbortSignal): Promise<void> {
    await apiFetch(`/api/Veiling/${id}`, { method: "DELETE", signal });
}

// ---- Veilingproduct ----
export async function listVeilingproducten(params: {
    q?: string;
    categorieNr?: number;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
}): Promise<PagedResult<VeilingproductListDto>> {
    const { page = 1, pageSize = 25, signal, ...rest } = params;
    const query = buildQuery({ ...rest, page, pageSize });
    const result = await apiFetch<VeilingproductListDto[]>(`/api/Veilingproduct${query}`, { signal });
    return parsePagedResult(result, page, pageSize);
}

export async function getVeilingproduct(id: number, signal?: AbortSignal): Promise<VeilingproductDetailDto> {
    const { data } = await apiFetch<VeilingproductDetailDto>(`/api/Veilingproduct/${id}`, { signal });
    return data;
}

export async function createVeilingproduct(
    payload: VeilingproductCreateDto,
    signal?: AbortSignal,
): Promise<VeilingproductDetailDto> {
    const { data } = await apiFetch<VeilingproductDetailDto>(`/api/Veilingproduct`, {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
    });
    return data;
}

export async function updateVeilingproduct(
    id: number,
    payload: VeilingproductUpdateDto,
    signal?: AbortSignal,
): Promise<VeilingproductDetailDto> {
    const { data } = await apiFetch<VeilingproductDetailDto>(`/api/Veilingproduct/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return data;
}

export async function deleteVeilingproduct(id: number, signal?: AbortSignal): Promise<void> {
    await apiFetch(`/api/Veilingproduct/${id}`, { method: "DELETE", signal });
}

// ---- Gebruiker ----
export async function listGebruikers(params: {
    q?: string;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
}): Promise<PagedResult<Klant_GebruikerDto>> {
    const { page = 1, pageSize = 25, signal, ...rest } = params;
    const query = buildQuery({ ...rest, page, pageSize });
    const result = await apiFetch<Klant_GebruikerDto[]>(`/api/Gebruiker${query}`, { signal });
    return parsePagedResult(result, page, pageSize);
}

export async function getGebruiker(id: number, signal?: AbortSignal): Promise<Klant_GebruikerDto> {
    const { data } = await apiFetch<Klant_GebruikerDto>(`/api/Gebruiker/${id}`, { signal });
    return data;
}

export async function createGebruiker(payload: GebruikerCreateDto, signal?: AbortSignal): Promise<Klant_GebruikerDto> {
    const { data } = await apiFetch<Klant_GebruikerDto>(`/api/Gebruiker`, {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
    });
    return data;
}

export async function updateGebruiker(
    id: number,
    payload: GebruikerUpdateDto,
    signal?: AbortSignal,
): Promise<Klant_GebruikerDto> {
    const { data } = await apiFetch<Klant_GebruikerDto>(`/api/Gebruiker/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return data;
}

export async function deleteGebruiker(id: number, signal?: AbortSignal): Promise<void> {
    await apiFetch(`/api/Gebruiker/${id}`, { method: "DELETE", signal });
}

// ---- Categorie ----
export async function listCategorieen(signal?: AbortSignal): Promise<CategorieListDto[]> {
    const { data } = await apiFetch<CategorieListDto[]>(`/api/Categorie`, { signal });
    return data;
}
