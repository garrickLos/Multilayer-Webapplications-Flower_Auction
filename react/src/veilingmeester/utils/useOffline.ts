import { useEffect, useState } from "react";

/**
 * Tracks the browser network connectivity state and updates when it changes.
 */
export function useOffline(): boolean {
    const [offline, setOffline] = useState<boolean>(() => {
        if (typeof navigator === "undefined") {
            return false;
        }
        return !navigator.onLine;
    });

    useEffect(() => {
        const handleOnline = () => setOffline(false);
        const handleOffline = () => setOffline(true);
        if (typeof window === "undefined") {
            return undefined;
        }
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return offline;
}
