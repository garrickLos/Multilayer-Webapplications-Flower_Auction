/* eslint-disable react-refresh/only-export-components */
import type { ChangeEvent, ReactElement, ReactNode } from "react";
import { useId } from "react";
import type { Status } from "./types";
import { statusBadgeVariant, statusLabel } from "./types";

export function cx(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

type Option<T extends string | number> = { value: T; label: string };

type SelectProps<T extends string | number> = {
    id?: string;
    label?: string;
    value: T;
    options: readonly Option<T>[];
    onChange: (value: T) => void;
    ariaLabel?: string;
    disabled?: boolean;
    className?: string;
    parse?: (raw: string) => T;
};

export function Select<T extends string | number>(props: SelectProps<T>): ReactElement {
    const { id: providedId, label, value, options, onChange, ariaLabel, disabled, className, parse } = props;
    const generatedId = useId();
    const selectId = providedId ?? generatedId;

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const raw = event.target.value;
        const parsed = parse ? parse(raw) : (typeof value === "number" ? (Number(raw) as T) : (raw as T));
        onChange(parsed);
    };

    return (
        <div className={className}>
            {label && (
                <label htmlFor={selectId} className="form-label small text-uppercase text-muted mb-1">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className="form-select form-select-sm"
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

export function SelectSm<T extends string | number>(props: SelectProps<T>): ReactElement {
    return <Select {...props} />;
}

export function SelectStatusSm(
    props: Omit<SelectProps<"alle" | "actief" | "inactief">, "options" | "parse">,
): ReactElement {
    return (
        <Select
            {...props}
            options={[
                { value: "alle", label: "Alle statussen" },
                { value: "actief", label: "Actief" },
                { value: "inactief", label: "Inactief" },
            ]}
        />
    );
}

type SearchInputProps = {
    id?: string;
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
};

export function SearchInput({ id, label, value, onChange, placeholder, autoFocus }: SearchInputProps): ReactElement {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
        <div>
            {label && (
                <label htmlFor={inputId} className="form-label small text-uppercase text-muted mb-1">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                type="search"
                className="form-control form-control-sm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                aria-label={label ?? placeholder ?? "Zoeken"}
            />
        </div>
    );
}

export function Loading(): ReactElement {
    return (
        <div className="placeholder-glow">
            <div className="placeholder col-12 mb-2" style={{ height: 32 }} />
            <div className="placeholder col-10 mb-2" style={{ height: 32 }} />
            <div className="placeholder col-8" style={{ height: 32 }} />
        </div>
    );
}

export function Empty({ message }: { message: string }): ReactElement {
    return (
        <div className="text-center text-muted py-5" role="status">
            <div className="display-6">🌱</div>
            <p className="mb-0">{message}</p>
        </div>
    );
}

type PagerProps = {
    page: number;
    pageSize: number;
    hasNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
    totalResults?: number;
};

export function Pager({ page, pageSize, hasNext, onPrevious, onNext, totalResults }: PagerProps): ReactElement {
    const from = (page - 1) * pageSize + 1;
    const maxTo = from + pageSize - 1;
    const to = totalResults != null ? Math.min(page * pageSize, totalResults) : hasNext ? page * pageSize : maxTo;
    const summary = totalResults != null ? `• van ${totalResults} totaal` : "";
    return (
        <div className="d-flex align-items-center justify-content-between gap-2" aria-live="polite">
            <div className="text-muted small">
                Pagina {page} • {from} – {to} getoond {summary}
            </div>
            <div className="btn-group">
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={onPrevious}
                    disabled={page <= 1}
                >
                    Vorige
                </button>
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={onNext}
                    disabled={!hasNext}
                >
                    Volgende
                </button>
            </div>
        </div>
    );
}

type FilterChipProps = {
    label: string;
    onRemove: () => void;
};

export function FilterChip({ label, onRemove }: FilterChipProps): ReactElement {
    return (
        <span className="badge text-bg-light border d-inline-flex align-items-center gap-2">
            <span>{label}</span>
            <button
                type="button"
                className="btn btn-link p-0 text-decoration-none"
                onClick={onRemove}
                aria-label={`${label} verwijderen`}
            >
                ×
            </button>
        </span>
    );
}

type StatusBadgeProps = {
    status: Status;
};

export function StatusBadge({ status }: StatusBadgeProps): ReactElement {
    return <span className={cx("badge", statusBadgeVariant(status))}>{statusLabel(status)}</span>;
}

export function ResultBadge({ count, total }: { count: number; total?: number }): ReactElement {
    const base = count === 1 ? "1 resultaat" : `${count} resultaten`;
    const suffix = total != null ? ` • van ${total} totaal` : "";
    return (
        <span className="badge text-bg-secondary" aria-live="polite">
            {base}
            {suffix}
        </span>
    );
}

export function Alert({ variant = "danger", children }: { variant?: "danger" | "warning" | "info"; children: ReactNode }): ReactElement {
    return <div className={`alert alert-${variant}`} role="alert">{children}</div>;
}

