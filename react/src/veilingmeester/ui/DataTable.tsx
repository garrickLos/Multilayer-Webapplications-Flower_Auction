import {
    memo,
    useId,
    useMemo,
    useState,
    type KeyboardEventHandler,
} from 'react';
import type {
    AriaAttributes,
    CSSProperties,
    Key,
    ReactElement,
    ReactNode,
} from 'react';
import type { RowBase } from '../types/types.ts';

const classNames = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(' ');

const stringifyValue = (value: unknown): string => {
    if (value == null) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return '';
        }
    }
    return String(value);
};

const compareText = (left: string, right: string) =>
    left.localeCompare(right, 'nl-NL', { numeric: true, sensitivity: 'base' });

const stableSort = <T,>(values: readonly T[], comparator: (a: T, b: T) => number) =>
    values
        .map((item, index) => [item, index] as const)
        .sort((a, b) => comparator(a[0], b[0]) || a[1] - b[1])
        .map(([item]) => item);

export type SortDirection = 'asc' | 'desc';

export type Column<T extends RowBase> = {
    key: keyof T & string;
    header?: ReactNode;
    accessor?: (row: T) => unknown;
    render?: (value: unknown, row: T) => ReactNode;
    className?: string;
    width?: CSSProperties['width'];
    sortable?: boolean;
    hideSm?: boolean;
    comparator?: (left: T, right: T, direction: SortDirection) => number;
};

export type DataTableProps<T extends RowBase> = {
    rows: readonly T[];
    columns?: ReadonlyArray<Column<T>>;
    caption?: string;
    onRowClick?: (row: T) => void;
    getRowKey?: (row: T, index: number) => Key;
    defaultSortKey?: keyof T & string;
    defaultSortDir?: SortDirection;
    filterPlaceholder?: string;
};

const autoColumns = <T extends RowBase>(rows: readonly T[], max = 8): ReadonlyArray<Column<T>> => {
    const keys = Array.from(new Set(rows.flatMap(row => Object.keys(row)))).slice(0, max);
    return keys.map(key => ({ key: key as keyof T & string, sortable: true }));
};

const useSorting = <T extends RowBase>(
    columns: ReadonlyArray<Column<T>>,
    defaultKey?: keyof T & string,
    defaultDirection: SortDirection = 'asc',
) => {
    const [sortKey, setSortKey] = useState<keyof T & string | undefined>(defaultKey);
    const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

    const comparator = useMemo(() => {
        if (!sortKey) return null;
        const column = columns.find(col => col.key === sortKey);
        if (!column) return null;

        if (column.comparator) {
            return (left: T, right: T) => column.comparator!(left, right, sortDirection);
        }

        const getValue = (row: T) => (column.accessor ? column.accessor(row) : (row[sortKey] as unknown));

        return (left: T, right: T) => {
            const leftValue = getValue(left);
            const rightValue = getValue(right);

            const leftNumber = typeof leftValue === 'number' ? leftValue : Number(leftValue as number);
            const rightNumber = typeof rightValue === 'number' ? rightValue : Number(rightValue as number);

            const base =
                Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
                    ? leftNumber - rightNumber
                    : compareText(stringifyValue(leftValue), stringifyValue(rightValue));

            return sortDirection === 'asc' ? base : -base;
        };
    }, [columns, sortKey, sortDirection]);

    const toggleSort = (key: keyof T & string) => {
        setSortDirection(previous => (sortKey === key ? (previous === 'asc' ? 'desc' : 'asc') : 'asc'));
        setSortKey(key);
    };

    return { sortKey, sortDirection, comparator, toggleSort };
};

const useFiltering = <T extends RowBase>(rows: readonly T[], query: string, columns: ReadonlyArray<Column<T>>) => {
    const normalizedQuery = query.trim().toLowerCase();

    return useMemo(() => {
        if (!normalizedQuery) return rows;
        return rows.filter(row =>
            columns.some(column =>
                stringifyValue(column.accessor ? column.accessor(row) : row[column.key as keyof T])
                    .toLowerCase()
                    .includes(normalizedQuery),
            ),
        );
    }, [rows, normalizedQuery, columns]);
};

