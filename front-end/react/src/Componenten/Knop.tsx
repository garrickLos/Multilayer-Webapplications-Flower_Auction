import { useNavigate } from 'react-router-dom';

import '../css/Componenten/Knop.css'

interface knopItems {
    classNames: string[] | string;
    bericht: string;

    to?: string;
    onclickAction?: () => void;
}

export function GenereerKnop( {classNames=[], bericht, to, onclickAction}: knopItems ){
    const navigate = useNavigate();

    const formatClass = (input: string | string[]) => {
        if (Array.isArray(input)) {
            return input.join(" ");
        }
        return input;
    };

    const berichtClasses = formatClass(classNames);

    const handleClick = () => {
        if (to) {
            navigate(to);
        } else if (onclickAction) {
            onclickAction();
        }
    };

    return <button 
            className= {berichtClasses}
            onClick={handleClick}
            >
                {bericht}
            </button>
}
