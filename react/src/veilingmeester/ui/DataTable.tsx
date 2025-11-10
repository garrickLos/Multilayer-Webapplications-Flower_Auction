import React, { memo, useCallback, useId, useMemo, useState } from 'react';

/*
 * Improved DataTable component
 *
 * This version of the DataTable component extracts internal logic into
 * helper hooks and functions, reducing the complexity of the main
 * component and improving performance through memoisation. The API
 * remains compatible with the original implementation.
 */

/* --------------------------------------------------------------------------
 * Utility functions
 *
 * These helpers centralise common operations such as class name
 * concatenation, value normalisation and locale aware comparison. They
 * live outside of the component so they are created only once.
 */

// Concatenate classnames, skipping falsy values
const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

// Safely convert unknown values to displayable text.  Dates are ISO
// stringified, objects are JSON stringified (catching circular refs) and
// primitives are coerced to strings.
const asText = (v: unknown): string => {
    if (v == null) return '';
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object') {
        try {
            return JSON.stringify(v);
        } catch {
            return '';
        }
    }
    return String(v);
};

// Locale aware comparison for strings/numbers.  Uses Dutch locale with
// numeric sorting and case insensitive comparison.
const cmpText = (a: string, b: string) => a.localeCompare(b, 'nl-NL', { numeric: true, sensitivity: 'base' });

// Stable sort implementation: map each element to a tuple with its index,
// perform the sort and then remap back to the original elements.  Falls
// back to the original order when the comparator returns 0.
const stableSort = <T,>(arr: readonly T[], cmp: (x: T, y: T) => number): T[] =>
    arr
        .map((el, idx) => [el, idx] as const)
        .sort((a, b) => cmp(a[0], b[0]) || a[1] - b[1])
        .map(([el]) => el);

/* --------------------------------------------------------------------------
 * Types
 */

export type SortDir = 'asc' | 'desc';
export type RowBase = Record<string, unknown>;

export type Column<T extends RowBase> = {
    key: keyof T & string;
    header?: React.ReactNode;
    accessor?: (row: T) => unknown;
    render?: (val: unknown, row: T) => React.ReactNode;
    className?: string;
    width?: React.CSSProperties['width'];
    sortable?: boolean;
    hideSm?: boolean;
    comparator?: (a: T, b: T, dir: SortDir) => number;
};

export type DataTableProps<T extends RowBase> = {
    rows: readonly T[];
    columns?: ReadonlyArray<Column<T>>;
    caption?: string;
    onRowClick?: (row: T) => void;
    getRowKey?: (row: T, index: number) => React.Key;
    defaultSortKey?: keyof T & string;
    defaultSortDir?: SortDir;
    filterPlaceholder?: string;
};

/* --------------------------------------------------------------------------
 * Hooks
 *
 * The hooks defined here encapsulate the logic for computing column
 * definitions, sorting and filtering. Separating this logic from the
 * component improves readability and makes the main render function
 * declarative.
 */

// Derive column definitions from the data itself when no columns are
// provided.  Only the first `max` keys across all rows are used.
const autoColumns = <T extends RowBase>(rows: readonly T[], max = 8): ReadonlyArray<Column<T>> => {
    const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r)))).slice(0, max);
    return keys.map(k => ({ key: k as keyof T & string, sortable: true }));
};

