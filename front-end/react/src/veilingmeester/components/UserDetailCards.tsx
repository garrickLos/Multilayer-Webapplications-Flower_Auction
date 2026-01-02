import type { JSX } from "react";
import type { Auction, Bid, Product } from "../api";
import { formatCurrency, formatDateTime } from "../helpers";
import { mapProductStatusToUiStatus } from "../rules";
import { StatusBadge } from "./ui";

const fallbackImage = "/src/assets/pictures/webp/MissingPicture.webp";

const cardClass = "d-flex flex-column flex-md-row gap-3 align-items-start p-3 bg-body-secondary rounded-4";

export function UserBidCard({
    bid,
    product,
    auction,
}: {
    readonly bid: Bid;
    readonly product?: Product;
    readonly auction?: Auction;
}): JSX.Element {
    const status = bid.status ?? "active";
    return (
        <div className={cardClass}>
            <img
                src={product?.imagePath ?? fallbackImage}
                alt={product?.name ?? `Product ${bid.productId}`}
                className="rounded-3 flex-shrink-0"
                style={{ width: 120, height: 90, objectFit: "cover" }}
            />
            <div className="flex-grow-1">
                <div className="d-flex justify-content-between gap-2 flex-wrap">
                    <div>
                        <p className="mb-1 fw-semibold">{product?.name ?? `Product #${bid.productId}`}</p>
                        <p className="mb-1 text-muted">
                            Veiling {auction ? auction.title : `#${bid.auctionId}`} · Bod #{bid.id}
                        </p>
                    </div>
                    <StatusBadge status={status} />
                </div>
                <div className="d-flex flex-wrap gap-3 text-muted">
                    <span>
                        {bid.quantity} × {formatCurrency(bid.amount)}
                    </span>
                    <span>{formatDateTime(bid.date)}</span>
                </div>
            </div>
        </div>
    );
}

export function UserProductCard({ product }: { readonly product: Product }): JSX.Element {
    return (
        <div className={cardClass}>
            <img
                src={product.imagePath ?? fallbackImage}
                alt={product.name}
                className="rounded-3 flex-shrink-0"
                style={{ width: 120, height: 90, objectFit: "cover" }}
            />
            <div className="flex-grow-1">
                <div className="d-flex justify-content-between gap-2 flex-wrap">
                    <div>
                        <p className="mb-1 fw-semibold">{product.name}</p>
                        <p className="mb-1 text-muted">
                            {product.category ?? "Onbekende categorie"} · {product.location ?? "Onbekende locatie"}
                        </p>
                    </div>
                    <StatusBadge status={mapProductStatusToUiStatus(product.status)} />
                </div>
                <p className="mb-0 text-muted">Min. prijs {formatCurrency(product.minimumPrice)}</p>
            </div>
        </div>
    );
}
