import React, { memo, useCallback } from 'react';

/**
 * Available page sizes for lists.  Exported as a constant so callers can
 * reference the same set of values without redefining them.
 */
export const SIZES = [10, 25, 50, 100] as const;

/* --------------------------------------------------------------------------
 * Form controls
 *
 * Lightweight controlled form components with sensible default props and
 * accessibility attributes.  Components are memoised to avoid unnecessary
 * re‑renders when parent props haven't changed.
 */

type SearchInputProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

/**
 * A small search input with label.  The `inputMode="search"` attribute hints
 * to mobile browsers to show the appropriate keyboard.  The component is
 * memoised to prevent re-renders when props are stable.
 */
export const SearchInput: React.FC<SearchInputProps> = memo(({ id, label, value, onChange, placeholder }) => (
    <div className="mb-2">
        <label htmlFor={id} className="form-label mb-1">
            {label}
        </label>
        <input
            id={id}
            className="form-control form-control-sm"
            value={value}
            onChange={e => onChange(e.currentTarget.value)}
            placeholder={placeholder}
            inputMode="search"
            aria-label={label}
        />
    </div>
));
SearchInput.displayName = 'SearchInput';

type SelectSmProps = {
    id: string;
    label?: string;
    value: number;
    onChange: (value: number) => void;
    values?: readonly number[];
};

/**
 * A compact select control with optional label.  Accepts a list of numeric
 * options (defaults to `SIZES`).  The `onChange` handler receives a number
 * rather than the native string.  Memoised for performance.
 */
export const SelectSm: React.FC<SelectSmProps> = memo(({ id, label, value, onChange, values = SIZES }) => (
    <div className="mb-2">
        {label && (
            <label htmlFor={id} className="form-label mb-1">
                {label}
            </label>
        )}
        <select
            id={id}
            className="form-select form-select-sm"
            value={value}
            onChange={e => onChange(Number(e.currentTarget.value))}
            aria-label={label || 'Per pagina'}
        >
            {values.map(n => (
                <option key={n} value={n}>
                    {n}
                </option>
            ))}
        </select>
    </div>
));
SelectSm.displayName = 'SelectSm';

/* --------------------------------------------------------------------------
 * Generic UI fragments
 *
 * Simple components for loading indicators, pagination, empty states and
 * filter chips.  These are all memoised to avoid re-rendering unless their
 * props change.
 */

/**
 * Placeholder skeleton used while content is loading.  Uses Bootstrap
 * placeholder classes to show grey blocks.  The container has
 * `aria-busy="true"` so assistive technologies are informed that content is
 * being loaded.
 */
export const Loading: React.FC = memo(() => (
    <div className="placeholder-glow" aria-live="polite" aria-busy="true">
        <div className="placeholder col-12 mb-2" />
        <div className="placeholder col-10 mb-2" />
        <div className="placeholder col-8" />
    </div>
));
Loading.displayName = 'Loading';

type PagerProps = {
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    hasNext: boolean;
    loading?: boolean;
    total?: number;
};

/**
 * Simple pagination control with previous/next buttons and a page indicator.  It
 * disables the buttons appropriately when loading or when there is no
 * previous/next page.  `aria-live` and `aria-label` attributes improve
 * accessibility.
 */
export const Pager: React.FC<PagerProps> = memo(({ page, setPage, hasNext, loading = false, total }) => {
    const prevDisabled = loading || page <= 1;
    const nextDisabled = loading || !hasNext;
    // Use callbacks to avoid creating new functions on every render
    const goPrev = useCallback(() => setPage(p => Math.max(1, p - 1)), [setPage]);
    const goNext = useCallback(() => setPage(p => p + 1), [setPage]);
    return (
        <div className="d-flex justify-content-between align-items-center mt-3" aria-live="polite">
            <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={goPrev}
                disabled={prevDisabled}
                aria-label="Vorige pagina"
            >
                ← Vorige
            </button>
            <div className="small text-muted">
                Pagina {page}
                {typeof total === 'number' && <span className="ms-2">• {total} getoond</span>}
            </div>
            <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={goNext}
                disabled={nextDisabled}
                aria-label="Volgende pagina"
            >
                Volgende →
            </button>
        </div>
    );
});
Pager.displayName = 'Pager';

type EmptyProps = { label?: string };

/**
 * Rendered when there are no results.  Shows a decorative icon and a
 * message.  `aria-live` notifies screen readers when the empty state is
 * presented.
 */
export const Empty: React.FC<EmptyProps> = memo(({ label = 'Geen resultaten.' }) => (
    <div className="text-center text-muted py-5" role="status" aria-live="polite" aria-label="geen resultaten">
        <div className="display-6 mb-2" aria-hidden="true">
            🌿
        </div>
        <p className="m-0">{label}</p>
    </div>
));
Empty.displayName = 'Empty';

type FilterChipProps = {
    children: React.ReactNode;
    onClear: () => void;
    title?: string;
};

/**
 * A pill‑shaped filter chip that displays arbitrary children and a clear (×)
 * button.  The clear button is accessible and does not propagate clicks
 * elsewhere.  Memoised for performance.
 */
export const FilterChip: React.FC<FilterChipProps> = memo(({ children, onClear, title }) => (
    <span
        className="badge rounded-pill bg-success-subtle text-success border d-inline-flex align-items-center gap-2 border-success-subtle"
        title={title}
    >
        <span className="ps-2 text-truncate" style={{ maxWidth: 240 }}>
            {children}
        </span>
        <button
            type="button"
            className="btn btn-sm btn-link text-success py-0 pe-2"
            onClick={onClear}
            aria-label="Verwijder filter"
        >
            ×
        </button>
    </span>
));
FilterChip.displayName = 'FilterChip';