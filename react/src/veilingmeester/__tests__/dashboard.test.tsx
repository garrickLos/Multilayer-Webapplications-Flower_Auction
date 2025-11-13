import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { getAuctions, getUsers } from "../api";
import type { PaginatedList, VeilingDto, GebruikerDto } from "../types";
import { useDashboardMetrics } from "../features/dashboard/useDashboardMetrics";

jest.mock("../api", () => ({
    getUsers: jest.fn(),
    getAuctions: jest.fn(),
}));

const mockedGetUsers = getUsers as jest.MockedFunction<typeof getUsers>;
const mockedGetAuctions = getAuctions as jest.MockedFunction<typeof getAuctions>;

function createList<T>(items: readonly T[], total?: number): PaginatedList<T> {
    return {
        items,
        page: 1,
        pageSize: Math.max(1, items.length),
        hasNext: false,
        totalResults: total ?? items.length,
    };
}

describe("useDashboardMetrics", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("aggregates totals into metric cards", async () => {
        const auction: VeilingDto = { veilingNr: 1, titel: "Voorbeeld", producten: [{}, {}] as VeilingDto["producten"] };
        mockedGetUsers.mockResolvedValue(createList<GebruikerDto>([{ gebruikerNr: 1 }], 42));
        mockedGetAuctions
            .mockResolvedValueOnce(createList([auction], 5))
            .mockResolvedValueOnce(createList([], 2))
            .mockResolvedValueOnce(createList([], 7));

        const { result } = renderHook(() => useDashboardMetrics());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.metrics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: "users", value: "42" }),
                expect.objectContaining({ id: "active", value: "5" }),
                expect.objectContaining({ id: "inactive", value: "2" }),
                expect.objectContaining({ id: "inventory" }),
            ]),
        );
    });

    it("refresh triggers a new fetch cycle", async () => {
        mockedGetUsers.mockResolvedValue(createList<GebruikerDto>([{ gebruikerNr: 1 }], 1));
        mockedGetAuctions
            .mockResolvedValueOnce(createList<VeilingDto>([], 0))
            .mockResolvedValueOnce(createList<VeilingDto>([], 0))
            .mockResolvedValueOnce(createList<VeilingDto>([], 0));
        mockedGetAuctions.mockResolvedValue(createList<VeilingDto>([], 0));

        const { result } = renderHook(() => useDashboardMetrics());
        await waitFor(() => expect(result.current.loading).toBe(false));

        result.current.refresh();

        await waitFor(() => expect(mockedGetUsers).toHaveBeenCalledTimes(2));
    });
});
