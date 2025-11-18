import { useEffect, useId, useRef, type JSX, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { cx } from "./utils";

type ModalProps = {
    readonly title: ReactNode;
    readonly children: ReactNode;
    readonly onClose: () => void;
    readonly footer?: ReactNode;
    readonly size?: "sm" | "lg" | "xl";
};

const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

const dialogSizes: Record<NonNullable<ModalProps["size"]>, string> = {
    sm: "modal-sm",
    lg: "modal-lg",
    xl: "modal-xl",
};

export function Modal({ title, children, onClose, footer, size = "lg" }: ModalProps): JSX.Element {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const previousFocus = useRef<HTMLElement | null>(null);
    const headingId = useId();

    useEffect(() => {
        if (typeof document === "undefined") return;
        previousFocus.current = document.activeElement as HTMLElement | null;
        const node = dialogRef.current;
        const focusables = node
            ? Array.from(node.querySelectorAll<HTMLElement>(focusableSelectors)).filter((el) => el.offsetParent !== null)
            : [];
        (focusables[0] ?? node)?.focus({ preventScroll: true });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== "Tab" || !focusables.length) return;
            const [first, last] = [focusables[0], focusables[focusables.length - 1]];
            if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previousFocus.current?.focus({ preventScroll: true });
        };
    }, [onClose]);

    const handleBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
    };

    return (
        <>
            <div className="modal-backdrop fade show" />
            <div
                className="modal fade show d-block"
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                onMouseDown={handleBackdropClick}
            >
                <div className={cx("modal-dialog modal-dialog-scrollable", dialogSizes[size])}>
                    <div
                        ref={dialogRef}
                        className="modal-content border border-success-subtle rounded-4 shadow-lg"
                        tabIndex={-1}
                    >
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
