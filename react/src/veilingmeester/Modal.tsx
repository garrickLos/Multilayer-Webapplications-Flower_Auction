import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, ReactElement, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

type ModalProps = {
    title: string;
    children: ReactNode;
    onClose: () => void;
    size?: "sm" | "lg" | "xl";
    closeOnEsc?: boolean;
    closeOnBackdrop?: boolean;
    ariaDescription?: string;
};

export function Modal({
    title,
    children,
    onClose,
    size,
    closeOnEsc = true,
    closeOnBackdrop = true,
    ariaDescription,
}: ModalProps): ReactElement | null {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);

    const close = useCallback(() => {
        onClose();
    }, [onClose]);

    useEffect(() => {
        previouslyFocused.current = document.activeElement as HTMLElement | null;
        const body = document.body;
        const overlay = document.createElement('div');
        overlay.className = 'modal-backdrop fade show';
        body.appendChild(overlay);
        body.classList.add('modal-open');

        return () => {
            body.classList.remove('modal-open');
            overlay.remove();
            previouslyFocused.current?.focus();
        };
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
        const target = focusable.length ? focusable[0] : dialog;
        target.focus();
    }, []);

    useEffect(() => {
        if (!closeOnEsc) return;
        const handler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                close();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [close, closeOnEsc]);

    const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Tab') return;
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
        if (!focusable.length) {
            event.preventDefault();
            dialog.focus();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }, []);

    const handleBackdropClick = useCallback(
        (event: ReactMouseEvent<HTMLDivElement>) => {
            if (!closeOnBackdrop) return;
            if (event.target === overlayRef.current) {
                close();
            }
        },
        [close, closeOnBackdrop],
    );

    return createPortal(
        <div
            ref={overlayRef}
            className="modal fade show d-block"
            tabIndex={-1}
            onMouseDown={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div className={cx('modal-dialog modal-dialog-centered', size && `modal-${size}`)}>
                <div className="modal-content shadow">
                    <div className="modal-header">
                        <h2 className="modal-title h5 mb-0">{title}</h2>
                        <button type="button" className="btn-close" aria-label="Sluiten" onClick={close} />
                    </div>
                    <div
                        ref={dialogRef}
                        className="modal-body"
                        tabIndex={-1}
                        onKeyDown={handleKeyDown}
                        aria-describedby={ariaDescription}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

function cx(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ');
}
