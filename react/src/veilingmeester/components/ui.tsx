import { Component, useId, useMemo, useState, type ChangeEvent, type ErrorInfo, type JSX, type ReactNode } from "react";
import type { Status } from "../types";
import { nlCollator, statusBadgeVariant, statusLabel } from "../types";
import { cx } from "../utils";

export type Option<T extends string | number> = { readonly value: T; readonly label: string };

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
        const next = parse ? parse(raw) : ((typeof value === "number" ? Number(raw) : raw) as T);
        onChange(next);
    };

    return (
        <div className={className}>
            {label && (
                <label htmlFor={inputId} className="form-label small text-uppercase text-success-emphasis mb-1">
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

export const SmallSelectField = <T extends string | number>(props: SelectFieldProps<T>): JSX.Element => <SelectField {...props} />;

export type SearchFieldProps = {
    readonly id?: string;
    readonly label?: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly placeholder?: string;
    readonly autoFocus?: boolean;
};

export function SearchField({ id, label, value, onChange, placeholder, autoFocus }: SearchFieldProps): JSX.Element {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const aria = label ?? placeholder ?? "Zoeken";

    return (
        <div className="w-100">
            {label && (
                <label htmlFor={inputId} className="form-label small text-uppercase text-success-emphasis mb-1">
                    {label}
                </label>
            )}
            <div className="input-group input-group-sm">
                <input
                    id={inputId}
                    type="search"
                    className="form-control border-success-subtle"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    aria-label={aria}
                />
                <label htmlFor={inputId} className="input-group-text border-success-subtle bg-white" style={{ cursor: "pointer" }}>
                    <i className="bi bi-search" />
                </label>
            </div>
        </div>
    );
}

export const InlineAlert = ({ variant = "danger", children }: { readonly variant?: "danger" | "warning" | "info" | "success"; readonly children: ReactNode }): JSX.Element => (
    <div className={`alert alert-${variant} py-2 px-3 shadow-sm rounded-4 border-0 mb-0`} role="alert">
        {children}
    </div>
);

export const LoadingPlaceholder = (): JSX.Element => (
    <div className="placeholder-glow" role="status" aria-live="polite">
        <div className="placeholder col-12 rounded-4 py-3 mb-2 bg-success-subtle" />
        <div className="placeholder col-10 rounded-4 py-3 mb-2 bg-success-subtle" />
        <div className="placeholder col-8 rounded-4 py-3 bg-success-subtle" />
    </div>
);

export const EmptyState = ({ message }: { readonly message: string }): JSX.Element => (
    <div className="text-center text-muted py-5" role="status" aria-live="polite">
        <div className="display-6 mb-2 text-success" aria-hidden="true">
            🌿
        </div>
        <p className="mb-0">{message}</p>
    </div>
);

export const ResultBadge = ({ count, total }: { readonly count: number; readonly total?: number }): JSX.Element => (
    <span className="badge bg-success-subtle text-success-emphasis rounded-pill shadow-sm" aria-live="polite">
        {count === 1 ? "1 resultaat" : `${count} resultaten`}
        {total != null ? ` - van ${total} totaal` : ""}
    </span>
);

export const StatusBadge = ({ status }: { readonly status: Status }): JSX.Element => (
    <span className={`badge rounded-pill ${statusBadgeVariant(status)}`}>{statusLabel(status)}</span>
);

export const FilterChip = ({ label, onRemove }: { readonly label: string; readonly onRemove: () => void }): JSX.Element => (
    <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle rounded-pill d-inline-flex align-items-center gap-2 px-2 py-1">
        <span>{label}</span>
        <button type="button" className="btn-close btn-close-sm" aria-label={`${label} verwijderen`} onClick={onRemove} />
    </span>
);

export type PagerProps = {
    readonly page: number;
    readonly pageSize: number;
    readonly hasNext: boolean;
    readonly onPrevious: () => void;
    readonly onNext: () => void;
    readonly totalResults?: number;
};

export const Pager = ({ page, pageSize, hasNext, onPrevious, onNext, totalResults }: PagerProps): JSX.Element => {
    const from = (page - 1) * pageSize + 1;
    const to = totalResults != null ? Math.min(page * pageSize, totalResults) : page * pageSize;
    return (
        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap" aria-live="polite">
            <div className="text-muted small">
                Pagina {page} • {from} – {to}
                {totalResults != null ? ` van ${totalResults}` : ""}
            </div>
            <div className="btn-group shadow-sm rounded-4 overflow-hidden">
                <button type="button" className="btn btn-outline-success btn-sm" onClick={onPrevious} disabled={page <= 1}>
                    Vorige
                </button>
                <button type="button" className="btn btn-success btn-sm" onClick={onNext} disabled={!hasNext}>
                    Volgende
                </button>
            </div>
        </div>
    );
};

export type DataTableColumn<T> = {
    readonly key: keyof T | string;
    readonly header: string;
    readonly sortable?: boolean;
    readonly render?: (row: T) => ReactNode;
    readonly getValue?: (row: T) => string | number | Date | null | undefined;
    readonly headerClassName?: string;
    readonly cellClassName?: string;
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

type SortState = { key: string; direction: "asc" | "desc" } | null;

const toPrimitive = (value: string | number | Date | null | undefined): string | number => {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    return value ?? "";
};

const sortRows = <T,>(rows: readonly T[], columns: readonly DataTableColumn<T>[], sort: SortState): readonly T[] => {
    if (!sort) return rows;
    const column = columns.find((col) => (col.key as string) === sort.key);
    if (!column) return rows;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows]
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
            const aValue = toPrimitive(column.getValue ? column.getValue(a.row) : (a.row as Record<string, unknown>)[column.key as string] as string | number | Date | null | undefined);
            const bValue = toPrimitive(column.getValue ? column.getValue(b.row) : (b.row as Record<string, unknown>)[column.key as string] as string | number | Date | null | undefined);
            const comparison = typeof aValue === "number" && typeof bValue === "number" ? aValue - bValue : nlCollator.compare(String(aValue), String(bValue));
            return comparison !== 0 ? comparison * factor : a.index - b.index;
        })
        .map((entry) => entry.row);
};

export function DataTable<T>({ columns, rows, totalResults, caption, empty, getRowKey, onRowClick, isRowInteractive }: DataTableProps<T>): JSX.Element {
    const [sort, setSort] = useState<SortState>(null);
    const sortedRows = useMemo(() => sortRows(rows, columns, sort), [rows, columns, sort]);

    const handleSort = (column: DataTableColumn<T>) => {
        if (!column.sortable) return;
        const key = column.key as string;
        setSort((prev) =>
            prev?.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
        );
    };

    if (!rows.length && empty) return <>{empty}</>;

    return (
        <div className="d-flex flex-column gap-2">
            <ResultBadge count={rows.length} total={totalResults} />
            <div className="card shadow-sm border border-success-subtle rounded-4 overflow-hidden">
                <div className="table-responsive" role="region">
                    <table className="table table-sm table-hover align-middle caption-top mb-0">
                        {caption && <caption className="text-muted small">{caption}</caption>}
                        <thead className="bg-success-subtle position-sticky top-0 z-2">
                            <tr>
                                {columns.map((column) => {
                                    const active = sort?.key === (column.key as string);
                                    const direction = active ? sort?.direction : null;
                                    const icon = !column.sortable
                                        ? null
                                        : active
                                        ? direction === "asc"
                                            ? "▲"
                                            : "▼"
                                        : "↕";
                                    const ariaSort = column.sortable
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
                                            className={cx("text-uppercase small text-success-emphasis", column.sortable && "user-select-none", column.headerClassName)}
                                            aria-sort={ariaSort}
                                        >
                                            {column.sortable ? (
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
                                return (
                                    <tr
                                        key={getRowKey(row, index)}
                                        className={cx(interactive && "cursor-pointer")}
                                        onClick={interactive && onRowClick ? () => onRowClick(row) : undefined}
                                        tabIndex={interactive ? 0 : undefined}
                                        onKeyDown={(event) => {
                                            if (!interactive || !onRowClick) return;
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                onRowClick(row);
                                            }
                                        }}
                                    >
                                        {columns.map((column) => (
                                            <td key={`${String(column.key)}-${index}`} className={column.cellClassName}>
                                                {column.render
                                                    ? column.render(row)
                                                    : ((row as Record<string, ReactNode>)[column.key as string] ?? "")}
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

export type ErrorBoundaryProps = { readonly children: ReactNode; readonly fallback?: ReactNode; readonly resetKey?: unknown };

type ErrorBoundaryState = { readonly hasError: boolean; readonly message?: string };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    override state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        return { hasError: true, message: (error as { message?: string })?.message };
    }

    override componentDidCatch(error: Error, info: ErrorInfo): void {
        void error;
        void info;
    }

    override componentDidUpdate(prevProps: Readonly<ErrorBoundaryProps>): void {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false, message: undefined });
        }
    }

    private readonly reset = () => this.setState({ hasError: false, message: undefined });

    override render(): ReactNode {
        const { children, fallback } = this.props;
        if (!this.state.hasError) return children;
        if (fallback) return fallback;
        return (
            <InlineAlert>
                <div className="d-flex flex-column gap-2">
                    <div>Er trad een fout op tijdens het laden van deze sectie.</div>
                    {this.state.message && <small className="text-muted">{this.state.message}</small>}
                    <button type="button" className="btn btn-success btn-sm align-self-start" onClick={this.reset}>
                        Opnieuw proberen
                    </button>
                </div>
            </InlineAlert>
        );
    }
}
