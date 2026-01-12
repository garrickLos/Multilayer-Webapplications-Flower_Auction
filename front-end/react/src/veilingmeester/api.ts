import { getBearerToken } from "../Componenten/index";

const API_BASE_URL = "/api";
const DEFAULT_PAGE_SIZE = 200;

export type ApiError = { status?: number; message: string };
export type UiStatus = "active" | "inactive" | "sold" | "deleted" | "finished";
export type UserRole = "Koper" | "Bedrijf" | "Veilingmeester" | "Admin" | "Onbekend";
export type AuctionStatus = "NogNietGestart" | "Actief" | "Afgesloten" | "Verkocht" | "Geannuleerd" | string;
export type ProductStatus = "Active" | "Inactive" | "Deleted" | "Archived";

export type PaginatedList<T> = {
    readonly items: readonly T[];
    readonly page: number;
    readonly pageSize: number;
    readonly hasNext: boolean;
    readonly totalResults?: number;
};

export type Category = { id: number; name: string };
export type User = { id: number; name: string; email: string; role: UserRole; status: UiStatus; kvk?: string };
export type Bid = {
    readonly id: number;
    readonly userId: number;
    readonly auctionId: number;
    readonly productId: number;
    readonly amount: number;
    readonly quantity: number;
    readonly status?: UiStatus;
    readonly date?: string;
};
export type Product = {
    readonly id: number;
    readonly name: string;
    readonly status: ProductStatus;
    readonly category?: string | null;
    readonly startPrice?: number | null;
    readonly minimumPrice: number;
    readonly stock?: number;
    readonly fust?: number;
    readonly veilingNr?: number;
    readonly growerId?: number;
    readonly sellerName?: string;
    readonly imagePath?: string;
    readonly linkedAuctionId?: number;
    readonly location?: string;
    readonly active?: boolean;
    readonly bids?: readonly BidSummary[];
    readonly placedDate?: string;
};
export type BidSummary = { id: number; amount: number; quantity: number; userId: number };
export type Auction = {
    readonly id: number;
    readonly title: string;
    readonly status: UiStatus;
    readonly rawStatus?: AuctionStatus | string;
    readonly startDate: string;
    readonly endDate: string;
    readonly minPrice?: number;
    readonly maxPrice?: number;
    readonly linkedProductIds?: readonly number[];
    readonly products?: readonly Product[];
    readonly bids?: readonly Bid[];
};

export type VeilingCreateDto = { veilingNaam: string; begintijd: string; eindtijd: string; status?: string | null };
export type VeilingUpdateDto = { veilingNaam: string; begintijd: string; eindtijd: string; status?: string | null };
export type BiedingBaseAmountDto = { bedragPerFust: number; aantalStuks: number; gebruikerNr: number };
export type BiedingCreateDto = BiedingBaseAmountDto & { biedingNr?: number; veilingNr?: number; veilingproductNr?: number };
export type BiedingUpdateDto = BiedingBaseAmountDto;

const jsonHeaders = { Accept: "application/json", "Content-Type": "application/json" };

function toUiStatus(value?: AuctionStatus | string | null): UiStatus {
    const normalised = typeof value === "string" ? value.toLowerCase() : "";
    if (normalised === "actief" || normalised === "active") return "active";
    if (normalised === "verkocht" || normalised === "uitverkocht" || normalised === "sold" || normalised === "archived") return "sold";
    if (normalised === "afgesloten" || normalised === "closed" || normalised === "finished") return "finished";
    if (normalised === "geannuleerd" || normalised === "cancelled" || normalised === "deleted") return "deleted";
    return "inactive";
}

