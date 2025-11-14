import {
    Component,
    memo,
    useId,
    useMemo,
    useState,
    type ChangeEvent,
    type ErrorInfo,
    type JSX,
    type KeyboardEvent,
    type ReactNode,
} from "react";
import type { Status } from "../types";
import { nlCollator, statusBadgeVariant, statusLabel } from "../types";
import { cx } from "../utils";

export type Option<T extends string | number> = {
    readonly value: T;
    readonly label: string;
};

export type SelectFieldProps<T extends string | number> = {
    readonly id?: string;
    readonly label?: string;
    readonly value: T;
    readonly options: readonly Option<T>[];
    readonly onChange: (value: T) => void;
    readonly ariaLabel?: string;
    readonly disabled?: boolean;
    readonly className?: string;
    readonly parse?: (raw: string) => T;
};

/**
 * Renders a small Bootstrap select field with label support.
 */
export function SelectField<T extends string | number>({
    id: providedId,
    label,
    value,
    options,
    onChange,
    ariaLabel,
    disabled,
    className,
    parse,
}: SelectFieldProps<T>): JSX.Element {
    const generatedId = useId();
    const inputId = providedId ?? generatedId;

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const raw = event.target.value;

        const nextValue = parse
            ? parse(raw)
            : typeof value === "number"
                ? (Number(raw) as T)
                : (raw as T);

        onChange(nextValue);
    };

    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="form-label small text-uppercase text-success-emphasis mb-1"
                >
                    {label}
                </label>
            )}
            <select
                id={inputId}
                className="form-select form-select-sm border-success-subtle"
                value={String(value)}
                onChange={handleChange}
                aria-label={ariaLabel ?? label}
                disabled={disabled}
            >
                {options.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * Convenience wrapper for a small select field.
 */
export function SmallSelectField<T extends string | number>(
    props: SelectFieldProps<T>,
): JSX.Element {
    return <SelectField {...props} />;
}

/**
 * Select field for status filtering with standaard opties.
 */
export function StatusSelectField(
    props: Omit<SelectFieldProps<"alle" | "actief" | "inactief">, "options" | "parse">,
): JSX.Element {
    return (
        <SelectField
            {...props}
            options={[
                { value: "alle", label: "Alle statussen" },
                { value: "actief", label: "Actief" },
                { value: "inactief", label: "Inactief" },
            ]}
        />
    );
}

export type SearchFieldProps = {
    readonly id?: string;
    readonly label?: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly placeholder?: string;
    readonly autoFocus?: boolean;
};

/**
 * Renders a searchable input with optional label.
 */
export function SearchField({
    id,
    label,
    value,
    onChange,
    placeholder,
    autoFocus,
}: SearchFieldProps): JSX.Element {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const aria = label ?? placeholder ?? "Zoeken";

    return (
        <div className="w-100">
            {label && (
                <label
                    htmlFor={inputId}
                    className="form-label small text-uppercase text-success-emphasis mb-1"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                type="search"
                className="form-control form-control-sm border-success-subtle"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                aria-label={aria}
            />
        </div>
    );
}

export function FilterChip({
    label,
    onRemove,
}: {
    readonly label: string;
    readonly onRemove: () => void;
}): JSX.Element {
    return (
        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle rounded-pill d-inline-flex align-items-center gap-2 px-2 py-1">
            <span>{label}</span>
            <button
                type="button"
                className="btn-close btn-close-sm"
                aria-label={`${label} verwijderen`}
                onClick={onRemove}
            />
        </span>
    );
}

export type PagerProps = {
    readonly page: number;
    readonly pageSize: number;
    readonly hasNext: boolean;
    readonly onPrevious: () => void;
    readonly onNext: () => void;
    readonly totalResults?: number;
};

/**
 * Pagination controls with summary text.
 */
export function Pager({
    page,
    pageSize,
    hasNext,
    onPrevious,
    onNext,
    totalResults,
}: PagerProps): JSX.Element {
    const from = (page - 1) * pageSize + 1;
    const maxTo = from + pageSize - 1;

    const to =
        totalResults != null
            ? Math.min(page * pageSize, totalResults)
            : hasNext
                ? page * pageSize
                : maxTo;

    const summary = totalResults != null ? `• van ${totalResults} totaal` : "";

    return (
        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap" aria-live="polite">
            <div className="text-muted small">
                Pagina {page} • {from} – {to} getoond {summary}
            </div>
            <div className="btn-group shadow-sm rounded-4 overflow-hidden">
                <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={onPrevious}
                    disabled={page <= 1}
                >
                    Vorige
                </button>
                <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={onNext}
                    disabled={!hasNext}
                >
                    Volgende
                </button>
            </div>
        </div>
    );
}

/**
 * Skeleton-like loading placeholder.
 */
export function LoadingPlaceholder(): JSX.Element {
    return (
        <div className="d-flex flex-column gap-2" role="status" aria-live="polite">
            <div className="placeholder-glow">
                <div className="placeholder col-12 rounded-4 py-3 mb-2 bg-success-subtle" />
                <div className="placeholder col-10 rounded-4 py-3 mb-2 bg-success-subtle" />
                <div className="placeholder col-8 rounded-4 py-3 bg-success-subtle" />
            </div>
        </div>
    );
}

/**
 * Accessible empty state.
 */
export function EmptyState({ message }: { readonly message: string }): JSX.Element {
    return (
        <div className="text-center text-muted py-5" role="status" aria-live="polite">
            <div className="display-6 mb-2 text-success" aria-hidden="true">
                🌿
            </div>
            <p className="mb-0">{message}</p>
        </div>
    );
}

/**
 * Inline alert for contextual messaging.
 */
export function InlineAlert({
    variant = "danger",
    children,
}: {
    readonly variant?: "danger" | "warning" | "info" | "success";
    readonly children: ReactNode;
}): JSX.Element {
    return (
        <div className={`alert alert-${variant} py-2 px-3 shadow-sm rounded-4 border-0 mb-0`} role="alert">
            {children}
        </div>
    );
}

export function ResultBadge({
    count,
    total,
}: {
    readonly count: number;
    readonly total?: number;
}): JSX.Element {
    const base = count === 1 ? "1 resultaat" : `${count} resultaten`;
    const suffix = total != null ? ` • van ${total} totaal` : "";

    return (
        <span className="badge bg-success-subtle text-success-emphasis rounded-pill shadow-sm" aria-live="polite">
            {base}
            {suffix}
        </span>
    );
}

/**
 * Badge component for statuswaarden met consistente kleurcodering.
 */
export function StatusBadge({ status }: { readonly status: Status }): JSX.Element {
    return (
        <span className={`badge rounded-pill ${statusBadgeVariant(status)}`}>
            {statusLabel(status)}
        </span>
    );
}

export type ErrorBoundaryProps = {
    readonly children: ReactNode;
    readonly fallback?: ReactNode;
    readonly resetKey?: unknown;
};

type ErrorBoundaryState = {
    readonly hasError: boolean;
    readonly message?: string;
};

const INITIAL_STATE: ErrorBoundaryState = {
    hasError: false,
    message: undefined,
};

/**
 * Captures rendering errors and displays an accessible fallback alert.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    override state: ErrorBoundaryState = INITIAL_STATE;

    static override getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        const message =
            typeof error === "string"
                ? error
                : (error as { message?: string })?.message;

        return { hasError: true, message };
    }

    override componentDidCatch(error: Error, info: ErrorInfo): void {
        // Fouten worden bewust stil afgehandeld binnen de alert.
        void error;
        void info;
    }

    override componentDidUpdate(prevProps: Readonly<ErrorBoundaryProps>): void {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState(INITIAL_STATE);
        }
    }

    private readonly handleReset = () => {
        this.setState(INITIAL_STATE);
    };

    override render(): ReactNode {
        const { fallback, children } = this.props;
        const { hasError, message } = this.state;

        if (!hasError) {
            return children;
        }

        if (fallback) {
            return fallback;
        }

        return (
            <InlineAlert>
                <div className="d-flex flex-column gap-2">
                    <div>Er trad een fout op tijdens het laden van deze sectie.</div>
                    {message && <small className="text-muted">{message}</small>}
                    <button
                        type="button"
                        className="btn btn-success btn-sm align-self-start"
                        onClick={this.handleReset}
                    >
                        Opnieuw proberen
                    </button>
                </div>
            </InlineAlert>
        );
    }
}

type SortDirection = "asc" | "desc";

type SortState =
    | {
          readonly key: string;
          readonly direction: SortDirection;
      }
    | null;

type Primitive = string | number;
type ColumnValue = Primitive | Date | null | undefined;

export type DataTableColumn<T> = {
    readonly key: keyof T | string;
    readonly header: string;
    readonly headerClassName?: string;
    readonly cellClassName?: string;
    readonly sortable?: boolean;
    readonly render?: (row: T) => ReactNode;
    readonly getValue?: (row: T) => ColumnValue;
};

export type DataTableProps<T> = {
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
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    if (value == null) return "";
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
    if (column.getValue) return column.getValue(row);
    const record = row as Record<string, ColumnValue>;
    return record[column.key as string];
}

function sortRows<T>(
    rows: readonly T[],
    columns: readonly DataTableColumn<T>[],
    sortState: SortState,
): readonly T[] {
    if (!sortState) return rows;

    const column = columns.find((col) => (col.key as string) === sortState.key);
    if (!column) return rows;

    const factor = sortState.direction === "asc" ? 1 : -1;

    return rows
        .map<IndexedRow<T>>((row, index) => ({ row, index }))
        .sort((a, b) => {
            const aValue = getCellValue(a.row, column);
            const bValue = getCellValue(b.row, column);
            const comparison = compareValues(aValue, bValue);
            if (comparison !== 0) return comparison * factor;
            return a.index - b.index; // stable sort
        })
        .map((entry) => entry.row);
}

/**
 * Responsive, sortable table built with Bootstrap utilities.
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

    const sortedRows = useMemo(
        () => sortRows(rows, columns, sortState),
        [rows, columns, sortState],
    );

    const handleSort = (column: DataTableColumn<T>) => {
        if (!column.sortable) return;
        const key = column.key as string;

        setSortState((previous) => {
            if (previous?.key === key) {
                return { key, direction: previous.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const handleRowKey = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
        if (!onRowClick) return;
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
                                    const icon = !sortable
                                        ? null
                                        : active
                                            ? direction === "asc"
                                                ? "▲"
                                                : "▼"
                                            : "↕";

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
                                const interactive = Boolean(
                                    onRowClick && (isRowInteractive ? isRowInteractive(row) : true),
                                );

                                const handleClick =
                                    interactive && onRowClick ? () => onRowClick(row) : undefined;

                                const handleKeyDown =
                                    interactive && onRowClick
                                        ? (event: KeyboardEvent<HTMLTableRowElement>) =>
                                              handleRowKey(event, row)
                                        : undefined;

                                return (
                                    <tr
                                        key={getRowKey(row, index)}
                                        className={cx(interactive && "cursor-pointer")}
                                        onClick={handleClick}
                                        onKeyDown={handleKeyDown}
                                        tabIndex={interactive ? 0 : undefined}
                                    >
                                        {columns.map((column) => {
                                            let content: ReactNode;

                                            if (column.render) {
                                                // custom render always wint
                                                content = column.render(row);
                                            } else {
                                                const value = getCellValue(row, column);
                                                // Fix TS2322: Date is geen ReactNode → als string renderen
                                                content =
                                                    value instanceof Date
                                                        ? String(value)
                                                        : value ?? "";
                                            }

                                            return (
                                                <td
                                                    key={`${String(column.key)}-${index}`}
                                                    className={column.cellClassName}
                                                >
                                                    {content}
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
    );
}

/**
 * Memoized table component voor betere performance.
 */
export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;
