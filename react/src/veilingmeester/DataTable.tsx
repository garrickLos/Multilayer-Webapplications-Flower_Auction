import type { ReactElement, ReactNode } from "react";
import { useMemo, useState } from "react";
import { ResultBadge, cx } from "./components";
import { nlCollator } from "./types";

type DataTableColumn<T> = {
    key: keyof T | string;
    header: string;
    className?: string;
    width?: string | number;
    sortable?: boolean;
    render?: (row: T) => ReactNode;
    getValue?: (row: T) => string | number | Date | null | undefined;
};

type SortState = { key: string; direction: "asc" | "desc" } | null;

type DataTableProps<T> = {
    columns: readonly DataTableColumn<T>[];
    rows: readonly T[];
    totalResults?: number;
    caption?: string;
    empty?: ReactNode;
    getRowKey: (row: T, index: number) => string;
    onRowClick?: (row: T) => void;
};

type IndexedRow<T> = { row: T; index: number };

function toPrimitive(value: unknown): string | number {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    if (value == null) return "";
    return String(value);
}

function compareValues(a: unknown, b: unknown): number {
    const left = toPrimitive(a);
    const right = toPrimitive(b);
    if (typeof left === "number" && typeof right === "number") {
        return left - right;
    }
    return nlCollator.compare(String(left), String(right));
}

function getCellValue<T>(row: T, column: DataTableColumn<T>): string | number | Date | null | undefined {
    if (column.getValue) return column.getValue(row);
    const record = row as Record<string, unknown>;
    return record[column.key as string] as string | number | Date | null | undefined;
}

function sortRows<T>(rows: readonly T[], columns: readonly DataTableColumn<T>[], sortState: SortState): readonly T[] {
    if (!sortState) return rows;
    const column = columns.find((col) => (col.key as string) === sortState.key);
    if (!column) return rows;
    const factor = sortState.direction === "asc" ? 1 : -1;
    return rows
        .map<IndexedRow<T>>((row, index) => ({ row, index }))
        .sort((a, b) => {
            const aValue = getCellValue(a.row, column);
            const bValue = getCellValue(b.row, column);
            const compare = compareValues(aValue, bValue);
            if (compare !== 0) return compare * factor;
            return a.index - b.index;
        })
        .map((entry) => entry.row);
}

export function DataTable<T>({ columns, rows, totalResults, caption, empty, getRowKey, onRowClick }: DataTableProps<T>): ReactElement {
    const [sortState, setSortState] = useState<SortState>(null);

    const sortedRows = useMemo(() => sortRows(rows, columns, sortState), [rows, columns, sortState]);

    const handleSort = (column: DataTableColumn<T>) => {
        if (!column.sortable) return;
        const key = column.key as string;
        setSortState((prev) => {
            if (prev?.key === key) {
                const direction = prev.direction === "asc" ? "desc" : "asc";
                return { key, direction };
            }
            return { key, direction: "asc" };
        });
    };

    if (!rows.length && empty) {
        return <>{empty}</>;
    }

    const resultCount = rows.length;

    return (
        <div className="d-flex flex-column gap-2">
            <ResultBadge count={resultCount} total={totalResults} />
            <div className="table-responsive" role="region">
                <table className="table table-sm table-hover align-middle caption-top">
                    {caption && <caption className="text-muted small">{caption}</caption>}
                    <thead className="table-light">
                        <tr>
                            {columns.map((column) => {
                                const sortable = Boolean(column.sortable);
                                const active = sortState?.key === (column.key as string);
                                const direction = active ? sortState?.direction : null;
                                const icon = !sortable ? null : active ? (direction === "asc" ? "▲" : "▼") : "↕";
                                return (
                                    <th
                                        key={String(column.key)}
                                        scope="col"
                                        className={cx(
                                            "sticky-top bg-light",
                                            "text-uppercase small text-secondary",
                                            column.className,
                                            sortable && "user-select-none",
                                        )}
                                        style={{ position: "sticky", top: 0, zIndex: 1, width: column.width }}
                                        aria-sort={sortable ? (active ? (direction === "asc" ? "ascending" : "descending") : "none") : undefined}
                                    >
                                        {sortable ? (
                                            <button
                                                type="button"
                                                className="btn btn-link p-0 text-decoration-none text-secondary"
                                                onClick={() => handleSort(column)}
                                            >
                                                <span className="d-inline-flex align-items-center gap-1">
                                                    <span>{column.header}</span>
                                                    <span aria-hidden="true">{icon}</span>
                                                </span>
                                            </button>
                                        ) : (
                                            column.header
                                        )}
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
                                className={onRowClick ? "cursor-pointer" : undefined}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                            >
                                {columns.map((column) => (
                                    <td key={`${String(column.key)}-${index}`} className={column.className}>
                                        {column.render ? column.render(row) : getCellValue(row, column)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

