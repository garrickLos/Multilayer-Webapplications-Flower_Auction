import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "../DataTable";

type Row = { id: number; name: string; status: string };

function renderTable(rows: readonly Row[], onRowClick?: (row: Row) => void): void {
    render(
        <DataTable
            columns={[
                { key: "id", header: "#", sortable: true },
                { key: "name", header: "Naam", sortable: true },
                { key: "status", header: "Status", sortable: true },
            ]}
            rows={rows}
            getRowKey={(row) => String(row.id)}
            onRowClick={onRowClick}
            totalResults={rows.length}
        />,
    );
}

describe("DataTable", () => {
    it("sorts rows when clicking header", async () => {
        const user = userEvent.setup();
        const rows: Row[] = [
            { id: 1, name: "Bram", status: "inactive" },
            { id: 2, name: "Anna", status: "active" },
        ];

        renderTable(rows);

        const nameHeader = screen.getByRole("button", { name: /naam/i });
        await user.click(nameHeader);

        const cellsAfterFirstClick = screen.getAllByRole("cell", { name: /anna|bram/i });
        expect(cellsAfterFirstClick[0]).toHaveTextContent("Anna");

        await user.click(nameHeader);
        const cellsAfterSecondClick = screen.getAllByRole("cell", { name: /anna|bram/i });
        expect(cellsAfterSecondClick[0]).toHaveTextContent("Bram");
    });

    it("invokes row click on keyboard activation", async () => {
        const user = userEvent.setup();
        const rows: Row[] = [
            { id: 1, name: "Alpha", status: "active" },
        ];
        const calls: Row[] = [];

        renderTable(rows, (row) => {
            calls.push(row);
        });

        const row = screen.getByRole("row", { name: /alpha/i });
        row.focus();
        await user.keyboard("{Enter}");

        expect(calls).toEqual([rows[0]]);
    });
});