function toRole(value?: string | null): UserRole {
    const normalised = typeof value === "string" ? value.toLowerCase() : "";
    if (normalised === "admin") return "Admin";
    if (normalised === "veilingmeester") return "Veilingmeester";
    if (normalised === "bedrijf" || normalised === "kweker" || normalised === "grower") return "Bedrijf";
    if (normalised === "koper" || normalised === "buyer") return "Koper";
    return "Onbekend";
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    const token = getBearerToken();
    const response = await fetch(url, {
        ...init,
        credentials: "omit",
        headers: {
            ...jsonHeaders,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init.headers ?? {}),
        },
    });

    if (!response.ok) {
        const text = (await response.text()).trim();
        const defaultMessage = response.status === 401 || response.status === 403 ? "Geen toegang" : response.statusText;
        throw { status: response.status, message: text || defaultMessage } satisfies ApiError;
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
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

function normaliseList<TDto, TModel>(data: readonly TDto[], page: number, pageSize: number, map: (dto: TDto) => TModel): PaginatedList<TModel> {
    const items = Array.isArray(data) ? data.map(map) : [];
    const hasNext = items.length === pageSize;
    return { items, page, pageSize, hasNext, totalResults: items.length };
}

async function fetchList<TDto, TModel>(
    path: string,
    params: { page?: number; pageSize?: number } & Record<string, unknown>,
    map: (dto: TDto) => TModel,
    signal?: AbortSignal,
): Promise<PaginatedList<TModel>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
    const query = buildQuery({ ...params, page, pageSize });
    const data = await fetchJson<readonly TDto[]>(`${path}${query}`, { signal });
    return normaliseList(data ?? [], page, pageSize, map);
}

const mapBid = (dto: { biedingNr: number; veilingNr: number; veilingProductNr: number; gebruikerNr: number; bedragPerFust?: number; aantalStuks?: number }): Bid => ({
    id: dto.biedingNr,
    auctionId: dto.veilingNr,
    productId: dto.veilingProductNr,
    userId: dto.gebruikerNr,
    amount: dto.bedragPerFust ?? 0,
    quantity: dto.aantalStuks ?? 0,
    status: "active",
});

type ProductDto = {
    veilingProductNr: number;
    naam?: string;
    status?: ProductStatus;
    veilingNr?: number | null;
    kwekernr?: number;
    aantalFusten?: number;
    voorraadBloemen?: number;
    plaats?: string;
    minimumprijs?: number | string;
    startprijs?: number | string | null;
    categorieNaam?: string | null;
    verkoperNaam?: string;
    imagePath?: string;
    beginDatum?: string | null;
    geplaatstDatum?: string | null;
};

const mapProduct = (dto: ProductDto): Product => {
    const parsedStart =
        dto.startprijs === null || dto.startprijs === undefined ? undefined : Number.isFinite(Number(dto.startprijs)) ? Number(dto.startprijs) : undefined;
    const parsedMinimum = Number.isFinite(Number(dto.minimumprijs)) ? Number(dto.minimumprijs) : 0;

    return {
        id: dto.veilingProductNr,
        name: dto.naam ?? "Onbekend product",
        status: dto.status ?? "Active",
        category: dto.categorieNaam ?? null,
        startPrice: parsedStart,
        minimumPrice: parsedMinimum,
        stock: dto.voorraadBloemen,
        fust: dto.aantalFusten,
        veilingNr: dto.veilingNr ?? undefined,
        linkedAuctionId: dto.veilingNr ?? undefined,
        growerId: dto.kwekernr,
        sellerName: dto.verkoperNaam,
        imagePath: dto.imagePath,
        location: dto.plaats,
        active: (dto.status ?? "Active") === "Active",
        placedDate: dto.geplaatstDatum ?? undefined,
    };
};

type BidDto = Parameters<typeof mapBid>[0];

const mapUser = (dto: { gebruikerNr: number; bedrijfsNaam?: string; email: string; soort?: string; kvk?: string | null; status?: string | null }): User => ({
    id: dto.gebruikerNr,
    name: dto.bedrijfsNaam || dto.email,
    email: dto.email,
    role: toRole(dto.soort),
    status: toUiStatus(dto.status ?? "active"),
    kvk: dto.kvk ?? undefined,
});

