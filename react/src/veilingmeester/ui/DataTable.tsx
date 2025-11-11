import React, { memo, useId, useMemo, useState } from 'react';
import type { RowBase } from '../types';
export type { RowBase } from '../types';

/*  DataTable-component
 * Tabel met sorteer- en zoekfunctionaliteit (client-side).
 */

/*  Hulpfuncties  */

// Combineert CSS-klassen en slaat lege waarden over.
const cx = (...classes: Array<string | false | null | undefined>): string =>
    classes.filter((c): c is string => Boolean(c)).join(' ');

// Zet waarden veilig om naar tekst (ook voor datums en objecten).
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

// Vergelijkt tekst op Nederlandse manier, ongevoelig voor hoofdletters.
const cmpText = (a: string, b: string) =>
    a.localeCompare(b, 'nl-NL', { numeric: true, sensitivity: 'base' });

// Stabiele sorteerfunctie (behoudt volgorde bij gelijke waarden).
const stableSort = <T,>(arr: readonly T[], cmp: (x: T, y: T) => number): T[] =>
    arr
        .map((el, idx) => [el, idx] as const)
        .sort((a, b) => cmp(a[0], b[0]) || a[1] - b[1])
        .map(([el]) => el);

/*  Types  */

export type SortDir = 'asc' | 'desc';
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

/*  Hooks  */

// Maakt automatisch kolommen aan op basis van data.
const autoColumns = <T extends RowBase>(
    rows: readonly T[],
    max = 8,
): ReadonlyArray<Column<T>> => {
    const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r)))).slice(
        0,
        max,
    );
    return keys.map(k => ({ key: k as keyof T & string, sortable: true }));
};

// Beheert sorteerlogica en geeft comparator + toggle terug.
function useSorting<T extends RowBase>(
    cols: ReadonlyArray<Column<T>>,
    defaultKey?: keyof T & string,
    defaultDir: SortDir = 'asc',
) {
    const [sortKey, setSortKey] = useState<keyof T & string | undefined>(
        defaultKey,
    );
    const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

    const comparator = useMemo(() => {
        if (!sortKey) return null;
        const col = cols.find(c => c.key === sortKey);
        if (!col) return null;

        if (col.comparator) {
            return (a: T, b: T) => col.comparator!(a, b, sortDir);
        }

        const getVal = (r: T) =>
            col.accessor ? col.accessor(r) : (r[sortKey] as unknown);

        return (a: T, b: T) => {
            const av = getVal(a);
            const bv = getVal(b);

            const na =
                typeof av === 'number' ? av : Number((av as unknown) as number);
            const nb =
                typeof bv === 'number' ? bv : Number((bv as unknown) as number);

            const base =
                Number.isFinite(na) && Number.isFinite(nb)
                    ? na - nb
                    : cmpText(asText(av), asText(bv));

            return sortDir === 'asc' ? base : -base;
        };
    }, [cols, sortKey, sortDir]);

    const toggleSort = (key: keyof T & string) => {
        setSortDir(prev =>
            sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc',
        );
        setSortKey(key);
    };

    return { sortKey, sortDir, comparator, toggleSort };
}

// Filtert rijen op basis van zoekterm.
function useFiltering<T extends RowBase>(
    rows: readonly T[],
    query: string,
    cols: ReadonlyArray<Column<T>>,
) {
    const dq = query.trim().toLowerCase();

    return useMemo(() => {
        if (!dq) return rows;
        return rows.filter(r =>
            cols.some(c =>
                asText(
                    c.accessor ? c.accessor(r) : r[c.key as keyof T],
                )
                    .toLowerCase()
                    .includes(dq),
            ),
        );
    }, [rows, dq, cols]);
}

