import type { ChangeEvent, ReactElement, ReactNode } from "react";
import { memo } from "react";

export const cx = (...classes: Array<string | false | null | undefined>): string =>
    classes.filter(Boolean).join(" ");

export type SelectOption<T extends string | number> = {
    value: T;
    label: string;
};

type BaseSelectProps<T extends string | number> = {
    id: string;
    label: string;
    value: T;
    onChange: (value: T) => void;
    options: ReadonlyArray<SelectOption<T>>;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    size?: "sm" | "lg";
    ariaDescribedBy?: string;
    parse?: (value: string) => T;
};

export function Select<T extends string | number>({
    id,
    label,
    value,
    onChange,
    options,
    placeholder,
    disabled,
    required,
    className,
    size,
    ariaDescribedBy,
    parse,
}: BaseSelectProps<T>): ReactElement {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const raw = event.target.value;
        const next = parse ? parse(raw) : (typeof value === "number" ? (Number(raw) as T) : (raw as T));
        onChange(next);
    };

    return (
        <div className={className}>
            <label htmlFor={id} className="form-label mb-1 small text-uppercase fw-semibold text-secondary">
                {label}
            </label>
            <select
                id={id}
                className={cx("form-select", size === "sm" && "form-select-sm")}
                value={String(value)}
                onChange={handleChange}
                disabled={disabled}
                required={required}
                aria-describedby={ariaDescribedBy}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export type SelectSmProps<T extends string | number> = Omit<BaseSelectProps<T>, "size">;

export function SelectSm<T extends string | number>(props: SelectSmProps<T>): ReactElement {
    return <Select {...props} size="sm" />;
}

const STATUS_OPTIONS: ReadonlyArray<SelectOption<"alle" | "actief" | "inactief">> = [
    { value: "alle", label: "Alle statussen" },
    { value: "actief", label: "Alleen actieve" },
    { value: "inactief", label: "Inactieve" },
];

type SelectStatusSmProps = {
    id: string;
    value: "alle" | "actief" | "inactief";
    onChange: (value: "alle" | "actief" | "inactief") => void;
    className?: string;
};

export function SelectStatusSm({ id, value, onChange, className }: SelectStatusSmProps): ReactElement {
    return (
        <SelectSm
            id={id}
            label="Status"
            value={value}
            onChange={onChange}
            options={STATUS_OPTIONS}
            className={className}
        />
    );
}

type SearchInputProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function SearchInput({ id, label, value, onChange, placeholder, className }: SearchInputProps): ReactElement {
    return (
        <div className={className}>
            <label htmlFor={id} className="form-label mb-1 small text-uppercase fw-semibold text-secondary">
                {label}
            </label>
            <input
                id={id}
                type="search"
                className="form-control form-control-sm"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

type LoadingProps = {
    text?: string;
};

export const Loading = memo(function Loading({ text = "Gegevens laden…" }: LoadingProps): ReactElement {
    return (
        <div className="placeholder-glow py-5 text-center" role="status" aria-live="polite">
            <div className="placeholder col-6 placeholder-lg" />
            <p className="mt-3 text-muted small">{text}</p>
        </div>
    );
});

type EmptyProps = {
    title: string;
    children?: ReactNode;
};

export const Empty = memo(function Empty({ title, children }: EmptyProps): ReactElement {
    return (
        <div className="text-center py-5" role="status" aria-live="polite">
            <div className="display-6" aria-hidden="true">
                🌸
            </div>
            <p className="mt-2 fw-semibold text-secondary">{title}</p>
            {children && <p className="text-muted small mb-0">{children}</p>}
        </div>
    );
});

type PagerProps = {
    page: number;
    pageSize: number;
    rowCount: number;
    totalResults?: number;
    hasNext: boolean;
    loading: boolean;
    onPrev: () => void;
    onNext: () => void;
};

function plural(count: number, singular: string, pluralLabel: string): string {
    return count === 1 ? `${count} ${singular}` : `${count} ${pluralLabel}`;
}

export const Pager = memo(function Pager({
    page,
    pageSize,
    rowCount,
    totalResults,
    hasNext,
    loading,
    onPrev,
    onNext,
}: PagerProps): ReactElement {
    const shownRaw = rowCount + (page - 1) * pageSize;
    const shown = totalResults != null ? Math.min(shownRaw, totalResults) : shownRaw;
    const countLabel = totalResults != null
        ? `${plural(rowCount, "resultaat", "resultaten")} • ${shown} van ${totalResults}`
        : plural(rowCount, "resultaat", "resultaten");

    return (
        <div className="d-flex align-items-center justify-content-between gap-3 mt-3">
            <div className="small text-muted" aria-live="polite">
                Pagina {page} • {countLabel}
            </div>
            <div className="btn-group">
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={onPrev}
                    disabled={loading || page <= 1}
                >
                    Vorige
                </button>
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={onNext}
                    disabled={loading || !hasNext}
                >
                    Volgende
                </button>
            </div>
        </div>
    );
});

type FilterChipProps = {
    children: ReactNode;
    onClear: () => void;
    title?: string;
};

export const FilterChip = memo(function FilterChip({ children, onClear, title }: FilterChipProps): ReactElement {
    return (
        <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-2"
            onClick={onClear}
            aria-label={title ? `${title} verwijderen` : "Filter verwijderen"}
        >
            <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">
                ✕
            </span>
            <span>{children}</span>
        </button>
    );
});

export type AlertProps = {
    variant?: "danger" | "warning" | "info";
    children: ReactNode;
    id?: string;
};

export function InlineAlert({ variant = "danger", children, id }: AlertProps): ReactElement {
    return (
        <div className={`alert alert-${variant}`} role="alert" id={id}>
            {children}
        </div>
    );
}
