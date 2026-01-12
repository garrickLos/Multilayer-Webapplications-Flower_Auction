import { type ChangeEvent } from 'react';

export interface InputFieldProps {
    type: string;
    id: string;
    name: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    value?: number | string;
}