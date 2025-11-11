import React, {
    memo,
    useCallback,
    type Dispatch,
    type SetStateAction,
    type ReactNode,
} from 'react';

/* Beschikbare paginagroottes voor lijsten. */
export const SIZES = [10, 25, 50, 100] as const;

/*  Formulieren  */

type SearchInputProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

/* Klein zoekveld met label. */
export const SearchInput: React.FC<SearchInputProps> = memo(
    ({ id, label, value, onChange, placeholder }) => (
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
                autoComplete="off"
            />
        </div>
    ),
);
SearchInput.displayName = 'SearchInput';

type SelectSmProps = {
    id: string;
    label?: string;
    value: number;
    onChange: (value: number) => void;
    values?: readonly number[];
};

/* Compacte keuzelijst (bijv. aantal items per pagina). */
export const SelectSm: React.FC<SelectSmProps> = memo(
    ({ id, label, value, onChange, values = SIZES }) => (
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
    ),
);
SelectSm.displayName = 'SelectSm';

/*  Algemene UI  */

/* Skeleton die getoond wordt tijdens het laden van inhoud. */
export const Loading: React.FC = memo(() => (
    <div
        className="placeholder-glow"
        aria-live="polite"
        aria-busy="true"
        role="status"
    >
        <div className="placeholder col-12 mb-2" />
        <div className="placeholder col-10 mb-2" />
        <div className="placeholder col-8" />
    </div>
));
Loading.displayName = 'Loading';

type PagerProps = {
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    hasNext: boolean;
    loading?: boolean;
    total?: number;
};

/* Navigatieknoppen voor vorige/volgende pagina met paginanummer. */
export const Pager: React.FC<PagerProps> = memo(
    ({ page, setPage, hasNext, loading = false, total }) => {
        const prevDisabled = loading || page <= 1;
        const nextDisabled = loading || !hasNext;

        const goPrev = useCallback(
            () => setPage(p => Math.max(1, p - 1)),
            [setPage],
        );
        const goNext = useCallback(
            () => setPage(p => p + 1),
            [setPage],
        );

        return (
            <div
                className="d-flex justify-content-between align-items-center mt-3"
                aria-live="polite"
            >
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
                    {typeof total === 'number' && (
                        <span className="ms-2">• {total} getoond</span>
                    )}
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
    },
);
Pager.displayName = 'Pager';

type EmptyProps = { label?: string };

/* Weergave wanneer er geen resultaten zijn. */
export const Empty: React.FC<EmptyProps> = memo(
    ({ label = 'Geen resultaten.' }) => (
        <div
            className="text-center text-muted py-5"
            role="status"
            aria-live="polite"
            aria-label="geen resultaten"
        >
            <div className="display-6 mb-2" aria-hidden="true">
                🌿
            </div>
            <p className="m-0">{label}</p>
        </div>
    ),
);
Empty.displayName = 'Empty';

type FilterChipProps = {
    children: ReactNode;
    onClear: () => void;
    title?: string;
};

/* Filterchip met tekst en verwijderknop. */
export const FilterChip: React.FC<FilterChipProps> = memo(
    ({ children, onClear, title }) => (
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
                aria-label={
                    title ? `Verwijder filter: ${title}` : 'Verwijder filter'
                }
            >
                ×
            </button>
        </span>
    ),
);
FilterChip.displayName = 'FilterChip';
