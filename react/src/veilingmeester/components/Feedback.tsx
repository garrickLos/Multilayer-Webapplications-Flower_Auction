import type {JSX, ReactNode } from "react";

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
        <div
            className={`alert alert-${variant} py-2 px-3 shadow-sm rounded-4 border-0 mb-0`}
            role="alert"
        >
            {children}
        </div>
    );
}