const mapAuction = (dto: {
    veilingNr: number;
    veilingNaam: string;
    status?: string | null;
    begintijd: string;
    eindtijd: string;
    producten?: readonly ProductDto[] | null;
    biedingen?: readonly BidDto[] | null;
}): Auction => {
    const products = dto.producten?.map(mapProduct);
    const bids = dto.biedingen?.map(mapBid);
    const startPrices = products?.map((product) => (typeof product.startPrice === "number" ? product.startPrice : product.minimumPrice));
    const numericPrices = (startPrices ?? []).filter((value): value is number => typeof value === "number");
    const minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : undefined;
    const maxPrice = numericPrices.length > 0 ? Math.max(...numericPrices) : undefined;

    return {
        id: dto.veilingNr,
        title: dto.veilingNaam,
        status: toUiStatus(dto.status),
        rawStatus: dto.status ?? undefined,
        startDate: dto.begintijd,
        endDate: dto.eindtijd,
        linkedProductIds: products?.map((product) => product.id),
        minPrice,
        maxPrice,
        products,
        bids,
    } satisfies Auction;
};

type AuctionDto = Parameters<typeof mapAuction>[0];

export async function fetchUsers(params: { role?: string; status?: string; pageSize?: number } = {}, signal?: AbortSignal): Promise<PaginatedList<User>> {
    const query = buildQuery({ role: params.role, status: params.status, pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE });
    const data = await fetchJson<readonly ReturnType<typeof mapUser>[]>(`/Gebruiker/veilingmeester${query}`, { signal });
    const items = (Array.isArray(data) ? data : []).map(mapUser);
    const pageSize = params.pageSize ?? (items.length || DEFAULT_PAGE_SIZE);
    return { items, page: 1, pageSize, hasNext: false, totalResults: items.length };
}

export async function fetchBids(
    params: { gebruikerNr?: number | string; veilingNr?: number | string; page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
): Promise<PaginatedList<Bid>> {
    return fetchList("/Bieding", params, mapBid, signal);
}

export async function fetchAuctions(
    params: { veilingProduct?: number | string; from?: string; to?: string; onlyActive?: boolean; page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
): Promise<PaginatedList<Auction>> {
    return fetchList("/Veiling/VeilingMeester", params, mapAuction, signal);
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
    } = {},
    signal?: AbortSignal,
): Promise<PaginatedList<Product>> {
    return fetchList("/Veilingproduct/veilingmeester", params, mapProduct, signal);
}

export async function fetchCategories(params: { q?: string; page?: number; pageSize?: number } = {}, signal?: AbortSignal): Promise<PaginatedList<Category>> {
    return fetchList("/Categorie", params, (dto: { categorieNr: number; naam?: string }) => ({ id: dto.categorieNr, name: dto.naam ?? "" }), signal);
}

export async function updateProductPlanning(
    id: number,
    payload: { startprijs?: number | null; veilingNr?: number | null },
    signal?: AbortSignal,
): Promise<Product> {
    const data = await fetchJson<ProductDto>(`/Veilingproduct/veilingmeester/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        signal,
    });
    return mapProduct(data);
}

export async function createAuction(payload: VeilingCreateDto, signal?: AbortSignal): Promise<Auction> {
    const data = await fetchJson<AuctionDto>("/Veiling", { method: "POST", body: JSON.stringify(payload), signal });
    return mapAuction(data);
}

export async function updateAuction(id: number, payload: VeilingUpdateDto, signal?: AbortSignal): Promise<Auction> {
    const data = await fetchJson<AuctionDto>(`/Veiling/${id}`, { method: "PUT", body: JSON.stringify(payload), signal });
    return mapAuction(data);
}

export async function deleteAuction(id: number, signal?: AbortSignal): Promise<void> {
    await fetchJson(`/Veiling/${id}`, { method: "DELETE", signal });
}

export const apiConfig = { baseUrl: API_BASE_URL, defaultPageSize: DEFAULT_PAGE_SIZE } as const;
