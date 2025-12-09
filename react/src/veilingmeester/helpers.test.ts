import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Auction, Product } from "./api";
import { calculateClockPrice, deriveAuctionUiStatus, formatDateTime, mapProductStatusToUiStatus } from "./helpers.ts";

describe("formatDateTime", () => {
    it("returns placeholder for invalid dates", () => {
        assert.equal(formatDateTime(undefined), "—");
        assert.equal(formatDateTime("not-a-date"), "—");
    });

    it("formats valid timestamps", () => {
        const value = new Date("2024-05-10T12:34:00Z");
        assert.equal(formatDateTime(value), "10-05-2024 12:34");
    });
});

describe("calculateClockPrice", () => {
    const start = new Date("2024-01-01T10:00:00Z");
    const end = new Date("2024-01-01T11:00:00Z");

    it("clamps to start and end prices", () => {
        assert.equal(calculateClockPrice(100, 20, start, end, new Date("2023-12-31T23:00:00Z")), 100);
        assert.equal(calculateClockPrice(100, 20, start, end, new Date("2024-01-01T12:00:00Z")), 20);
    });

    it("interpolates price linearly", () => {
        const midway = new Date((start.getTime() + end.getTime()) / 2);
        assert.equal(calculateClockPrice(100, 20, start, end, midway), 60);
    });
});

describe("deriveAuctionUiStatus", () => {
    const baseAuction: Auction = {
        id: 1,
        title: "Test",
        status: "inactive",
        startDate: "2024-01-01T10:00:00Z",
        endDate: "2024-01-01T11:00:00Z",
    };

    const sampleProduct: Product = { id: 1, name: "Rose", status: "Active", minimumPrice: 1 };

    it("returns deleted when auction is marked deleted", () => {
        assert.equal(deriveAuctionUiStatus({ ...baseAuction, status: "deleted" }), "deleted");
    });

    it("returns inactive before start", () => {
        const now = new Date("2023-12-31T10:00:00Z");
        assert.equal(deriveAuctionUiStatus(baseAuction, now), "inactive");
    });

    it("returns sold when stock is depleted", () => {
        const now = new Date("2024-01-01T10:30:00Z");
        assert.equal(deriveAuctionUiStatus({ ...baseAuction, products: [{ ...sampleProduct, stock: 0 }] }, now), "sold");
    });

    it("returns active during auction window", () => {
        const now = new Date("2024-01-01T10:30:00Z");
        assert.equal(deriveAuctionUiStatus({ ...baseAuction, products: [{ ...sampleProduct, stock: 10 }] }, now), "active");
    });
});

describe("mapProductStatusToUiStatus", () => {
    it("normalises product statuses", () => {
        assert.equal(mapProductStatusToUiStatus("Active"), "active");
        assert.equal(mapProductStatusToUiStatus("Archived"), "sold");
        assert.equal(mapProductStatusToUiStatus("Deleted"), "deleted");
    });
});
