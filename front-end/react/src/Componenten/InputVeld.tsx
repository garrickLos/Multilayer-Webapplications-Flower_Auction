import { type ChangeEvent } from 'react';
import type { ProductLogica, errorMessaging } from '../schermen/AuctionScreen/VeilingSchermTypes';

import '../css/Componenten/InputVeld.css';

interface InputFieldProps {
    type: string;
    id: string;
    name: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    value?: number | string;
}

export function InputField({type ,id, name, onChange }: InputFieldProps) {
    return (
        <input 
            type={type} 
            id={id} 
            name={name} 
            className="selectieVeld"
            onChange={onChange}
            min={0} 
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