import '../css/Componenten/InformatieVelden.css';

interface InfoVeldProps {
    Titel: string;
    Bericht: any;

    secondClass?: string | string[]; 
    BerichtClass?: string | string[];
}

export function InfoVeld({ Titel, Bericht, secondClass = [], BerichtClass = [] }: InfoVeldProps) {

    //formateerd de arrays van de secondclass en berichtclass zodat het meerdere classes heeft.
    const formatClass = (input: string | string[]) => {
        if (Array.isArray(input)) {
            return input.join(" ");
        }
        return input;
    };
    
    //standaard class
    const containerClasses = `ordenen ${formatClass(secondClass)}`;

    const berichtClasses = formatClass(BerichtClass);

    return (
        <div className={containerClasses}>
            <span>{Titel}</span>
            <span className={berichtClasses}>{Bericht}</span>
        </div>
    );
}