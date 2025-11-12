import React, {
    memo,
    useEffect,
    useId,
    useRef,
    useCallback,
    useMemo,
    type CSSProperties,
    type ReactNode,
    type ReactElement,
} from "react";
import { createPortal } from "react-dom";

export type ModalProps = {
    title: ReactNode;
    children: ReactNode;
    onClose: () => void;

    size?: "sm" | "lg" | "xl";
    fullscreenUntil?: "sm" | "md" | "lg" | "xl" | "xxl";
    maxWidthPx?: number;

    /** Selector dat initieel focus krijgt. Default: sluitknop. */
    autoFocusSelector?: string;

    /** Toetsenbord/overlay gedrag */
    closeOnEsc?: boolean;          // default: true
    closeOnBackdrop?: boolean;     // default: true
    returnFocus?: boolean;         // default: true

    /** A11y */
    ariaDescription?: string;      // optionele beschrijvingstekst (wordt aan aria-describedby gehangen)

    /** Portal target (default: document.body) */
    container?: HTMLElement | null;
};

const hasDOM = typeof window !== "undefined" && typeof document !== "undefined";

/* kleine utils */
// const classes = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const getScrollbarWidth = () =>
    hasDOM ? Math.abs(window.innerWidth - document.documentElement.clientWidth) : 0;

function ModalComponent({
                            title,
                            children,
                            onClose,
                            size,
                            fullscreenUntil = "sm",
                            maxWidthPx,
                            autoFocusSelector = "button.btn-close",
                            closeOnEsc = true,
                            closeOnBackdrop = true,
                            returnFocus = true,
                            ariaDescription,
                            container,
                        }: ModalProps): ReactElement {
    const id = useId();
    const titleId = `${id}-title`;
    const descId = ariaDescription ? `${id}-desc` : undefined;

    const portalRoot = hasDOM ? (container ?? document.body) : null;
    const prevFocus = useRef<HTMLElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const dialogClass = useMemo(() => {
        const base = ["modal-dialog", "modal-dialog-centered", "modal-dialog-scrollable"];
        if (fullscreenUntil) base.push(`modal-fullscreen-${fullscreenUntil}-down`);
        if (size) base.push(`modal-${size}`);
        return base.join(" ");
    }, [size, fullscreenUntil]);

    const dialogStyle = useMemo<CSSProperties | undefined>(
        () => (maxWidthPx ? { maxWidth: `min(98vw, ${maxWidthPx}px)` } : undefined),
        [maxWidthPx]
    );

    // Focus trap helpers
    const focusFirst = useCallback(() => {
        const root = contentRef.current;
        if (!root) return;
        const target =
            (autoFocusSelector && root.querySelector<HTMLElement>(autoFocusSelector)) ||
            root.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
        (target ?? root).focus?.();
    }, [autoFocusSelector]);

    const trapTab = useCallback((e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const root = contentRef.current;
        if (!root) return;

        const nodes = Array.from(
            root.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

        if (nodes.length === 0) {
            e.preventDefault();
            (root as HTMLElement).focus?.();
            return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        } else if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        }
    }, []);

    // Body scroll lock + key handlers + focus management
    useEffect(() => {
        if (!hasDOM) return;

        // Save previous focus
        prevFocus.current = (document.activeElement as HTMLElement) ?? null;

        // Scroll lock with scrollbar compensation
        const prevOverflow = document.body.style.overflow;
        const prevPaddingRight = document.body.style.paddingRight;
        const sw = getScrollbarWidth();
        document.body.style.overflow = "hidden";
        if (sw > 0) {
            // voorkom layout shift door wegvallende scrollbar
            document.body.style.paddingRight = `${sw}px`;
        }

        const keydown = (e: KeyboardEvent) => {
            if (e.key === "Tab") trapTab(e);
            if (closeOnEsc && e.key === "Escape") {
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener("keydown", keydown);

        // Initial focus na paint
        const raf = window.requestAnimationFrame(focusFirst);

        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener("keydown", keydown);
            // restore scroll lock
            document.body.style.overflow = prevOverflow;
            document.body.style.paddingRight = prevPaddingRight;
            // restore focus
            if (returnFocus) prevFocus.current?.focus?.();
        };
    }, [closeOnEsc, onClose, trapTab, focusFirst, returnFocus]);

    // Backdrop click (alleen als click exact op overlay)
    const onOverlayMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!closeOnBackdrop) return;
            if (e.target === e.currentTarget) onClose();
        },
        [closeOnBackdrop, onClose]
    );

    const modalNode = (
        <div
            ref={overlayRef}
            className="modal show d-block"
            style={{ zIndex: 1055 }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            onMouseDown={onOverlayMouseDown}
        >
            <div className={dialogClass} role="document" style={dialogStyle}>
                <div ref={contentRef} className="modal-content shadow border-0" tabIndex={-1}>
                    <div className="modal-header bg-success-subtle">
                        <h5 id={titleId} className="modal-title m-0 text-success">
                            {title}
                        </h5>
                        <button type="button" className="btn-close" aria-label="Sluiten" onClick={onClose} />
                    </div>
                    {ariaDescription && (
                        <div id={descId} className="visually-hidden">
                            {ariaDescription}
                        </div>
                    )}
                    <div className="modal-body p-3">{children}</div>
                </div>
            </div>
        </div>
    );

    const backdropNode = <div className="modal-backdrop show" style={{ zIndex: 1050 }} aria-hidden="true" />;

    // SSR-safe fallback: indien geen DOM, inline renderen
    if (!portalRoot) {
        return (
            <>
                {backdropNode}
                {modalNode}
            </>
        );
    }

    return (
        <>
            {createPortal(backdropNode, portalRoot)}
            {createPortal(modalNode, portalRoot)}
        </>
    );
}

const Modal = memo(ModalComponent);
Modal.displayName = "Modal";

export default Modal;
