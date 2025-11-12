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
 *
 * @param props - Paging state and callbacks.
 */
export function Pager({ page, pageSize, hasNext, onPrevious, onNext, totalResults }: PagerProps): JSX.Element {
    const from = (page - 1) * pageSize + 1;
    const maxTo = from + pageSize - 1;
    const to = totalResults != null ? Math.min(page * pageSize, totalResults) : hasNext ? page * pageSize : maxTo;
    const summary = totalResults != null ? `• van ${totalResults} totaal` : "";
    return (
        <div className="d-flex align-items-center justify-content-between gap-2" aria-live="polite">
            <div className="text-muted small">
                Pagina {page} • {from} – {to} getoond {summary}
            </div>
            <div className="btn-group shadow-sm">
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={onPrevious}
                    disabled={page <= 1}
                >
                    Vorige
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onNext} disabled={!hasNext}>
                    Volgende
                </button>
            </div>
        </div>
    );
}
