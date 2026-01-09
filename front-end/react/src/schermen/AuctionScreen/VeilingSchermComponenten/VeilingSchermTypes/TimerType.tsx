import type { VeilingLogica } from '../index';

export type TimerProps =  {
    onPrijsUpdate: (prijs: number) => void;
    onProductWissel: (productIndex: number) => void; // Nieuwe prop
    item: VeilingLogica;
}