import type { ReactElement, ReactNode } from "react";
import { useMemo, useState } from "react";
import { collator } from "./types";
import { cx } from "./components";

export type Column<T> = {
    key: keyof T | string;
    header: string;
    className?: string;
    width?: number | string;
    sortable?: boolean;
    render?: (row: T) => ReactNode;
    getValue?: (row: T) => string | number | Date | null | undefined;
};

type SortState = {
    key: string;
    direction: "asc" | "desc";
};

type DataTableProps<T> = {
    columns: ReadonlyArray<Column<T>>;
    rows: readonly T[];
    caption?: string;
    empty?: ReactNode;
    getRowKey: (row: T, index: number) => string;
    onRowClick?: (row: T) => void;
};

function getCellValue<T>(row: T, column: Column<T>): string {
    if (column.getValue) {
        const value = column.getValue(row);
        if (value == null) return "";
        if (value instanceof Date) return value.toISOString();
        return String(value);
    }
    const value = (row as Record<string, unknown>)[column.key as string];
    return value == null ? "" : String(value);
}

function sortRows<T>(rows: readonly T[], columns: ReadonlyArray<Column<T>>, sortState: SortState | null): T[] {
    if (!sortState) return [...rows];
    const column = columns.find((col) => (col.key as string) === sortState.key);
    if (!column) return [...rows];
    const factor = sortState.direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
        const aVal = getCellValue(a, column);
        const bVal = getCellValue(b, column);
        return collator.compare(aVal, bVal) * factor;
    });
}

export function DataTable<T>({ columns, rows, caption, empty, getRowKey, onRowClick }: DataTableProps<T>): ReactElement {
    const [sortState, setSortState] = useState<SortState | null>(null);

    const sortedRows = useMemo(() => sortRows(rows, columns, sortState), [columns, rows, sortState]);

    const handleSort = (column: Column<T>) => {
        if (!column.sortable) return;
        const key = column.key as string;
        setSortState((prev) => {
            if (prev?.key === key) {
                const nextDirection = prev.direction === "asc" ? "desc" : "asc";
                return { key, direction: nextDirection };
            }
            return { key, direction: "asc" };
        });
    };

    if (!sortedRows.length && empty) {
        return <>{empty}</>;
    }

    return (
        <div className="table-responsive" role="region" aria-live="polite">
            <table className="table table-hover align-middle caption-top">
                {caption && <caption className="text-muted small">{caption}</caption>}
                <thead className="table-light position-sticky top-0" style={{ zIndex: 1 }}>
                    <tr>
                        {columns.map((column) => {
                            const sortable = Boolean(column.sortable);
                            const active = sortState?.key === (column.key as string);
                            return (
                                <th
                                    key={column.key as string}
                                    scope="col"
                                    className={cx("text-uppercase small text-secondary", column.className, sortable && "sortable")}
                                    style={column.width ? { width: column.width } : undefined}
                                    aria-sort={sortable ? (active ? (sortState?.direction === "asc" ? "ascending" : "descending") : "none") : undefined}
                                >
                                    <button
                                        type="button"
                                        className="btn btn-link text-decoration-none text-secondary p-0"
                                        onClick={() => handleSort(column)}
                                        disabled={!sortable}
                                    >
                                        {column.header}
                                        {sortable && (
                                            <span className="ms-1" aria-hidden="true">
                                                {active ? (sortState?.direction === "asc" ? "▲" : "▼") : "⇅"}
                                            </span>
                                        )}
                                    </button>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sortedRows.map((row, index) => (
                        <tr
                            key={getRowKey(row, index)}
                            role={onRowClick ? "button" : undefined}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            className={onRowClick ? "table-row-hover" : undefined}
                        >
                            {columns.map((column) => (
                                <td key={`${column.key as string}-${index}`} className={column.className}>
                                    {column.render ? column.render(row) : getCellValue(row, column)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
