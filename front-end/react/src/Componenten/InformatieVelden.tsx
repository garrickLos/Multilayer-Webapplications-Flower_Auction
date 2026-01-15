import type { InfoVeldProps } from '../Componenten/index';

import '../css/Componenten/InformatieVelden.css';

export function InfoVeld({ Titel, tussenkop, Bericht, secondClass = [], tussenkopClass = [], BerichtClass = [] }: InfoVeldProps) {

    //formateerd de arrays van de secondclass en berichtclass zodat het meerdere classes heeft.
    //Hij voegt de arrays samen door middel van een spatie
    const formatClass = (input: string | string[]) => {
        if (Array.isArray(input)) {
            return input.join(" ");
        }
        return input;
    };
    
    //standaard class
    const containerClasses = `ordenen ${formatClass(secondClass)}`;

    const tussenkopClasses = formatClass(tussenkopClass);

    const berichtClasses = formatClass(BerichtClass);

    return (
        <div className={containerClasses}>
            <span className='titel'>{Titel}</span>
            <span className={tussenkopClasses}>{tussenkop}</span>
            <span className={berichtClasses}>{Bericht}</span>
        </div>
    );
}