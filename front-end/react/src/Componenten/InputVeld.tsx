import type { InputFieldProps } from '../Componenten/index';

import '../css/Componenten/InputVeld.css';

/**
 * Input component met vaste styling.
 * Geeft props door naar een standaard <input> en gebruikt de CSS class "selectieVeld".
 */
export function InputField({ type, id, name, onChange, value }: InputFieldProps) {
    return (
        <input
            type={type}
            id={id}
            name={name}
            className="selectieVeld"
            onChange={onChange}
            min={0}
            value={value}
        />
    );
}

/**
 * Valideert en normaliseert de ingevoerde waarde:
 * - "" blijft "" (handig voor lege input)
 * - Negatief wordt 0
 * - Boven maxAantal wordt maxAantal
 * - Anders: het getal zelf
 */
// eslint-disable-next-line react-refresh/only-export-components
export function checkInputField(
    inputStr: string,
    maxAantal: number
): number | "" {
    if (inputStr === "") {
        return "";
    }

    const waarde = Number(inputStr);

    if (waarde < 0) {
        return 0;
    }

    if (waarde > maxAantal) {
        return maxAantal;
    }

    return waarde;
}
