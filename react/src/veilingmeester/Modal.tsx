import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { cx } from "./utils/classNames";

type ModalProps = {
    readonly title: ReactNode;
    readonly children: ReactNode;
    readonly onClose: () => void;
    readonly footer?: ReactNode;
    readonly size?: "sm" | "lg" | "xl";
};

const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Accessible modal dialog with focus management and Bootstrap styling.
 *
 * @param props - Modal properties including content, heading en afsluit-actie.
 */
export function Modal({ title, children, onClose, footer, size = "lg" }: ModalProps): JSX.Element {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const headingId = useId();

    useEffect(() => {
        if (typeof document === "undefined") {
            return undefined;
        }
        previouslyFocused.current = document.activeElement as HTMLElement | null;
        const node = dialogRef.current;
        const query = () =>
            node
                ? Array.from(node.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
                      (element) => element.offsetParent !== null || element === node,
                  )
                : [];
        const focusables = query();
        (focusables[0] ?? node)?.focus({ preventScroll: true });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== "Tab") {
                return;
            }
            const list = query();
            if (list.length === 0) {
                event.preventDefault();
                return;
            }
            const firstEl = list[0];
            const lastEl = list[list.length - 1];
            if (!event.shiftKey && document.activeElement === lastEl) {
                event.preventDefault();
                firstEl.focus();
            } else if (event.shiftKey && document.activeElement === firstEl) {
                event.preventDefault();
                lastEl.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocused.current?.focus({ preventScroll: true });
        };
    }, [onClose]);

    const handleBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const dialogClass = cx(
        "modal-dialog modal-dialog-scrollable",
        size === "lg" && "modal-lg",
        size === "xl" && "modal-xl",
        size === "sm" && "modal-sm",
    );

    return (
        <>
            <div className="modal-backdrop fade show" />
            <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby={headingId} onMouseDown={handleBackdropClick}>
                <div className={dialogClass}>
                    <div className="modal-content border border-success-subtle rounded-4 shadow-lg" ref={dialogRef} tabIndex={-1}>
                        <div className="modal-header bg-white position-sticky top-0 z-3 border-success-subtle">
                            <h2 className="modal-title h5 mb-0" id={headingId}>
                                {title}
                            </h2>
                            <button type="button" className="btn-close" aria-label="Sluiten" onClick={onClose} />
                        </div>
                        <div className="modal-body py-3">{children}</div>
                        {footer && (
                            <div className="modal-footer bg-white position-sticky bottom-0 z-3 d-flex justify-content-end border-success-subtle">
                                {footer}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
