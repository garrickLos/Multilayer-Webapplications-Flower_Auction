import type {
    CategorieDetailDto,
    CategorieListDto,
    GebruikerAuctionViewDto,
    VeilingMeester_BiedingDto,
    VeilingMeester_VeilingDto,
    VeilingProductDto,
    VeilingproductVeilingmeesterDetailDto,
    VeilingproductVeilingmeesterListDto,
} from "../apiTypes";
import type { Auction, Bid, Category, Product, User } from "../types";
import { toRole, toUiStatus } from "../types";

export const mapApiBidToBid = (dto: VeilingMeester_BiedingDto): Bid => ({
    id: dto.biedingNr,
    auctionId: dto.veilingNr,
    productId: dto.veilingProductNr,
    userId: dto.gebruikerNr,
    amount: dto.bedragPerFust ?? 0,
    quantity: dto.aantalStuks ?? 0,
    status: "active",
});

export const mapApiProductToProduct = (
    dto: VeilingproductVeilingmeesterListDto | VeilingproductVeilingmeesterDetailDto | VeilingProductDto,
): Product => {
    const linkedAuctionId = "veilingNr" in dto ? dto.veilingNr ?? undefined : undefined;
    const stock = "voorraadBloemen" in dto ? dto.voorraadBloemen : undefined;
    const status = ("status" in dto && dto.status ? dto.status : "Inactive") as Product["status"];

    return {
        id: dto.veilingProductNr,
        name: dto.naam ?? "Onbekend product",
        status,
        category: "categorieNaam" in dto ? dto.categorieNaam : undefined,
        startPrice: "startprijs" in dto ? dto.startprijs ?? undefined : undefined,
        minimumPrice: "minimumprijs" in dto ? dto.minimumprijs ?? 0 : 0,
        stock,
        fust: "aantalFusten" in dto ? dto.aantalFusten : undefined,
        veilingNr: linkedAuctionId,
        linkedAuctionId,
        growerId: "kwekernr" in dto ? dto.kwekernr : undefined,
        sellerName: "verkoperNaam" in dto ? dto.verkoperNaam : undefined,
        imagePath: dto.imagePath ?? undefined,
        location: "plaats" in dto ? dto.plaats ?? undefined : undefined,
        active: status === "Active",
    } satisfies Product;
};

export const mapApiUserToUser = (dto: GebruikerAuctionViewDto): User => ({
    id: dto.gebruikerNr,
    name: dto.bedrijfsNaam || dto.email,
    email: dto.email,
    role: toRole(dto.soort),
    status: toUiStatus(dto.status),
    kvk: dto.kvk ?? undefined,
});

export const mapApiAuctionToAuction = (dto: VeilingMeester_VeilingDto): Auction => {
    const products = dto.producten?.map(mapApiProductToProduct);
    const bids = dto.biedingen?.map(mapApiBidToBid);

    const startPrices =
        products?.map((product) => (typeof product.startPrice === "number" ? product.startPrice : product.minimumPrice)) ??
        dto.producten?.map((product) => product.startprijs ?? product.minimumprijs);
    const numericPrices = (startPrices ?? []).filter((value): value is number => typeof value === "number");
    const minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : undefined;
    const maxPrice = numericPrices.length > 0 ? Math.max(...numericPrices) : undefined;

    return {
        id: dto.veilingNr ?? 0,
        title: dto.veilingNaam,
        startDate: dto.begintijd,
        endDate: dto.eindtijd,
        status: toUiStatus(dto.status),
        rawStatus: dto.status ?? undefined,
        minPrice,
        maxPrice,
        linkedProductIds: products?.map((product) => product.id),
        products,
        bids,
    } satisfies Auction;
};

export const mapApiCategoryToCategory = (dto: CategorieDetailDto | CategorieListDto): Category => ({
    id: dto.categorieNr,
    name: dto.naam ?? "",
});
