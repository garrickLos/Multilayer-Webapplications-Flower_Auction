import { useNavigate } from 'react-router-dom';

import '../css/Componenten/Knop.css';

/**
 * Props voor de knop:
 * - classNames: één class string of meerdere classes als array
 * - bericht: tekst op de knop
 * - to: optioneel pad om naartoe te navigeren (router)
 * - onclickAction: optionele actie als er niet genavigeerd wordt
 */
interface knopItems {
    classNames: string[] | string;
    bericht: string;

    to?: string;
    onclickAction?: () => void;
}

/**
 * Herbruikbare knop component.
 * Kan óf navigeren naar een route (to), óf een callback uitvoeren (onclickAction).
 */
export function GenereerKnop({ classNames = [], bericht, to, onclickAction }: knopItems) {
    const navigate = useNavigate();

    /**
     * Maakt van classNames altijd één string:
     * - array -> "a b c"
     * - string -> "a"
     */
    const formatClass = (input: string | string[]) => {
        if (Array.isArray(input)) {
            return input.join(' ');
        }
        return input;
    };

    // Samengevoegde class string voor de button
    const berichtClasses = formatClass(classNames);

    /**
     * Click gedrag:
     * - Als "to" is meegegeven: navigate naar route
     * - Anders (als "onclickAction" bestaat): voer callback uit
     */
    const handleClick = () => {
        if (to) {
            navigate(to);
        } else if (onclickAction) {
            onclickAction();
        }
    };

    return (
        <button className={berichtClasses} onClick={handleClick}>
            {bericht}
        </button>
    );
}