function DataTableInner<T extends RowBase>({
    rows,
    columns,
    caption,
    onRowClick,
    getRowKey,
    defaultSortKey,
    defaultSortDir = 'asc',
    filterPlaceholder = 'zoeken…',
}: DataTableProps<T>): ReactElement {
    const resolvedColumns = useMemo(
        () => (columns?.length ? columns : autoColumns(rows)),
        [columns, rows],
    );

    const { sortKey, sortDirection, comparator, toggleSort } = useSorting(
        resolvedColumns,
        defaultSortKey,
        defaultSortDir,
    );

    const [query, setQuery] = useState('');
    const filteredRows = useFiltering(rows, query, resolvedColumns);
    const data = useMemo(
        () => (comparator ? stableSort(filteredRows, comparator) : filteredRows),
        [filteredRows, comparator],
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
                            <span className="input-group-text bg-success-subtle text-success border-success-subtle">
                                Zoek
                            </span>
                            <input
                                className="form-control"
                                value={query}
                                onChange={event => setQuery(event.currentTarget.value)}
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

                    <div className="table-responsive rounded-3 border bg-body">
                        <table
                            className="table table-sm table-striped table-hover align-middle caption-top"
                            aria-describedby={caption ? `${tableId}-caption` : undefined}
                        >
                            <thead className="position-sticky top-0 bg-success-subtle" style={{ zIndex: 1 }}>
                                <tr>
                                    {resolvedColumns.map(column => {
                                        const active = sortKey === column.key;
                                        const ariaSort: AriaAttributes['aria-sort'] = active
                                            ? sortDirection === 'asc'
                                                ? 'ascending'
                                                : 'descending'
                                            : 'none';

                                        return (
                                            <th
                                                key={column.key}
                                                scope="col"
                                                aria-sort={ariaSort}
                                                className={classNames(
                                                    'text-nowrap text-success',
                                                    column.className,
                                                    column.hideSm && 'd-none d-md-table-cell',
                                                    column.sortable && 'user-select-none',
                                                )}
                                                style={column.width ? { width: column.width } : undefined}
                                                title={column.sortable ? 'Klik om te sorteren' : undefined}
                                            >
                                                {column.sortable ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-link p-0 text-success text-decoration-none d-inline-flex align-items-center gap-1"
                                                        onClick={() => toggleSort(column.key)}
                                                        aria-label={`Sorteer op ${String(column.header ?? column.key)}`}
                                                    >
                                                        {column.header ?? column.key}
                                                        {active && (
                                                            <span className="small" aria-hidden="true">
                                                                {sortDirection === 'asc' ? '▲' : '▼'}
                                                            </span>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="d-inline-flex align-items-center gap-1">
                                                        {column.header ?? column.key}
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
                                    const handleClick = () => onRowClick?.(row);

                                    const handleKeyDown: KeyboardEventHandler<HTMLTableRowElement> = event => {
                                        if (!onRowClick) return;
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            onRowClick(row);
                                        }
                                    };

                                    return (
                                        <tr
                                            key={key}
                                            onClick={handleClick}
                                            tabIndex={onRowClick ? 0 : undefined}
                                            role={onRowClick ? 'button' : undefined}
                                            onKeyDown={handleKeyDown}
                                        >
                                            {resolvedColumns.map(column => {
                                                const value = column.accessor ? column.accessor(row) : (row[column.key] as unknown);
                                                return (
                                                    <td
                                                        key={column.key}
                                                        className={classNames(
                                                            'text-truncate',
                                                            column.className,
                                                            column.hideSm && 'd-none d-md-table-cell',
                                                        )}
                                                        style={{ maxWidth: 0 }}
                                                    >
                                                        {column.render ? column.render(value, row) : stringifyValue(value)}
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

export const DataTable = memo(
    DataTableInner,
) as <T extends RowBase>(props: DataTableProps<T>) => ReactElement;

export default DataTable;
