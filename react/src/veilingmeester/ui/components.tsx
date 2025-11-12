import {
    memo,
    forwardRef,
    useCallback,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
    type ForwardedRef,
    type ReactElement,
    type RefAttributes,
} from "react";
import { PAGE_SIZE_OPTIONS } from "../config";

/* utils */
const cx = (...c: Array<string | undefined | false>) => c.filter(Boolean).join(" ");
const noop = () => {};

/* shared field wrapper */
type FieldProps = { id: string; label?: string; className?: string; children: ReactNode };
const Field = ({ id, label, className, children }: FieldProps) => (
    <div className={cx("mb-2", className)}>
        {label && (
            <label htmlFor={id} className="form-label mb-1">
                {label}
            </label>
        )}
        {children}
    </div>
);

/* SearchInput */
export type SearchInputProps = {
    id: string;
    label: string;
    value: string;
    onChange?: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};
export const SearchInput = memo(
    forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
        { id, label, value, onChange = noop, placeholder, disabled, className },
        ref
    ) {
        return (
            <Field id={id} label={label} className={className}>
                <input
                    ref={ref}
                    id={id}
                    type="search"
                    className="form-control form-control-sm"
                    value={value}
                    onChange={(e) => onChange(e.currentTarget.value)}
                    placeholder={placeholder}
                    inputMode="search"
                    aria-label={label}
                    autoComplete="off"
                    disabled={disabled}
                />
            </Field>
        );
    })
);
SearchInput.displayName = "SearchInput";

/* ----- Generic Select (type-safe, geen any) ----- */
export type SelectProps<T extends string | number> = {
    id: string;
    label?: string;
    value: T;
    onChange: (v: T) => void;
    options: readonly T[];
    ariaLabel?: string;
    disabled?: boolean;
    className?: string;
    /** optioneel: eigen parser string -> T */
    parse?: (raw: string) => T;
};

function SelectInner<T extends string | number>(
    { id, label, value, onChange, options, ariaLabel, disabled, className, parse }: SelectProps<T>,
    ref: ForwardedRef<HTMLSelectElement>
) {
    const toT = (raw: string): T =>
        parse ? parse(raw) : (typeof value === "number" ? (Number(raw) as T) : (raw as T));

    return (
        <Field id={id} label={label} className={className}>
            <select
                ref={ref}
                id={id}
                className="form-select form-select-sm"
                value={String(value)}
                onChange={(e) => onChange(toT(e.currentTarget.value))}
                aria-label={ariaLabel ?? label ?? "select"}
                disabled={disabled}
            >
                {options.map((opt) => (
                    <option key={String(opt)} value={String(opt)}>
                        {String(opt)}
                    </option>
                ))}
            </select>
        </Field>
    );
}

// typed component signature that preserves generics + displayName
interface SelectComponent {
    <T extends string | number>(
        props: SelectProps<T> & RefAttributes<HTMLSelectElement>
    ): ReactElement | null;
    displayName?: string;
}

export const Select = memo(forwardRef(SelectInner)) as SelectComponent;
Select.displayName = "Select";

/* Specialisaties */
export const SelectSm = (
    p: Omit<SelectProps<number>, "options" | "parse"> & { options?: readonly number[] }
) => <Select<number> {...p} options={p.options ?? PAGE_SIZE_OPTIONS} parse={(s) => Number(s)} />;

export type StatusFilter = "alle" | "actief" | "inactief";
export const SelectStatusSm = (
    p: Omit<SelectProps<StatusFilter>, "options" | "ariaLabel" | "parse">
) => (
    <Select<StatusFilter>
        {...p}
        options={["alle", "actief", "inactief"] as const}
        ariaLabel={p.label ?? "Status"}
    />
);

/* Loading skeleton */
export const Loading = memo(function Loading() {
    return (
        <div className="placeholder-glow" aria-live="polite" aria-busy="true" role="status" aria-label="Laden…">
            <div className="placeholder col-12 mb-2" />
            <div className="placeholder col-10 mb-2" />
            <div className="placeholder col-8" />
        </div>
    );
});
Loading.displayName = "Loading";

/* Pager */
export type PagerProps = {
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    hasNext: boolean;
    loading?: boolean;
    total?: number;
    className?: string;
};
export const Pager = memo(function Pager({
                                             page,
                                             setPage,
                                             hasNext,
                                             loading = false,
                                             total,
                                             className,
                                         }: PagerProps) {
    const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), [setPage]);
    const next = useCallback(() => setPage((p) => p + 1), [setPage]);
    const prevDisabled = loading || page <= 1;
    const nextDisabled = loading || !hasNext;

    return (
        <div className={cx("d-flex justify-content-between align-items-center mt-3", className)} aria-live="polite">
            <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={prev}
                disabled={prevDisabled}
                aria-label="Vorige pagina"
            >
                ← Vorige
            </button>
            <div className="small text-muted">
                Pagina {page}
                {typeof total === "number" && <span className="ms-2">• {total} getoond</span>}
            </div>
            <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={next}
                disabled={nextDisabled}
                aria-label="Volgende pagina"
            >
                Volgende →
            </button>
        </div>
    );
});
Pager.displayName = "Pager";

/* Empty */
export const Empty = memo(function Empty({
                                             label = "Geen resultaten.",
                                             className,
                                         }: {
    label?: string;
    className?: string;
}) {
    return (
        <div className={cx("text-center text-muted py-5", className)} role="status" aria-live="polite" aria-label="geen resultaten">
            <div className="display-6 mb-2" aria-hidden="true">
                🌿
            </div>
            <p className="m-0">{label}</p>
        </div>
    );
});
Empty.displayName = "Empty";

/* FilterChip */
export const FilterChip = memo(function FilterChip({
                                                       children,
                                                       onClear,
                                                       title,
                                                       className,
                                                       disabled,
                                                   }: {
    children: ReactNode;
    onClear: () => void;
    title?: string;
    className?: string;
    disabled?: boolean;
}) {
    return (
        <span
            className={cx(
                "badge rounded-pill bg-success-subtle text-success border d-inline-flex align-items-center gap-2 border-success-subtle",
                className
            )}
            title={title}
        >
      <span className="ps-2 text-truncate" style={{ maxWidth: 240 }}>
        {children}
      </span>
      <button
          type="button"
          className="btn btn-sm btn-link text-success py-0 pe-2"
          onClick={onClear}
          aria-label={title ? `Verwijder filter: ${title}` : "Verwijder filter"}
          disabled={disabled}
      >
        ×
      </button>
    </span>
    );
});
FilterChip.displayName = "FilterChip";
