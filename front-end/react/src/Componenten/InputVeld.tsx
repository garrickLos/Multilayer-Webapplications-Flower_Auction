import type { InputFieldProps} from '../Componenten/index';

import '../css/Componenten/InputVeld.css';

export function InputField({type ,id, name, onChange, value }: InputFieldProps) {
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

export function checkInputField(
    inputStr: string, 
    maxAantal: number
): number | "" {
    if (inputStr === "") {
        return "";
    }

    let waarde = Number(inputStr);

    if (waarde < 0) {
        return 0;
    }

    if (waarde > maxAantal) {
        return maxAantal;
    }

    return waarde;
}