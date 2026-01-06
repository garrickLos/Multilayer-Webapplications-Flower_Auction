import { useEffect, useState, useRef } from 'react';

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