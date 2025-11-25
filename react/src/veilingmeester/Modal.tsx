import { useEffect, useId, useMemo, useRef, type JSX, type MouseEvent, type ReactNode } from "react";
import { cx } from "./utils";

// Base modal used across all Veilingmeester flows.
type ModalProps = {
    readonly title: ReactNode;
    readonly subtitle?: ReactNode;
    readonly children: ReactNode;
    readonly onClose: () => void;
    readonly footer?: ReactNode;
    readonly size?: "sm" | "md" | "lg" | "xl";
    readonly allowBackdropClose?: boolean;
    readonly controls?: ReactNode;
};

const focusSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

const dialogSizes: Record<NonNullable<ModalProps["size"]>, string> = {
    sm: "modal-sm",
    md: "",
    lg: "modal-lg",
    xl: "modal-xl",
};

export function Modal({
    title,
    subtitle,
    children,
    onClose,
    footer,
    size = "lg",
    allowBackdropClose = true,
    controls,
}: ModalProps): JSX.Element {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const focusables = useRef<HTMLElement[]>([]);
    const previousFocus = useRef<HTMLElement | null>(null);
    const headingId = useId();

    useEffect(() => {
        if (typeof document === "undefined") return;
        previousFocus.current = document.activeElement as HTMLElement | null;
        const node = dialogRef.current;
        focusables.current = node
            ? Array.from(node.querySelectorAll<HTMLElement>(focusSelectors)).filter((element) => element.offsetParent !== null)
            : [];
        (focusables.current[0] ?? node)?.focus({ preventScroll: true });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== "Tab" || focusables.current.length === 0) return;
            const [first, last] = [focusables.current[0], focusables.current[focusables.current.length - 1]];
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

    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!allowBackdropClose) return;
        if (event.target === event.currentTarget) onClose();
    };

    const renderHeader = useMemo(
        () => (
            <div className="modal-header bg-white position-sticky top-0 z-3 border-success-subtle flex-column align-items-start gap-1">
                <div className="d-flex w-100 align-items-start">
                    <div className="flex-grow-1">
                        <p className="text-uppercase small text-success-emphasis mb-1">{subtitle}</p>
                        <h2 className="modal-title h5 mb-0" id={headingId}>
                            {title}
                        </h2>
                    </div>
                    <button type="button" className="btn-close" aria-label="Sluiten" onClick={onClose} />
                </div>
                {controls && <div className="w-100 pt-2">{controls}</div>}
            </div>
        ),
        [controls, headingId, onClose, subtitle, title],
    );

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
                    <div ref={dialogRef} className="modal-content border border-success-subtle rounded-4 shadow-lg" tabIndex={-1}>
                        {renderHeader}

                        <div className="modal-body py-3">
                            <div className="d-flex flex-column gap-3">{children}</div>
                        </div>

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