/*  Hoofdcomponent  */

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
    const cols = useMemo(
        () => (columns?.length ? columns : autoColumns(rows)),
        [columns, rows],
    );

    const { sortKey, sortDir, comparator, toggleSort } = useSorting(
        cols,
        defaultSortKey,
        defaultSortDir,
    );

    const [query, setQuery] = useState('');
    const filtered = useFiltering(rows, query, cols);
    const data = useMemo(
        () => (comparator ? stableSort(filtered, comparator) : filtered),
        [filtered, comparator],
    );

    const tableId = useId();

    if (!rows?.length) {
        return (
            <div className="text-center text-muted py-5">
                Geen resultaten.
            </div>
        );
    }

    return (
        <section className="p-2" aria-label="tabel">
            <div className="card shadow-sm border-0 border border-success-subtle">
                {caption && (
                    <div className="card-header bg-success-subtle border-0 py-2">
                        <div
                            id={`${tableId}-caption`}
                            className="small text-success"
                        >
                            {caption}
                        </div>
                    </div>
                )}
                <div className="card-body pt-2">
                    {/* Zoekveld en teller */}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span
                            className="badge bg-success-subtle text-success"
                            aria-live="polite"
                        >
                            {data.length.toLocaleString('nl-NL')} resultaten
                        </span>
                        <div
                            className="input-group input-group-sm"
                            style={{ maxWidth: 320 }}
                        >
                            <span className="input-group-text bg-success-subtle text-success border-success-subtle">
                                Zoek
                            </span>
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
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setQuery('')}
                                >
                                    Wissen
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabel */}
                    <div className="table-responsive rounded-3 border bg-body">
                        <table
                            className="table table-sm table-striped table-hover align-middle caption-top"
                            aria-describedby={
                                caption ? `${tableId}-caption` : undefined
                            }
                        >
                            <thead
                                className="position-sticky top-0 bg-success-subtle"
                                style={{ zIndex: 1 }}
                            >
                            <tr>
                                {cols.map(c => {
                                    const active = sortKey === c.key;
                                    const ariaSort: React.AriaAttributes['aria-sort'] =
                                        active
                                            ? sortDir === 'asc'
                                                ? 'ascending'
                                                : 'descending'
                                            : 'none';
                                    return (
                                        <th
                                            key={c.key}
                                            scope="col"
                                            aria-sort={ariaSort}
                                            className={cx(
                                                'text-nowrap text-success',
                                                c.className,
                                                c.hideSm &&
                                                'd-none d-md-table-cell',
                                                c.sortable &&
                                                'user-select-none',
                                            )}
                                            style={
                                                c.width
                                                    ? { width: c.width }
                                                    : undefined
                                            }
                                            title={
                                                c.sortable
                                                    ? 'Klik om te sorteren'
                                                    : undefined
                                            }
                                        >
                                            {c.sortable ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-success text-decoration-none d-inline-flex align-items-center gap-1"
                                                    onClick={() =>
                                                        toggleSort(c.key)
                                                    }
                                                    aria-label={`Sorteer op ${String(
                                                        c.header ?? c.key,
                                                    )}`}
                                                >
                                                    {c.header ?? c.key}
                                                    {active && (
                                                        <span
                                                            className="small"
                                                            aria-hidden="true"
                                                        >
                                                                {sortDir ===
                                                                'asc'
                                                                    ? '▲'
                                                                    : '▼'}
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
                                const handleClick = () =>
                                    onRowClick?.(row);

                                const handleKeyDown: React.KeyboardEventHandler<HTMLTableRowElement> =
                                    e => {
                                        if (!onRowClick) return;
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                        ) {
                                            e.preventDefault();
                                            onRowClick(row);
                                        }
                                    };

                                return (
                                    <tr
                                        key={key}
                                        onClick={handleClick}
                                        tabIndex={
                                            onRowClick ? 0 : undefined
                                        }
                                        role={
                                            onRowClick ? 'button' : undefined
                                        }
                                        onKeyDown={handleKeyDown}
                                    >
                                        {cols.map(c => {
                                            const val = c.accessor
                                                ? c.accessor(row)
                                                : (row[
                                                    c.key
                                                    ] as unknown);
                                            return (
                                                <td
                                                    key={c.key}
                                                    className={cx(
                                                        'text-truncate',
                                                        c.className,
                                                        c.hideSm &&
                                                        'd-none d-md-table-cell',
                                                    )}
                                                    style={{ maxWidth: 0 }}
                                                >
                                                    {c.render
                                                        ? c.render(val, row)
                                                        : asText(val)}
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

// Exporteert de geoptimaliseerde DataTable mét generics.
export const DataTable = memo(
    DataTableInner,
) as <T extends RowBase>(props: DataTableProps<T>) => React.ReactElement;

export default DataTable;
