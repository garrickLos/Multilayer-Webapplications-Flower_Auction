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
    VeilingProductDto,
    VeilingUpdateDto,
    VeilingproductBidListItem,
    VeilingproductCreateDto,
    VeilingproductDetailDto,
    VeilingproductListDto,
    VeilingproductUpdateDto,
} from "../api/dtos";

export type {
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
    VeilingProductDto,
    VeilingUpdateDto,
    VeilingproductBidListItem,
    VeilingproductCreateDto,
    VeilingproductDetailDto,
    VeilingproductListDto,
    VeilingproductUpdateDto,
};

export interface PaginatedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount?: number;
    hasNext: boolean;
}

export type FetchStatus = "idle" | "loading" | "error" | "success";

export type ModalState =
    | { key: "bid"; bid?: VeilingMeester_BiedingDto }
    | { key: "category"; category?: CategorieDetailDto }
    | { key: "user"; user?: Klant_GebruikerDto }
    | { key: "auction"; auction?: VeilingMeester_VeilingDto }
    | { key: "product"; product?: VeilingproductDetailDto };
