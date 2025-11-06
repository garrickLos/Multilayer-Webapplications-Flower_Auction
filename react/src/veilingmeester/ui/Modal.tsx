import React, { memo, useEffect, useId, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

/**
 * Props for the Modal component.  The modal renders its content in a portal
 * to the document body (or the current portal root).  It locks scrolling on
 * the body while open and restores focus to the previously active element
 * when closed.
 */
export type ModalProps = {
    /** Title displayed in the modal header */
    title: React.ReactNode;
    /** Called when the user dismisses the modal via the close button, Escape key or backdrop click */
    onClose: () => void;
    /** Content to render within the modal body */
    children: React.ReactNode;
    /** Bootstrap size modifier */
    size?: 'sm' | 'lg' | 'xl';
    /** Breakpoint up to which the modal is fullscreen (e.g. 'md' => fullscreen until medium screens) */
    fullscreenUntil?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    /** Maximum width in pixels when not fullscreen */
    maxWidthPx?: number;
    /** CSS selector for the element to autofocus when the modal opens */
    autoFocusSelector?: string;
};

// Detect whether we're running in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * A Bootstrap‑styled modal that portals its contents to the document body.
 * It handles focus management, keyboard dismissal and optional responsive
 * sizing.  The component is memoised to avoid unnecessary re-renders.
 */
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
        // Determine where to render the modal.  In browsers we use document.body;
        // otherwise we render inline (e.g. during SSR tests).
        const portalRoot = isBrowser ? document.body : null;
        const titleId = `${useId()}-title`;
        const prevFocus = useRef<HTMLElement | null>(null);
        const containerRef = useRef<HTMLDivElement | null>(null);

        // Compute CSS classes for the dialog element based on props
        const dialogClass = useMemo(() => {
            return [
                'modal-dialog',
                'modal-dialog-centered',
                'modal-dialog-scrollable',
                fullscreenUntil ? `modal-fullscreen-${fullscreenUntil}-down` : 'modal-fullscreen-sm-down',
                size && `modal-${size}`,
            ]
                .filter(Boolean)
                .join(' ');
        }, [size, fullscreenUntil]);
        // Inline styles for the dialog when not fullscreen and a max width is provided
        const dialogStyle = useMemo(() => {
            return fullscreenUntil
                ? undefined
                : maxWidthPx
                    ? { maxWidth: `min(98vw, ${maxWidthPx}px)` }
                    : undefined;
        }, [fullscreenUntil, maxWidthPx]);

        // Handle Escape key dismissal and focus trapping/restoration
        useEffect(() => {
            if (!isBrowser) return;
            // Save previously focused element to restore later
            prevFocus.current = document.activeElement as HTMLElement | null;
            // Prevent body scrolling while modal is open
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            // Escape key handler
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            // Focus the first element matching the selector (or the close button) on next frame
            const focusId = requestAnimationFrame(() => {
                const el = containerRef.current?.querySelector<HTMLElement>(autoFocusSelector);
                el?.focus?.();
            });
            return () => {
                cancelAnimationFrame(focusId);
                window.removeEventListener('keydown', handleKeyDown);
                // Restore body overflow
                document.body.style.overflow = prevOverflow;
                // Restore focus
                prevFocus.current?.focus?.();
            };
        }, [onClose, autoFocusSelector]);

        // Backdrop click handler: close the modal when clicking the backdrop
        const handleBackdropClick = useCallback(() => {
            onClose();
        }, [onClose]);

        // Assemble the modal and backdrop nodes
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
                            <button type="button" className="btn-close" aria-label="Sluiten" onClick={onClose} />
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
        // Render via portal when in a browser environment
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