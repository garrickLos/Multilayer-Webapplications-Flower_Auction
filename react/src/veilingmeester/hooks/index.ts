import { useEffect, useState } from "react";

// Reports offline/online state for lightweight messaging.
export function useOffline(): boolean {
    const [offline, setOffline] = useState(() => (typeof navigator === "undefined" ? false : !navigator.onLine));

    useEffect(() => {
        if (typeof window === "undefined") return;
        const update = () => setOffline(!navigator.onLine);
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);

    return offline;
}

export { useLiveStats } from "./useLiveStats";
