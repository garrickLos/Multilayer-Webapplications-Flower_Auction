import type { ChangeEvent, InputHTMLAttributes, JSX, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { UiStatus, User, UserRole } from "../api";

const cx = (...classes: Array<string | false | null | undefined>): string => classes.filter(Boolean).join(" ");

type FieldProps = {
    readonly label: string;
    readonly htmlFor?: string;
    readonly helperText?: string;
    readonly className?: string;
    readonly children: ReactNode;
};

/** Small helper input components used across the dashboard. */
export function Field({ label, htmlFor, helperText, className, children }: FieldProps): JSX.Element {
    return (
        <label className={cx("w-100 d-flex flex-column gap-1", className)} htmlFor={htmlFor}>
            <span className="small text-uppercase text-success-emphasis fw-semibold">{label}</span>
            {children}
            {helperText && <span className="text-muted small">{helperText}</span>}
        </label>
    );
}

type InputProps = {
    readonly label?: string;
    readonly hideLabel?: boolean;
    readonly helperText?: string;
    readonly onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">;

export function Input({ label, hideLabel = false, helperText, onChange, className, ...props }: InputProps): JSX.Element {
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
            <span className={cx("small text-uppercase text-success-emphasis fw-semibold", hideLabel && "visually-hidden")}>{label}</span>
            {input}
            {helperText && <span className="text-muted small">{helperText}</span>}
        </label>
    );
}

type SelectOption<T> = { readonly value: T; readonly label: string };

type SelectProps<T extends string | number = string> = {
    readonly label?: string;
    readonly hideLabel?: boolean;
    readonly helperText?: string;
    readonly options?: readonly SelectOption<T>[];
    readonly onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
    readonly children?: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> &
    ({ readonly value?: T } | { readonly value: T });

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
            <span className={cx("small text-uppercase text-success-emphasis fw-semibold", hideLabel && "visually-hidden")}>{label}</span>
            {selectElement}
            {helperText && <span className="text-muted small">{helperText}</span>}
        </label>
    );
}

type TextAreaProps = {
    readonly label?: string;
    readonly hideLabel?: boolean;
    readonly helperText?: string;
    readonly onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange">;

export function TextArea({ label, hideLabel = false, helperText, className, onChange, ...props }: TextAreaProps): JSX.Element {
    const textArea = (
        <textarea
            {...props}
            className={cx("form-control border-success-subtle", className)}
            onChange={(event) => onChange?.(event)}
        />
    );

    if (!label) return textArea;

    return (
        <label className="w-100 d-flex flex-column gap-1">
            <span className={cx("small text-uppercase text-success-emphasis fw-semibold", hideLabel && "visually-hidden")}>{label}</span>
            {textArea}
            {helperText && <span className="text-muted small">{helperText}</span>}
        </label>
    );
}

export function StatusBadge({ status }: { readonly status: UiStatus }): JSX.Element {
    const variants: Record<UiStatus, string> = {
        active: "bg-success-subtle text-success-emphasis",
        inactive: "bg-secondary-subtle text-secondary-emphasis",
        sold: "bg-warning-subtle text-warning-emphasis",
        deleted: "bg-danger-subtle text-danger-emphasis",
    };
    const labels: Record<UiStatus, string> = {
        active: "Actief",
        inactive: "Inactief",
        sold: "Verkocht",
        deleted: "Geannuleerd",
    };
    return <span className={cx("badge rounded-pill", variants[status])}>{labels[status]}</span>;
}

export function RoleBadge({ role }: { readonly role: UserRole }): JSX.Element {
    const variant = role === "Admin" || role === "Veilingmeester" ? "success" : role === "Bedrijf" ? "primary" : "secondary";
    return <span className={`badge bg-${variant}-subtle text-${variant}-emphasis`}>{role}</span>;
}

export function Chip({ label, onRemove }: { readonly label: string; readonly onRemove?: () => void }): JSX.Element {
    return (
        <span className="badge bg-success-subtle text-success-emphasis d-inline-flex align-items-center gap-1">
            {label}
            {onRemove && (
                <button type="button" className="btn-close btn-close-sm" aria-label="Verwijder filter" onClick={onRemove} />
            )}
        </span>
    );
}

export function UserBadge({ user }: { readonly user: User }): JSX.Element {
    return (
        <span className="d-inline-flex align-items-center gap-2">
            <span className="fw-semibold">{user.name}</span>
            <span className="text-muted small">{user.email}</span>
            <RoleBadge role={user.role} />
        </span>
    );
}

type EmptyStateProps = {
    readonly title?: string;
    readonly description?: string;
    readonly message?: string;
};

export function EmptyState({ title, description, message }: EmptyStateProps): JSX.Element {
    return (
        <div className="text-center text-muted py-4">
            {title && <p className="fw-semibold mb-1">{title}</p>}
            <p className="mb-0">{description ?? message ?? "Geen resultaten"}</p>
        </div>
    );
}
