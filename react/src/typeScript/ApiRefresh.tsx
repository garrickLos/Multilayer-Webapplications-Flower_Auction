import { useEffect, useState } from 'react';

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