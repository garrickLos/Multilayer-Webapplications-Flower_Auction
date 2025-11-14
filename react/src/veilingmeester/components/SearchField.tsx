import { useId, type JSX } from "react";

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
 */
export function SearchField({
                                id,
                                label,
                                value,
                                onChange,
                                placeholder,
                                autoFocus,
                            }: SearchFieldProps): JSX.Element {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const aria = label ?? placeholder ?? "Zoeken";

    return (
        <div className="w-100">
            {label && (
                <label
                    htmlFor={inputId}
                    className="form-label small text-uppercase text-success-emphasis mb-1"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                type="search"
                className="form-control form-control-sm border-success-subtle"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                aria-label={aria}
            />
        </div>
    );
}
