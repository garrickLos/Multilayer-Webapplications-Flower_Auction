import type { KeyboardEvent, ReactNode } from "react";
import { memo, useMemo, useState } from "react";
import { ResultBadge } from "./components";
import { cx } from "./utils/classNames";
import { nlCollator } from "./types";

type SortDirection = "asc" | "desc";

type SortState = { readonly key: string; readonly direction: SortDirection } | null;

type Primitive = string | number;

type ColumnValue = Primitive | Date | null | undefined;

type DataTableColumn<T> = {
    readonly key: keyof T | string;
    readonly header: string;
    readonly headerClassName?: string;
    readonly cellClassName?: string;
    readonly sortable?: boolean;
    readonly render?: (row: T) => ReactNode;
    readonly getValue?: (row: T) => ColumnValue;
};

type DataTableProps<T> = {
    readonly columns: readonly DataTableColumn<T>[];
    readonly rows: readonly T[];
    readonly totalResults?: number;
    readonly caption?: string;
    readonly empty?: ReactNode;
    readonly getRowKey: (row: T, index: number) => string;
    readonly onRowClick?: (row: T) => void;
    readonly isRowInteractive?: (row: T) => boolean;
};

type IndexedRow<T> = { readonly row: T; readonly index: number };

function toPrimitive(value: ColumnValue): Primitive {
    if (value instanceof Date) {
        return value.getTime();
    }
    if (typeof value === "number") {
        return value;
    }
    if (value == null) {
        return "";
    }
    return String(value);
}

function compareValues(a: ColumnValue, b: ColumnValue): number {
    const left = toPrimitive(a);
    const right = toPrimitive(b);
    if (typeof left === "number" && typeof right === "number") {
        return left - right;
    }
    return nlCollator.compare(String(left), String(right));
}

function getCellValue<T>(row: T, column: DataTableColumn<T>): ColumnValue {
    if (column.getValue) {
        return column.getValue(row);
    }
    const record = row as Record<string, ColumnValue>;
    return record[column.key as string];
}

function sortRows<T>(rows: readonly T[], columns: readonly DataTableColumn<T>[], sortState: SortState): readonly T[] {
    if (!sortState) {
        return rows;
    }
    const column = columns.find((col) => (col.key as string) === sortState.key);
    if (!column) {
        return rows;
    }
    const factor = sortState.direction === "asc" ? 1 : -1;
    return rows
        .map<IndexedRow<T>>((row, index) => ({ row, index }))
        .sort((a, b) => {
            const aValue = getCellValue(a.row, column);
            const bValue = getCellValue(b.row, column);
            const comparison = compareValues(aValue, bValue);
            if (comparison !== 0) {
                return comparison * factor;
            }
            return a.index - b.index;
        })
        .map((entry) => entry.row);
}

/**
 * Responsive, sortable table built with Bootstrap utilities.
 *
 * @param props - Configuration and data rows to render.
 */
function DataTableComponent<T>({
    columns,
    rows,
    totalResults,
    caption,
    empty,
    getRowKey,
    onRowClick,
    isRowInteractive,
}: DataTableProps<T>): JSX.Element {
    const [sortState, setSortState] = useState<SortState>(null);

    const sortedRows = useMemo(() => sortRows(rows, columns, sortState), [rows, columns, sortState]);

    const handleSort = (column: DataTableColumn<T>) => {
        if (!column.sortable) {
            return;
        }
        const key = column.key as string;
        setSortState((previous) => {
            if (previous?.key === key) {
                return { key, direction: previous.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const handleRowKey = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
        if (!onRowClick) {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onRowClick(row);
        }
    };

    if (!rows.length && empty) {
        return <>{empty}</>;
    }

    const resultCount = rows.length;

    return (
        <div className="d-flex flex-column gap-2">
            <ResultBadge count={resultCount} total={totalResults} />
            <div className="card shadow-sm border border-success-subtle rounded-4 overflow-hidden">
                <div className="table-responsive" role="region">
                    <table className="table table-sm table-hover align-middle caption-top mb-0">
                        {caption && <caption className="text-muted small">{caption}</caption>}
                        <thead className="bg-success-subtle position-sticky top-0 z-2">
                            <tr>
                                {columns.map((column) => {
                                    const sortable = Boolean(column.sortable);
                                    const active = sortState?.key === (column.key as string);
                                    const direction = active ? sortState?.direction : null;
                                    const icon = !sortable ? null : active ? (direction === "asc" ? "▲" : "▼") : "↕";
                                    const ariaSort = sortable
                                        ? active
                                            ? direction === "asc"
                                                ? "ascending"
                                                : "descending"
                                            : "none"
                                        : undefined;
                                    return (
                                        <th
                                            key={String(column.key)}
                                            scope="col"
                                            className={cx(
                                                "text-uppercase small text-success-emphasis",
                                                sortable && "user-select-none",
                                                column.headerClassName,
                                            )}
                                            aria-sort={ariaSort}
                                        >
                                            {sortable ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-decoration-none text-success fw-semibold"
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
                            {sortedRows.map((row, index) => {
                                const interactive = Boolean(onRowClick && (isRowInteractive ? isRowInteractive(row) : true));
                                const handleClick = interactive && onRowClick ? () => onRowClick(row) : undefined;
                                const handleKeyDown = interactive && onRowClick ? (event: KeyboardEvent<HTMLTableRowElement>) => handleRowKey(event, row) : undefined;
                                return (
                                    <tr
                                        key={getRowKey(row, index)}
                                        className={cx(interactive && "cursor-pointer")}
                                        onClick={handleClick}
                                        onKeyDown={handleKeyDown}
                                        tabIndex={interactive ? 0 : undefined}
                                    >
                                        {columns.map((column) => (
                                            <td key={`${String(column.key)}-${index}`} className={column.cellClassName}>
                                                {column.render ? column.render(row) : getCellValue(row, column)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;
