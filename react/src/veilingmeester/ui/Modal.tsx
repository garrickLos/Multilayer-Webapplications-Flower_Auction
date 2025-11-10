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

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const Modal: React.FC<ModalProps> = memo(
    ({
         title,
         onClose,
         children,
         size,
         fullscreenUntil = 'sm',
         maxWidthPx,
         autoFocusSelector = 'button.btn-close',
     }) => {
        const portalRoot = isBrowser ? document.body : null;
        const titleId = `${useId()}-title`;
        const prevFocus = useRef<HTMLElement | null>(null);
        const containerRef = useRef<HTMLDivElement | null>(null);

        // Bepaal dialog-klasse (Bootstrap)
        const dialogClass = useMemo(() => {
            return [
                'modal-dialog',
                'modal-dialog-centered',
                'modal-dialog-scrollable',
                fullscreenUntil && `modal-fullscreen-${fullscreenUntil}-down`,
                size && `modal-${size}`,
            ]
                .filter(Boolean)
                .join(' ');
        }, [size, fullscreenUntil]);

        // Max-breedte (ook als fullscreenUntil is ingesteld; full-screen geldt alleen
        // "tot en met" een breakpoint, daarboven mag maxWidth gewoon gelden).
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

            prevFocus.current = document.activeElement as HTMLElement | null;
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };

            window.addEventListener('keydown', handleKeyDown);

            const focusId = requestAnimationFrame(() => {
                const el = containerRef.current?.querySelector<HTMLElement>(autoFocusSelector);
                el?.focus?.();
            });

            return () => {
                cancelAnimationFrame(focusId);
                window.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = prevOverflow;
                prevFocus.current?.focus?.();
            };
        }, [onClose, autoFocusSelector]);

        const handleBackdropClick = useCallback(() => {
            onClose();
        }, [onClose]);

        const modalNode = (
            <div
                className="modal show d-block"
                style={{ zIndex: 1055 }}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                ref={containerRef}
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
                onMouseDown={handleBackdropClick}
            />
        );

        return portalRoot ? (
            <>
                {createPortal(backdropNode, portalRoot)}
                {createPortal(modalNode, portalRoot)}
            </>
        ) : (
            <>{modalNode}</>
        );
    },
);

Modal.displayName = 'Modal';

export default Modal;
