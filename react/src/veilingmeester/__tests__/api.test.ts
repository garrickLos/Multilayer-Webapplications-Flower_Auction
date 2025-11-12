import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getUsers } from "../api";

const originalFetch = global.fetch;

describe("api", () => {
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue(
            new Response(JSON.stringify([{ gebruikerNr: 1, naam: "Test" }]), {
                status: 200,
                headers: new Headers({
                    "Content-Type": "application/json",
                    "X-Total-Count": "1",
                    "X-Page": "1",
                    "X-Page-Size": "10",
                }),
            }),
        ) as typeof fetch;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        global.fetch = originalFetch;
    });

    it("fetches users with pagination metadata", async () => {
        const list = await getUsers({ page: 1, pageSize: 10 });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.objectContaining({
                url: expect.stringContaining("/api/Gebruiker?page=1&pageSize=10"),
            }),
        );
        expect(list.items).toHaveLength(1);
        expect(list.page).toBe(1);
        expect(list.hasNext).toBe(false);
    });
});
