import type { JSX, ReactNode } from "react";
import { cx, formatCurrency } from "../utils";
import type { UiStatus, UserRole } from "../types";

/** Small helper input components used across the dashboard. */
export function Field({ label, children }: { readonly label: string; readonly children: ReactNode }): JSX.Element {
    return (
        <label className="w-100 d-flex flex-column gap-1">
            <span className="small text-uppercase text-success-emphasis fw-semibold">{label}</span>
            {children}
        </label>
    );
}

export function SearchInput({
    id,
    value,
    placeholder,
    onChange,
}: {
    readonly id: string;
    readonly value: string;
    readonly placeholder?: string;
    readonly onChange: (value: string) => void;
}): JSX.Element {
    return (
        <div className="input-group">
            <span className="input-group-text bg-white text-success-emphasis border-success-subtle">
                <i className="bi bi-search" aria-hidden="true" />
            </span>
            <input
                id={id}
                type="search"
                className="form-control border-success-subtle"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

export function Select<T extends string | number>({
    value,
    options,
    onChange,
}: {
    readonly value: T;
    readonly options: readonly { value: T; label: string }[];
    readonly onChange: (value: T) => void;
}): JSX.Element {
    return (
        <select className="form-select border-success-subtle" value={String(value)} onChange={(event) => onChange(event.target.value as T)}>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

export function Input({
    value,
    type = "text",
    placeholder,
    min,
    onChange,
}: {
    readonly value: string | number;
    readonly type?: string;
    readonly placeholder?: string;
    readonly min?: number;
    readonly onChange: (value: string) => void;
}): JSX.Element {
    return (
        <input
            type={type}
            className="form-control border-success-subtle"
            value={value}
            placeholder={placeholder}
            min={min}
            onChange={(event) => onChange(event.target.value)}
        />
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
    const variant = role === "Admin" || role === "Veilingmeester" ? "success" : role === "Kweker" ? "primary" : "secondary";
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

export function EmptyState({ message }: { readonly message: string }): JSX.Element {
    return <div className="text-center text-muted py-4">{message}</div>;
}

export function StatCard({ label, value, icon }: { readonly label: string; readonly value: number | string; readonly icon: string }): JSX.Element {
    return (
        <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                    <div className="small text-muted text-uppercase fw-semibold">{label}</div>
                    <div className="fs-4 fw-bold text-success-emphasis">{typeof value === "number" ? value.toLocaleString("nl-NL") : value}</div>
                </div>
                <i className={`bi ${icon} fs-3 text-success`} aria-hidden="true" />
            </div>
        </div>
    );
}

export function PriceCell({ value, hint }: { readonly value: number; readonly hint?: string }): JSX.Element {
    return (
        <div className="d-flex flex-column">
            <span>{formatCurrency(value)}</span>
            {hint && <small className="text-muted">{hint}</small>}
        </div>
    );
}
