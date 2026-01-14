import { useEffect, useState, useRef } from 'react';

/**
 * 
 * @param intervalTime de tijd in seconden waarbij de refresh zich triggered
 * @returns een trigger die ervoor zorgt dat het om de zoveel seconden opnieuw refreshed
 */
// berekend tijd in miliseconden
export function useAutorefresh(intervalTime: number) {
    const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setRefreshTrigger(Date.now);
        }, intervalTime);

        return () => clearInterval(intervalId);
    }, [intervalTime]);

    return refreshTrigger;
}

/**
 * Voert een actie uit na een bepaalde vertraging, als de opgegeven conditie waar is.
 * Handig voor bijvoorbeeld notificaties, reloads of uitgestelde acties in React componenten.
 *
 * @param condition Boolean conditie die bepaalt of de timeout gestart wordt.
 * @param delayMs Aantal milliseconden vertraging voordat de actie wordt uitgevoerd.
 * @param action Functie die uitgevoerd wordt na de vertraging als de conditie waar is.
 * @returns void (de hook retourneert niets)
 */
export function useConditionalTimeout(condition: boolean,delayMs: number, action: () => void) {
    const savedAction = useRef(action);

    useEffect(() => {
        savedAction.current = action;
    }, [action]);

    useEffect(() => {
        // Controleer of de conditie waar is voor het herladen
        if (condition) {
            // Start de timer
            const timerId = setTimeout(() => {
                savedAction.current();
            }, delayMs);

            // Ruimt de timer op als de component verdwijnt of de conditie verandert
            return () => clearTimeout(timerId);
        }
    }, [condition, delayMs]);
}