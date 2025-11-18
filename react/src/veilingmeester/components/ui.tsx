import { type JSX, type ReactNode } from "react";
import { roleLabels, statusLabels, type Status, type UserRole } from "../types";
import { cx } from "../utils";

// Small UI helpers shared across screens.
export const InlineAlert = ({ variant = "danger", children }: { readonly variant?: "danger" | "warning" | "info" | "success"; readonly children: ReactNode }): JSX.Element => (
    <div className={`alert alert-${variant} py-2 px-3 shadow-sm rounded-4 border-0 mb-0`} role="alert">{children}</div>
);

export const EmptyState = ({ message }: { readonly message: string }): JSX.Element => (
    <div className="text-center text-muted py-5" role="status" aria-live="polite">
        <div className="display-6 mb-2 text-success" aria-hidden="true">
            🌿
        </div>
        <p className="mb-0">{message}</p>
    </div>
);

export const StatusBadge = ({ status }: { readonly status: Status }): JSX.Element => (
    <span className={cx(
        "badge rounded-pill",
        status === "active" && "text-bg-success",
        status === "inactive" && "text-bg-secondary",
        status === "sold" && "text-bg-info",
        status === "deleted" && "text-bg-danger",
    )}
    >
        {statusLabels[status]}
    </span>
);

export const RoleBadge = ({ role }: { readonly role: UserRole }): JSX.Element => (
    <span className="badge bg-success-subtle text-success-emphasis rounded-pill">{roleLabels[role]}</span>
);

export const Field = ({ label, children }: { readonly label: string; readonly children: ReactNode }): JSX.Element => (
    <label className="w-100 d-flex flex-column gap-1">
        <span className="small text-uppercase text-success-emphasis fw-semibold">{label}</span>
        {children}
    </label>
);

export const Input = ({
    id,
    type = "text",
    value,
    onChange,
    placeholder,
    min,
}: {
    readonly id?: string;
    readonly type?: string;
    readonly value: string | number;
    readonly onChange: (value: string) => void;
    readonly placeholder?: string;
    readonly min?: number;
}): JSX.Element => (
    <input
        id={id}
        type={type}
        className="form-control border-success-subtle"
        value={value}
        min={min}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
    />
);

export const Select = ({
    value,
    options,
    onChange,
}: {
    readonly value: string;
    readonly options: readonly { value: string; label: string }[];
    readonly onChange: (value: string) => void;
}): JSX.Element => (
    <select className="form-select border-success-subtle" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ))}
    </select>
);

export const Chip = ({ label, onRemove }: { readonly label: string; readonly onRemove: () => void }): JSX.Element => (
    <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle rounded-pill d-inline-flex align-items-center gap-2 px-2 py-1">
        <span>{label}</span>
        <button type="button" className="btn-close btn-close-sm" aria-label={`${label} verwijderen`} onClick={onRemove} />
    </span>
);
