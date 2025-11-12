import {
    memo,
    useId,
    useMemo,
    useState,
    useCallback,
    type KeyboardEventHandler,
    type ReactElement,
    type ReactNode,
} from "react";
import type { AriaAttributes, CSSProperties, Key } from "react";
import type { RowBase } from "../types/types.ts";

/* utils */
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const stringify = (v: unknown): string => {
    if (v == null) return "";
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "object") try { return JSON.stringify(v); } catch { return ""; }
    return String(v);
};
const collator = new Intl.Collator("nl-NL", { numeric: true, sensitivity: "base" });
const compareText = (l: string, r: string) => collator.compare(l, r);
const stableSort = <T,>(arr: readonly T[], cmp: (a: T, b: T) => number) =>
    arr.map((v, i) => [v, i] as const).sort((a, b) => cmp(a[0], b[0]) || a[1] - b[1]).map(([v]) => v);

export type SortDirection = "asc" | "desc";

/** Kolomdefinitie (V is het accessortype). */
export type Column<T extends RowBase, V = unknown> = {
    key: keyof T & string;
    header?: ReactNode;
    accessor?: (row: T) => V;
    render?: (value: V, row: T) => ReactNode;
    className?: string;
    width?: CSSProperties["width"];
    align?: "start" | "center" | "end";
    sortable?: boolean;
    hideSm?: boolean;
    comparator?: (left: T, right: T, direction: SortDirection) => number;
};

type ColumnsOf<T extends RowBase> = ReadonlyArray<Column<T, unknown>>;

export type DataTableProps<T extends RowBase> = {
    rows: readonly T[];
    columns?: ColumnsOf<T>;
    caption?: string | ReactNode;
    empty?: ReactNode;
    onRowClick?: (row: T) => void;
    getRowKey?: (row: T, index: number) => Key;
    defaultSortKey?: keyof T & string;
    defaultSortDir?: SortDirection;
    /** Gecontroleerde sortering (optioneel). */
    sortKey?: keyof T & string;
    sortDirection?: SortDirection;
    onSortChange?: (key: keyof T & string, dir: SortDirection) => void;
};

const autoColumns = <T extends RowBase>(rows: readonly T[], max = 8): ColumnsOf<T> => {
    const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).slice(0, max);
    return keys.map((key) => ({ key: key as keyof T & string, sortable: true }));
};

const buildComparator = <T extends RowBase>(
    columns: ColumnsOf<T>,
    sortKey: keyof T & string | undefined,
    sortDirection: SortDirection
) => {
    if (!sortKey) return null;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return null;

    if (col.comparator) {
        return (l: T, r: T) => col.comparator!(l, r, sortDirection);
    }

    const get = (row: T): unknown => (col.accessor ? col.accessor(row) : (row[sortKey] as unknown));
    return (l: T, r: T) => {
        const lv = get(l), rv = get(r);
        const ln = typeof lv === "number" ? lv : Number(lv as number);
        const rn = typeof rv === "number" ? rv : Number(rv as number);
        const base =
            Number.isFinite(ln) && Number.isFinite(rn)
                ? ln - rn
                : compareText(stringify(lv), stringify(rv));
        return sortDirection === "asc" ? base : -base;
    };
};

