import { useId } from "react";

export type SearchFieldProps = {
    readonly id?: string;
    readonly label?: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly placeholder?: string;
    readonly autoFocus?: boolean;
};

/**
 * Renders a searchable input with optional label.
 *
 * @param props - Input configuration and change handler.
 */
export function SearchField({ id, label, value, onChange, placeholder, autoFocus }: SearchFieldProps): JSX.Element {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
        <div className="w-100">
            {label && (
                <label htmlFor={inputId} className="form-label small text-uppercase text-muted mb-1">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                type="search"
                className="form-control form-control-sm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                aria-label={label ?? placeholder ?? "Zoeken"}
            />
        </div>
    );
}
