import {
    useEffect,
    useId,
    useMemo,
    useRef,
    type JSX,
    type MouseEvent,
    type ReactNode,
} from "react";

/**
 * Helper om conditionele classnames samen te voegen.
 * Negeert falsy waarden (false/null/undefined) en plakt de rest met spaties.
 */
const cx = (...classes: Array<string | false | null | undefined>): string =>
    classes.filter(Boolean).join(" ");

/**
 * Props voor de basis modal:
 * - title/subtitle: koptekst inhoud
 * - children: inhoud van de modal
 * - onClose: sluit callback (ESC, backdrop of sluitknop)
 * - footer: optionele footer sectie
 * - size: bootstrap dialog grootte
 * - allowBackdropClose: bepalen of klikken buiten de modal mag sluiten
 * - controls: extra UI in de header (bijv. filters/knoppen)
 */
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

/**
 * CSS selectors voor focusbare elementen binnen de modal.
 * Wordt gebruikt om focus te "trappen" (Tab/Shift+Tab blijft binnen de modal).
 */
const focusSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Bootstrap dialog-groottes per "size" prop.
 */
const dialogSizes: Record<NonNullable<ModalProps["size"]>, string> = {
    sm: "modal-sm",
    md: "",
    lg: "modal-lg",
    xl: "modal-xl",
};

/**
 * Herbruikbare modal component met:
 * - backdrop + ESC sluiten
 * - focus management (eerste focus, tab trapping, focus teruggeven bij sluiten)
 * - optionele controls in header en footer sectie
 */
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

    /**
     * Focus management:
     * - onthoudt wat eerder focus had (zodat je terug kan focussen bij sluiten)
     * - zoekt focusbare elementen in de modal
     * - focust het eerste focusbare element (of de modal zelf)
     * - ESC sluit de modal
     * - Tab/Shift+Tab houdt focus binnen de modal
     */
    useEffect(() => {
        if (typeof document === "undefined") return;

        previousFocus.current = document.activeElement as HTMLElement | null;

        const node = dialogRef.current;
        focusables.current = node
            ? Array.from(node.querySelectorAll<HTMLElement>(focusSelectors)).filter(
                (el) => el.offsetParent !== null,
            )
            : [];

        // Eerste focusbare element focussen
        (focusables.current[0] ?? node)?.focus({ preventScroll: true });

        const handleKeyDown = (event: KeyboardEvent) => {
            // ESC sluit de modal
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            // Focus binnen modal houden met Tab
            if (event.key !== "Tab" || focusables.current.length === 0) return;

            const first = focusables.current[0];
            const last = focusables.current[focusables.current.length - 1];

            // Tab op laatste element -> terug naar eerste
            if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }

            // Shift+Tab op eerste element -> naar laatste
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

    /**
     * Sluiten bij klik op backdrop (alleen als toegestaan).
     * Controle: event.target === event.currentTarget betekent dat je echt op de backdrop klikt.
     */
    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!allowBackdropClose) return;
        if (event.target === event.currentTarget) onClose();
    };

    /**
     * Header memoized:
     * - titel + subtitle
     * - sluitknop
     * - optioneel extra controls blok
     */
    const renderHeader = useMemo(
        () => (
            <div className="modal-header bg-white position-sticky top-0 z-3 border-success-subtle flex-column align-items-start gap-1">
                <div className="d-flex w-100 align-items-start">
                    <div className="flex-grow-1">
                        <p className="text-uppercase small text-success-emphasis mb-1">
                            {subtitle}
                        </p>
                        <h2 className="modal-title h5 mb-0" id={headingId}>
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Sluiten"
                        onClick={onClose}
                    />
                </div>

                {controls && <div className="w-100 pt-2">{controls}</div>}
            </div>
        ),
        [controls, headingId, onClose, subtitle, title],
    );

    return (
        <>
            {/* Backdrop (donkere laag achter de modal) */}
            <div className="modal-backdrop fade show" />

            {/* Modal container */}
            <div
                className="modal fade show d-block"
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                onMouseDown={handleBackdropClick}
            >
                <div
                    className={cx(
                        "modal-dialog modal-dialog-scrollable",
                        dialogSizes[size],
                    )}
                >
                    <div
                        ref={dialogRef}
                        className="modal-content border border-success-subtle rounded-4 shadow-lg"
                        tabIndex={-1}
                    >
                        {renderHeader}

                        {/* Inhoud */}
                        <div className="modal-body py-3">
                            <div className="d-flex flex-column gap-3">{children}</div>
                        </div>

                        {/* Footer (optioneel) */}
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
