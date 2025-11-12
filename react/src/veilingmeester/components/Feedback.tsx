import type { ReactNode } from "react";

/**
 * Skeleton-like placeholder using Bootstrap placeholders.
 *
 * @returns Placeholder UI.
 */
export function LoadingPlaceholder(): JSX.Element {
    return (
        <div className="d-flex flex-column gap-2" role="status" aria-live="polite">
            <div className="placeholder-glow">
                <div className="placeholder col-12 rounded-4 py-3 mb-2" />
                <div className="placeholder col-10 rounded-4 py-3 mb-2" />
                <div className="placeholder col-8 rounded-4 py-3" />
            </div>
        </div>
    );
}

/**
 * Accessible empty state presentation.
 *
 * @param props - Contains the uitlegtekst.
 */
export function EmptyState({ message }: { readonly message: string }): JSX.Element {
    return (
        <div className="text-center text-muted py-5" role="status" aria-live="polite">
            <div className="fs-1 mb-2" aria-hidden="true">
                🌱
            </div>
            <p className="mb-0">{message}</p>
        </div>
    );
}

/**
 * Inline alert for contextual messaging.
 *
 * @param props - Alert properties including variant en inhoud.
 */
export function InlineAlert({
    variant = "danger",
    children,
}: {
    readonly variant?: "danger" | "warning" | "info";
    readonly children: ReactNode;
}): JSX.Element {
    return (
        <div className={`alert alert-${variant} py-2 px-3 shadow-sm mb-0`} role="alert">
            {children}
        </div>
    );
}
