import { useMemo, useState, type JSX, type ReactNode } from "react";

const paginate = <T,>(rows: readonly T[], page: number, pageSize: number): readonly T[] => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
};

const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(" ");

// Shared table with optional selection, filters and pagination.
export type TableColumn<T> = {
    readonly key: string;
    readonly header: string;
    readonly sortable?: boolean;
    readonly render?: (row: T) => ReactNode;
    readonly getValue?: (row: T) => string | number;
    readonly align?: "start" | "center" | "end";
};

export type TableProps<T> = {
    readonly columns: readonly TableColumn<T>[];
    readonly rows: readonly T[];
    readonly getRowId: (row: T) => string | number;
    readonly search?: { value: string; onChange: (value: string) => void; placeholder?: string };
    readonly filters?: ReactNode;
    readonly page: number;
    readonly pageSize: number;
    readonly pageSizeOptions: readonly number[];
    readonly onPageChange: (page: number) => void;
    readonly onPageSizeChange: (size: number) => void;
    readonly onRowClick?: (row: T) => void;
    readonly selectable?: {
        selectedIds: readonly (string | number)[];
        onToggleRow: (id: string | number) => void;
        onTogglePage: (ids: readonly (string | number)[], checked: boolean) => void;
    };
    readonly emptyMessage?: ReactNode;
    readonly emptyState?: ReactNode;
};

const SortIcon = ({ direction }: { readonly direction: "asc" | "desc" | null }): JSX.Element => (
    <span aria-hidden="true" className="ms-1">
        {direction === "asc" && "▲"}
        {direction === "desc" && "▼"}
        {direction === null && "↕"}
    </span>
);

export function Table<T>({
    columns,
    rows,
    getRowId,
    search,
    filters,
    page,
    pageSize,
    pageSizeOptions,
    onPageChange,
    onPageSizeChange,
    onRowClick,
    selectable,
    emptyMessage = "Geen resultaten",
    emptyState,
}: TableProps<T>): JSX.Element {
    const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const sortedRows = useMemo(() => {
        if (!sort) return rows;
        const column = columns.find((col) => col.key === sort.key);
        if (!column) return rows;
        const factor = sort.direction === "asc" ? 1 : -1;
        return [...rows]
            .map((row, index) => ({ row, index }))
            .sort((a, b) => {
                const aValue = column.getValue ? column.getValue(a.row) : (a.row as Record<string, unknown>)[column.key];
                const bValue = column.getValue ? column.getValue(b.row) : (b.row as Record<string, unknown>)[column.key];
                const aPrimitive = typeof aValue === "number" ? aValue : String(aValue ?? "");
                const bPrimitive = typeof bValue === "number" ? bValue : String(bValue ?? "");
                const comparison = typeof aPrimitive === "number" && typeof bPrimitive === "number"
                    ? aPrimitive - bPrimitive
                    : String(aPrimitive).localeCompare(String(bPrimitive), "nl-NL", { sensitivity: "base", numeric: true });
                return comparison !== 0 ? comparison * factor : a.index - b.index;
            })
            .map((entry) => entry.row);
    }, [columns, rows, sort]);

    const pageRows = useMemo(() => paginate(sortedRows, page, pageSize), [sortedRows, page, pageSize]);
    const hasNext = page * pageSize < rows.length;
    const selectedIds = selectable?.selectedIds ?? [];
    const pageIds = pageRows.map((row) => getRowId(row));
    const allPageSelected = selectable ? pageIds.every((id) => selectedIds.includes(id)) : false;

    const handleHeaderToggle = () => {
        if (!selectable) return;
        selectable.onTogglePage(pageIds, !allPageSelected);
    };

    const handleSort = (column: TableColumn<T>) => {
        if (!column.sortable) return;
        setSort((prev) =>
            prev?.key === column.key ? { key: column.key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key: column.key, direction: "asc" },
        );
    };

    return (
        <div className="d-flex flex-column gap-3">
            {(search || filters) && (
                <div className="d-flex flex-wrap align-items-end gap-3">
                    {search && (
                        <label className="flex-grow-1 d-flex flex-column gap-1">
                            <span className="small text-uppercase text-success-emphasis fw-semibold">Zoeken</span>
                            <input
                                type="search"
                                className="form-control border-success-subtle"
                                placeholder={search.placeholder ?? "Zoeken"}
                                value={search.value}
                                onChange={(event) => search.onChange(event.target.value)}
                            />
                        </label>
                    )}
                    {filters}
                    <label className="d-flex flex-column gap-1" style={{ minWidth: "140px" }}>
                        <span className="small text-uppercase text-success-emphasis fw-semibold">Per pagina</span>
                        <select
                            className="form-select border-success-subtle"
                            value={String(pageSize)}
                            onChange={(event) => onPageSizeChange(Number(event.target.value))}
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}

            {pageRows.length === 0 ? (
                emptyState ?? <div className="text-center text-muted py-4">{emptyMessage ?? "Geen resultaten"}</div>
            ) : (
                <div className="table-responsive shadow-sm rounded-4 border border-success-subtle">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-success-subtle">
                            <tr>
                                {selectable && (
                                    <th scope="col" className="text-center" style={{ width: 48 }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input border-success-subtle"
                                            checked={allPageSelected}
                                            aria-label="Selecteer alles"
                                            onChange={handleHeaderToggle}
                                        />
                                    </th>
                                )}
                                {columns.map((column) => {
                                    const direction = sort?.key === column.key ? sort.direction : null;
                                    return (
                                        <th
                                            key={column.key}
                                            scope="col"
                                            className={cx("text-uppercase small text-success-emphasis", column.sortable && "user-select-none")}
                                        >
                                            {column.sortable ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-decoration-none text-success fw-semibold"
                                                    onClick={() => handleSort(column)}
                                                >
                                                    <span className="d-inline-flex align-items-center">
                                                        {column.header}
                                                        <SortIcon direction={direction} />
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
                            {pageRows.map((row, index) => {
                                const id = getRowId(row);
                                const isSelected = selectable?.selectedIds.includes(id) ?? false;
                                const interactive = Boolean(onRowClick);
                                return (
                                    <tr
                                        key={`${id}-${index}`}
                                        className={cx(interactive && "cursor-pointer", isSelected && "table-success")}
                                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    >
                                        {selectable && (
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input border-success-subtle"
                                                    checked={isSelected}
                                                    onClick={(event) => event.stopPropagation()}
                                                    onChange={() => selectable.onToggleRow(id)}
                                                />
                                            </td>
                                        )}
                                        {columns.map((column) => (
                                            <td key={`${column.key}-${index}`} className={cx(column.align === "end" && "text-end", column.align === "center" && "text-center")}
                                            >
                                                {column.render ? column.render(row) : ((row as Record<string, ReactNode>)[column.key] ?? "")}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="text-muted small">Pagina {page}</div>
                <div className="btn-group shadow-sm rounded-4 overflow-hidden">
                    <button type="button" className="btn btn-outline-success btn-sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
                        Vorige
                    </button>
                    <button type="button" className="btn btn-success btn-sm" onClick={() => onPageChange(page + 1)} disabled={!hasNext}>
                        Volgende
                    </button>
                </div>
            </div>
        </div>
    );
}