// Manage sorting state and compute a comparator based on the active
// column and direction. Returns the sort state and a callback to toggle
// sorting on a column.
function useSorting<T extends RowBase>(
    cols: ReadonlyArray<Column<T>>,
    defaultKey?: keyof T & string,
    defaultDir: SortDir = 'asc',
) {
    const [sortKey, setSortKey] = useState<keyof T & string | undefined>(defaultKey);
    const [sortDir, setSortDir] = useState<SortDir>(defaultDir);
    // Build comparator when sort state changes
    const comparator = useMemo(() => {
        if (!sortKey) return null as ((a: T, b: T) => number) | null;
        const col = cols.find(c => c.key === sortKey);
        if (!col) return null;
        if (col.comparator) {
            return (a: T, b: T) => col.comparator!(a, b, sortDir);
        }
        const getVal = (r: T) => (col.accessor ? col.accessor(r) : (r[sortKey] as unknown));
        return (a: T, b: T) => {
            const av = getVal(a);
            const bv = getVal(b);
            const na = typeof av === 'number' ? av : Number(av);
            const nb = typeof bv === 'number' ? bv : Number(bv);
            const base = Number.isFinite(na) && Number.isFinite(nb) ? na - nb : cmpText(asText(av), asText(bv));
            return sortDir === 'asc' ? base : -base;
        };
    }, [cols, sortKey, sortDir]);
    // toggle sort state
    const toggleSort = useCallback(
        (key: keyof T & string) => {
            setSortDir(prev => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
            setSortKey(key);
        },
        [sortKey],
    );
    return { sortKey, sortDir, comparator, toggleSort };
}

// Filter rows based on a query string. The query is trimmed and lowered
// immediately so that filtering happens synchronously on each change.
function useFiltering<T extends RowBase>(rows: readonly T[], query: string, cols: ReadonlyArray<Column<T>>) {
    const dq = query.trim().toLowerCase();
    return useMemo(() => {
        if (!dq) return rows;
        return rows.filter(r =>
            cols.some(c => asText(c.accessor ? c.accessor(r) : r[c.key as keyof T]).toLowerCase().includes(dq)),
        );
    }, [rows, dq, cols]);
}

/* --------------------------------------------------------------------------
 * DataTable component
 */

function DataTableInner<T extends RowBase>({
                                               rows,
                                               columns,
                                               caption,
                                               onRowClick,
                                               getRowKey,
                                               defaultSortKey,
                                               defaultSortDir = 'asc',
                                               filterPlaceholder = 'zoeken…',
                                           }: DataTableProps<T>) {
    const cols = useMemo(() => (columns?.length ? columns : autoColumns(rows)), [columns, rows]);
    // Sorting logic
    const { sortKey, sortDir, comparator, toggleSort } = useSorting(cols, defaultSortKey, defaultSortDir);
    // Filter state
    const [query, setQuery] = useState('');
    // Filtered rows
    const filtered = useFiltering(rows, query, cols);
    // Sorted rows
    const data = useMemo(() => (comparator ? stableSort(filtered, comparator) : filtered), [filtered, comparator]);
    // Unique id for caption
    const tableId = useId();
    // Early out when no rows are present
    if (!rows?.length) {
        return <div className="text-center text-muted py-5">Geen resultaten.</div>;
    }
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
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="badge bg-success-subtle text-success" aria-live="polite">
                            {data.length.toLocaleString('nl-NL')} resultaten
                        </span>
                        <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
                            <span className="input-group-text bg-success-subtle text-success border-success-subtle">Zoek</span>
                            <input
                                className="form-control"
                                value={query}
                                onChange={e => setQuery(e.currentTarget.value)}
                                placeholder={filterPlaceholder}
                                aria-label="Filter resultaten"
                                inputMode="search"
                                autoComplete="off"
                            />
                            {query && (
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setQuery('')}>
                                    Wissen
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="table-responsive rounded-3 border bg-body">
                        <table
                            className="table table-sm table-striped table-hover align-middle caption-top"
                            aria-describedby={caption ? `${tableId}-caption` : undefined}
                        >
                            <thead className="position-sticky top-0 bg-success-subtle" style={{ zIndex: 1 }}>
                            <tr>
                                {cols.map(c => {
                                    const active = sortKey === c.key;
                                    const ariaSort = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                                    return (
                                        <th
                                            key={c.key}
                                            scope="col"
                                            aria-sort={ariaSort}
                                            className={cx(
                                                'text-nowrap text-success',
                                                c.className,
                                                c.hideSm && 'd-none d-md-table-cell',
                                                c.sortable && 'user-select-none',
                                            )}
                                            style={c.width != null ? { width: c.width } : undefined}
                                            title={c.sortable ? 'Klik om te sorteren' : undefined}
                                        >
                                            {c.sortable ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-success text-decoration-none d-inline-flex align-items-center gap-1"
                                                    onClick={() => toggleSort(c.key)}
                                                    aria-label={`Sorteer op ${String(c.header ?? c.key)}`}
                                                >
                                                    {c.header ?? c.key}
                                                    {active && (
                                                        <span className="small" aria-hidden="true">
                                                            {sortDir === 'asc' ? '▲' : '▼'}
                                                        </span>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="d-inline-flex align-items-center gap-1">
                                                    {c.header ?? c.key}
                                                </span>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                            </thead>
                            <tbody>
                            {data.map((row, i) => {
                                const key = getRowKey?.(row, i) ?? i;
                                const handleClick = () => onRowClick?.(row);
                                return (
                                    <tr
                                        key={key}
                                        onClick={handleClick}
                                        tabIndex={onRowClick ? 0 : undefined}
                                        role={onRowClick ? 'button' : undefined}
                                        onKeyDown={e => {
                                            if (!onRowClick) return;
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onRowClick(row);
                                            }
                                        }}
                                    >
                                        {cols.map(c => {
                                            const val = c.accessor ? c.accessor(row) : (row[c.key] as unknown);
                                            return (
                                                <td
                                                    key={c.key}
                                                    className={cx(
                                                        'text-truncate',
                                                        c.className,
                                                        c.hideSm && 'd-none d-md-table-cell',
                                                    )}
                                                    style={{ maxWidth: 0 }}
                                                >
                                                    {c.render ? c.render(val, row) : asText(val)}
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

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
export default DataTable;