import React, {
    memo,
    useEffect,
    useId,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import { createPortal } from 'react-dom';

export type ModalProps = {
    title: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'lg' | 'xl';
    fullscreenUntil?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    maxWidthPx?: number;
    autoFocusSelector?: string;
};

const isBrowser =
    typeof window !== 'undefined' && typeof document !== 'undefined';

const ModalComponent: React.FC<ModalProps> = ({
                                                  title,
                                                  onClose,
                                                  children,
                                                  size,
                                                  fullscreenUntil = 'sm',
                                                  maxWidthPx,
                                                  autoFocusSelector = 'button.btn-close',
                                              }) => {
    const id = useId();
    const titleId = `${id}-title`;

    const portalRoot = isBrowser ? document.body : null;
    const prevFocus = useRef<HTMLElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Bepaal dialog-klasse (Bootstrap) – type-safe, zonder filter(Boolean)-hack
    const dialogClass = useMemo(() => {
        const classes: string[] = [
            'modal-dialog',
            'modal-dialog-centered',
            'modal-dialog-scrollable',
        ];
        if (fullscreenUntil) {
            classes.push(`modal-fullscreen-${fullscreenUntil}-down`);
        }
        if (size) {
            classes.push(`modal-${size}`);
        }
        return classes.join(' ');
    }, [size, fullscreenUntil]);

    // Max-breedte (ook bij fullscreenUntil: dat geldt alleen tot breakpoint)
    const dialogStyle = useMemo<React.CSSProperties | undefined>(
        () =>
            maxWidthPx
                ? { maxWidth: `min(98vw, ${maxWidthPx}px)` }
                : undefined,
        [maxWidthPx],
    );

    // Focusbeheer, ESC, scroll lock
    useEffect(() => {
        if (!isBrowser) return;

        // Vorige focus onthouden
        prevFocus.current = document.activeElement as HTMLElement | null;

        // Scroll lock
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Na render focus zetten
        const focusId = window.requestAnimationFrame(() => {
            const root = containerRef.current;
            if (!root) return;

            const el =
                autoFocusSelector &&
                root.querySelector<HTMLElement>(autoFocusSelector);

            if (el && typeof el.focus === 'function') {
                el.focus();
            } else if (typeof root.focus === 'function') {
                root.focus();
            }
        });

        return () => {
            window.cancelAnimationFrame(focusId);
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = prevOverflow;
            prevFocus.current?.focus?.();
        };
    }, [onClose, autoFocusSelector]);

    // Klik op overlay (donkere achtergrond) sluit modal;
    // klik binnen de dialog niet.
    const handleOverlayMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            // Alleen sluiten als er echt op de overlay (niet op inhoud) wordt geklikt
            if (e.target === e.currentTarget) {
                onClose();
            }
        },
        [onClose],
    );

    const modalNode = (
        <div
            className="modal show d-block"
            style={{ zIndex: 1055 }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            ref={containerRef}
            onMouseDown={handleOverlayMouseDown}
        >
            <div className={dialogClass} role="document" style={dialogStyle}>
                <div className="modal-content shadow border-0">
                    <div className="modal-header bg-success-subtle">
                        <h5 id={titleId} className="modal-title m-0 text-success">
                            {title}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Sluiten"
                            onClick={onClose}
                        />
                    </div>
                    <div className="modal-body p-3">{children}</div>
                </div>
            </div>
        </div>
    );

    const backdropNode = (
        <div
            className="modal-backdrop show"
            style={{ zIndex: 1050 }}
            aria-hidden="true"
        />
    );

    // SSR-safe: als er geen document/body is, gewoon inline renderen
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
};

const Modal = memo(ModalComponent);
Modal.displayName = 'Modal';

export default Modal;
