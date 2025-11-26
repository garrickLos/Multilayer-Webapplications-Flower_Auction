import { useEffect, useMemo, useState } from "react";

class IntervalObserver {
    private timer: ReturnType<typeof setInterval> | null = null;
    private readonly listeners = new Set<(now: Date) => void>();

    constructor(private readonly stepMs: number) {}

    subscribe(listener: (now: Date) => void): () => void {
        this.listeners.add(listener);
        this.ensureRunning();
        listener(new Date());
        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) this.stop();
        };
    }

    private ensureRunning() {
        if (this.timer) return;
        this.timer = setInterval(() => this.notify(), this.stepMs);
    }

    private stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private notify() {
        const now = new Date();
        this.listeners.forEach((listener) => listener(now));
    }
}

const tickerRegistry = new Map<number, IntervalObserver>();

const getTicker = (stepMs: number): IntervalObserver => {
    if (!tickerRegistry.has(stepMs)) tickerRegistry.set(stepMs, new IntervalObserver(stepMs));
    return tickerRegistry.get(stepMs)!;
};

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

export function useTicker(stepMs = 1000): Date {
    const [now, setNow] = useState<Date>(() => new Date());

    const ticker = useMemo(() => getTicker(stepMs), [stepMs]);

    useEffect(() => ticker.subscribe(setNow), [ticker]);

    return now;
}

export { useLiveStats } from "./useLiveStats";
export type { LiveStats } from "./useLiveStats";
