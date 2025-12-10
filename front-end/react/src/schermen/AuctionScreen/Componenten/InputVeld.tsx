import { type ChangeEvent } from 'react';
import type { ProductLogica } from '../VeilingTypes';
import type { errorMessaging } from '../VeilingScherm';

import '../../../css/Componenten/InputVeld.css';

interface InputFieldProps {
    type: string;
    id: string;
    name: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    value?: number | string;
}

export function InputField({type ,id, name, onChange, value }: InputFieldProps) {
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

export function checkInputField(input: number, huidigProduct: ProductLogica, err: errorMessaging): boolean {
    if (input > 0 && input <= huidigProduct.aantalFusten) {
        err.correcteWaarde = "Waarde wordt verstuurd";
        return true
    } else if (input > huidigProduct.aantalFusten) {
        err.verkeerdeWaarde = "de invoer is meer dan verwacht is"
        return false
    } else if(!input.valueOf) {
        err.verkeerdeWaarde = "Invoer moet een getal zijn"
        return false;
    } else {
        err.verkeerdeWaarde = "Minimale input van 1 verwacht";
        return false;
    }
}