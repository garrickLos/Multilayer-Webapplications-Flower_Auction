import type {
    ChangeEvent,
    InputHTMLAttributes,
    JSX,
    ReactNode,
    SelectHTMLAttributes,
} from "react";
import type { UiStatus, User, UserRole } from "../api";

/**
 * Helper voor conditionele classnames.
 * Negeert falsy waarden en plakt de rest samen met spaties.
 */
const cx = (...classes: Array<string | false | null | undefined>): string =>
    classes.filter(Boolean).join(" ");

/**
 * Props voor Field:
 * - label: titel van het veld
 * - htmlFor: koppelt label aan input id
 * - helperText: extra uitleg onder het veld
 * - className: extra styling
 * - children: input/select/textarea element
 */
type FieldProps = {
    readonly label: string;
    readonly htmlFor?: string;
    readonly helperText?: string;
    readonly className?: string;
    readonly children: ReactNode;
};

/**
 * Wrapper component: label + helperText rondom een form element.
 * Handig voor consistente spacing en styling.
 */
export function Field({
                          label,
                          htmlFor,
                          helperText,
                          className,
                          children,
                      }: FieldProps): JSX.Element {
    return (
        <label
            className={cx("w-100 d-flex flex-column gap-1", className)}
            htmlFor={htmlFor}
        >
            <span className="small text-uppercase text-success-emphasis fw-semibold">
                {label}
            </span>
            {children}
            {helperText && <span className="text-muted small">{helperText}</span>}
        </label>
    );
}

/**
 * Props voor Input:
 * - label/hideLabel/helperText: optionele label en uitleg (hideLabel voor a11y)
 * - onChange: type-safe wrapper om ChangeEvent door te geven
 * - rest: alle standaard input props (behalve onChange, die overschreven wordt)
 */
type InputProps = {
    readonly label?: string;
    readonly hideLabel?: boolean;
    readonly helperText?: string;
    readonly onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">;

/**
 * Input component met optioneel label en helperText.
 * Als label ontbreekt, returnt hij alleen het input element.
 */
export function Input({
                          label,
                          hideLabel = false,
                          helperText,
                          onChange,
                          className,
                          ...props
                      }: InputProps): JSX.Element {
    const input = (
        <input
            {...props}
            className={cx("form-control border-success-subtle", className)}
            onChange={(event) => onChange?.(event)}
        />
    );

    if (!label) return input;

    return (
        <label className="w-100 d-flex flex-column gap-1">
            <span
                className={cx(
                    "small text-uppercase text-success-emphasis fw-semibold",
                    hideLabel && "visually-hidden",
                )}
            >
                {label}
            </span>
            {input}
            {helperText && <span className="text-muted small">{helperText}</span>}
        </label>
    );
}

/**
 * Select option type: value + label.
 */
type SelectOption<T> = { readonly value: T; readonly label: string };

/**
 * Props voor Select:
 * - label/hideLabel/helperText: optionele label en uitleg
 * - options: optioneel lijstje options (anders gebruik je children)
 * - value: generiek (string/number) maar wordt in de DOM als string gezet
 * - onChange: change handler
 */
type SelectProps<T extends string | number = string> = {
    readonly label?: string;
    readonly hideLabel?: boolean;
    readonly helperText?: string;
    readonly options?: readonly SelectOption<T>[];
    readonly onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
    readonly children?: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> &
    ({ readonly value?: T } | { readonly value: T });

/**
 * Select component:
 * - je kunt options meegeven als array, of children (<option>...) gebruiken
 * - value wordt altijd naar String(value) omgezet voor de select
 */
export function Select<T extends string | number>({
                                                      label,
                                                      hideLabel = false,
                                                      helperText,
                                                      options,
                                                      children,
                                                      className,
                                                      onChange,
                                                      value,
                                                      ...props
                                                  }: SelectProps<T>): JSX.Element {
    const selectElement = (
        <select
            {...props}
            className={cx("form-select border-success-subtle", className)}
            value={value === undefined ? undefined : String(value)}
            onChange={(event) => onChange?.(event)}
        >
            {options
                ? options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))
                : children}
        </select>
    );

    if (!label) return selectElement;

    return (
        <label className="w-100 d-flex flex-column gap-1">
            <span
                className={cx(
                    "small text-uppercase text-success-emphasis fw-semibold",
                    hideLabel && "visually-hidden",
                )}
            >
                {label}
            </span>
            {selectElement}
            {helperText && <span className="text-muted small">{helperText}</span>}
        </label>
    );
}

/**
 * StatusBadge:
 * Toont een badge met vaste kleuren/labels op basis van UiStatus.
 */
export function StatusBadge({ status }: { readonly status: UiStatus }): JSX.Element {
    const variants: Record<UiStatus, string> = {
        active: "bg-success-subtle text-success-emphasis",
        inactive: "bg-secondary-subtle text-secondary-emphasis",
        sold: "bg-warning-subtle text-warning-emphasis",
        deleted: "bg-danger-subtle text-danger-emphasis",
        finished: "bg-info-subtle text-info-emphasis",
    };

    const labels: Record<UiStatus, string> = {
        active: "Actief",
        inactive: "Inactief",
        sold: "Uitverkocht",
        deleted: "Geannuleerd",
        finished: "Afgesloten",
    };

    return <span className={cx("badge rounded-pill", variants[status])}>{labels[status]}</span>;
}

/**
 * RoleBadge:
 * Toont een badge voor de gebruikersrol met een eenvoudige variant mapping.
 */
export function RoleBadge({ role }: { readonly role: UserRole }): JSX.Element {
    const variant =
        role === "Admin" || role === "Veilingmeester"
            ? "success"
            : role === "Bedrijf"
                ? "primary"
                : "secondary";

    return (
        <span className={`badge bg-${variant}-subtle text-${variant}-emphasis`}>
            {role}
        </span>
    );
}

/**
 * UserBadge:
 * Compacte user weergave met naam, email en rol badge.
 */
export function UserBadge({ user }: { readonly user: User }): JSX.Element {
    return (
        <span className="d-inline-flex align-items-center gap-2">
            <span className="fw-semibold">{user.name}</span>
            <span className="text-muted small">{user.email}</span>
            <RoleBadge role={user.role} />
        </span>
    );
}

/**
 * Props voor EmptyState:
 * - title: korte titel bovenaan
 * - description/message: tekst eronder (description heeft voorrang)
 */
type EmptyStateProps = {
    readonly title?: string;
    readonly description?: string;
    readonly message?: string;
};

/**
 * EmptyState:
 * Lege staat voor tabellen/overzichten als er geen items zijn.
 */
export function EmptyState({ title, description, message }: EmptyStateProps): JSX.Element {
    return (
        <div className="text-center text-muted py-4">
            {title && <p className="fw-semibold mb-1">{title}</p>}
            <p className="mb-0">{description ?? message ?? "Geen resultaten"}</p>
        </div>
    );
}