function DataTableInner<T extends RowBase>({
                                               rows,
                                               columns,
                                               caption,
                                               empty,
                                               onRowClick,
                                               getRowKey,
                                               defaultSortKey,
                                               defaultSortDir = "asc",
                                               sortKey: controlledKey,
                                               sortDirection: controlledDir,
                                               onSortChange,
                                           }: DataTableProps<T>): ReactElement {
    const cols = useMemo(() => (columns?.length ? columns : autoColumns(rows)), [columns, rows]);

    // uncontrolled → controlled hybride
    const [localKey, setLocalKey] = useState<keyof T & string | undefined>(defaultSortKey);
    const [localDir, setLocalDir] = useState<SortDirection>(defaultSortDir);

    const sortKey = controlledKey ?? localKey;
    const sortDirection = controlledDir ?? localDir;

    const comparator = useMemo(
        () => buildComparator(cols, sortKey, sortDirection),
        [cols, sortKey, sortDirection]
    );

    const data = useMemo(() => (comparator ? stableSort(rows, comparator) : rows), [rows, comparator]);

    const tableId = useId();

    const toggleSort = useCallback(
        (key: keyof T & string) => {
            const nextDir: SortDirection = sortKey === key ? (sortDirection === "asc" ? "desc" : "asc") : "asc";
            if (onSortChange) {
                onSortChange(key, nextDir);
            } else {
                setLocalKey(key);
                setLocalDir(nextDir);
            }
        },
        [onSortChange, sortKey, sortDirection]
    );

    if (!rows?.length) {
        return (
            <div className="text-center text-muted py-5" role="status" aria-live="polite" aria-label="geen resultaten">
                {empty ?? "Geen resultaten."}
            </div>
        );
    }

    const colCount = cols.length;

    return (
        <section className="p-2" aria-label="tabel">
            <div className="card shadow-sm border-0 border border-success-subtle">
                {caption && (
                    <div className="card-header bg-success-subtle border-0 py-2">
                        <div id={`${tableId}-caption`} className="small text-success">
                            {caption}
                        </div>
                    </div>
                )}

                <div className="card-body pt-2">
                    <div className="mb-2">
            <span className="badge bg-success-subtle text-success" aria-live="polite">
              {data.length.toLocaleString("nl-NL")} resultaten
            </span>
                    </div>

                    <div className="table-responsive rounded-3 border bg-body">
                        <table
                            className="table table-sm table-striped table-hover align-middle caption-top"
                            aria-describedby={caption ? `${tableId}-caption` : undefined}
                            aria-rowcount={data.length}
                            aria-colcount={colCount}
                        >
                            <thead className="position-sticky top-0 bg-success-subtle" style={{ zIndex: 1 }}>
                            <tr>
                                {cols.map((col) => {
                                    const active = sortKey === col.key;
                                    const ariaSort: AriaAttributes["aria-sort"] = active
                                        ? sortDirection === "asc"
                                            ? "ascending"
                                            : "descending"
                                        : "none";

                                    const thClasses = cx(
                                        "text-nowrap text-success",
                                        col.className,
                                        col.hideSm && "d-none d-md-table-cell",
                                        col.sortable && "user-select-none",
                                        col.align === "center" && "text-center",
                                        col.align === "end" && "text-end"
                                    );

                                    return (
                                        <th
                                            key={col.key}
                                            scope="col"
                                            aria-sort={ariaSort}
                                            className={thClasses}
                                            style={col.width ? { width: col.width } : undefined}
                                            title={col.sortable ? "Klik om te sorteren" : undefined}
                                        >
                                            {col.sortable ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-success text-decoration-none d-inline-flex align-items-center gap-1"
                                                    onClick={() => toggleSort(col.key)}
                                                    aria-label={`Sorteer op ${String(col.header ?? col.key)}`}
                                                >
                                                    {col.header ?? col.key}
                                                    {active && (
                                                        <span className="small" aria-hidden="true">
                                {sortDirection === "asc" ? "▲" : "▼"}
                              </span>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="d-inline-flex align-items-center gap-1">
                            {col.header ?? col.key}
                          </span>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                            </thead>

                            <tbody>
                            {data.map((row, index) => {
                                const key = getRowKey?.(row, index) ?? index;

                                const handleClick = onRowClick ? () => onRowClick(row) : undefined;
                                const handleKeyDown: KeyboardEventHandler<HTMLTableRowElement> = (e) => {
                                    if (!onRowClick) return;
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onRowClick(row);
                                    }
                                };

                                return (
                                    <tr
                                        key={key}
                                        onClick={handleClick}
                                        tabIndex={onRowClick ? 0 : undefined}
                                        role={onRowClick ? "button" : undefined}
                                        onKeyDown={handleKeyDown}
                                    >
                                        {cols.map((col) => {
                                            const raw = col.accessor ? col.accessor(row) : (row[col.key] as unknown);
                                            const tdClasses = cx(
                                                "text-truncate",
                                                col.className,
                                                col.hideSm && "d-none d-md-table-cell",
                                                col.align === "center" && "text-center",
                                                col.align === "end" && "text-end"
                                            );
                                            return (
                                                <td key={col.key} className={tdClasses} style={{ maxWidth: 0 }}>
                                                    {col.render ? col.render(raw, row) : stringify(raw)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

export const DataTable = memo(DataTableInner) as <T extends RowBase>(
    props: DataTableProps<T>
) => ReactElement;

export default DataTable;
