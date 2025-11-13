import type { ChangeEvent } from "react";
import { useId } from "react";

export type Option<T extends string | number> = { readonly value: T; readonly label: string };

export type SelectFieldProps<T extends string | number> = {
    readonly id?: string;
    readonly label?: string;
    readonly value: T;
    readonly options: readonly Option<T>[];
    readonly onChange: (value: T) => void;
    readonly ariaLabel?: string;
    readonly disabled?: boolean;
    readonly className?: string;
    readonly parse?: (raw: string) => T;
};

/**
 * Renders a small Bootstrap select field with label support.
 *
 * @param props - Select configuration including options and change handler.
 */
export function SelectField<T extends string | number>({
    id: providedId,
    label,
    value,
    options,
    onChange,
    ariaLabel,
    disabled,
    className,
    parse,
}: SelectFieldProps<T>): JSX.Element {
    const generatedId = useId();
    const inputId = providedId ?? generatedId;

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const raw = event.target.value;
        if (parse) {
            onChange(parse(raw));
            return;
        }
        if (typeof value === "number") {
            onChange(Number(raw) as T);
            return;
        }
        onChange(raw as T);
    };

    return (
        <div className={className}>
            {label && (
                <label htmlFor={inputId} className="form-label small text-uppercase text-success-emphasis mb-1">
                    {label}
                </label>
            )}
            <select
                id={inputId}
                className="form-select form-select-sm border-success-subtle"
                value={String(value)}
                onChange={handleChange}
                aria-label={ariaLabel ?? label}
                disabled={disabled}
            >
                {options.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * Convenience wrapper for a small select field.
 *
 * @param props - Select configuration identical to {@link SelectField}.
 */
export function SmallSelectField<T extends string | number>(props: SelectFieldProps<T>): JSX.Element {
    return <SelectField {...props} />;
}

/**
 * Select field for status filtering with standaard opties.
 *
 * @param props - Select configuration excluding custom options.
 */
export function StatusSelectField(
    props: Omit<SelectFieldProps<"alle" | "actief" | "inactief">, "options" | "parse">,
): JSX.Element {
    return (
        <SelectField
            {...props}
            options={[
                { value: "alle", label: "Alle statussen" },
                { value: "actief", label: "Actief" },
                { value: "inactief", label: "Inactief" },
            ]}
        />
    );
}
