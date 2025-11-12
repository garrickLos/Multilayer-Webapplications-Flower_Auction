import type { MouseEvent as ReactMouseEvent, ReactElement, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cx } from "./components";

type ModalProps = {
    title: string;
    children: ReactNode;
    onClose: () => void;
    footer?: ReactNode;
    size?: "sm" | "lg" | "xl";
};

const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(",");

export function Modal({ title, children, onClose, footer, size = "lg" }: ModalProps): ReactElement {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (typeof document === "undefined") return;
        previouslyFocused.current = document.activeElement as HTMLElement | null;
        const node = containerRef.current;
        const query = () =>
            node
                ? Array.from(node.querySelectorAll<HTMLElement>(focusableSelectors)).filter((el) => el.offsetParent !== null)
                : [];
        const current = query();
        (current[0] ?? node)?.focus({ preventScroll: true });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== "Tab") return;
            const list = query();
            if (list.length === 0) return;
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
            previouslyFocused.current?.focus();
        };
    }, [onClose]);

    const handleBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const dialogClass = cx("modal-dialog modal-dialog-scrollable", size === "lg" && "modal-lg", size === "xl" && "modal-xl", size === "sm" && "modal-sm");

    return (
        <>
            <div className="modal-backdrop show" />
            <div className="modal show d-block" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
                <div className={dialogClass}>
                    <div className="modal-content border-0 rounded-4 shadow">
                        <div className="modal-header sticky-top bg-white" style={{ top: 0, zIndex: 5 }}>
                            <h2 className="modal-title h5 mb-0">{title}</h2>
                            <button type="button" className="btn-close" aria-label="Sluiten" onClick={onClose} />
                        </div>
                        <div className="modal-body" ref={containerRef} tabIndex={-1}>
                            {children}
                        </div>
                        {footer && (
                            <div className="modal-footer bg-white" style={{ position: "sticky", bottom: 0, zIndex: 5 }}>
                                {footer}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

