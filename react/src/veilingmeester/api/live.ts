import { getAuction } from "../api";
import { appConfig } from "../config";
import type { VeilingMeester_VeilingDto } from "../types";

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Cleanup = () => void;

type PatchHandler = (value: Partial<VeilingMeester_VeilingDto>) => void;

const { pollStepsMs } = appConfig.realtime;

const diff = (previous: Mutable<VeilingMeester_VeilingDto> | null, next: Mutable<VeilingMeester_VeilingDto>) => {
    if (!previous) return next;
    const patch: Partial<VeilingMeester_VeilingDto> = {};
    let changed = false;
    (Object.keys(next) as (keyof VeilingMeester_VeilingDto)[]).forEach((key) => {
        if (!Object.is(previous[key], next[key])) {
            patch[key] = next[key];
            changed = true;
        }
    });
    return changed ? patch : null;
};

const finished = (auction: VeilingMeester_VeilingDto) => {
    const end = Date.parse(auction.eindtijd);
    return Number.isFinite(end) && Date.now() >= end;
};

const parseMessage = (payload: string): VeilingMeester_VeilingDto | null => {
    if (!payload) return null;
    try {
        return JSON.parse(payload) as VeilingMeester_VeilingDto;
    } catch {
        return null;
    }
};

export const subscribeAuction = (veilingId: number, onPatch: PatchHandler): Cleanup => {
    if (typeof window === "undefined" || Number.isNaN(veilingId)) return () => undefined;

    let last: Mutable<VeilingMeester_VeilingDto> | null = null;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sse: EventSource | null = null;
    let ws: WebSocket | null = null;
    const controller = new AbortController();

    const applyRow = (row: VeilingMeester_VeilingDto | null) => {
        if (!row || disposed) return;
        const mutable: Mutable<VeilingMeester_VeilingDto> = { ...row };
        const patch = diff(last, mutable);
        last = mutable;
        if (patch) onPatch(patch);
        if (finished(row)) cleanup();
    };

    const fetchOnce = async () => {
        try {
            const detail = await getAuction(veilingId, controller.signal);
            applyRow(detail);
        } catch (error) {
            if ((error as { name?: string }).name === "AbortError") return;
            fallbackToPolling();
        }
    };

    const schedule = (delay: number) => {
        if (disposed) return;
        clearTimeout(timer);
        timer = setTimeout(() => void fetchOnce(), delay);
    };

    const fallbackToPolling = () => {
        if (disposed) return;
        closeRealtime();
        schedule(pollStepsMs[0]);
    };

    const closeRealtime = () => {
        sse?.close();
        sse = null;
        ws?.close();
        ws = null;
    };

    const initSse = () => {
        try {
            sse = new EventSource(`/api/Veiling/${veilingId}/stream`, { withCredentials: true });
            sse.onmessage = (event) => applyRow(parseMessage(event.data));
            sse.onerror = fallbackToPolling;
        } catch {
            fallbackToPolling();
        }
    };

    const initWebsocket = () => {
        try {
            const protocol = window.location.protocol === "https:" ? "wss" : "ws";
            ws = new WebSocket(`${protocol}://${window.location.host}/api/Veiling/${veilingId}/ws`);
            ws.onmessage = (event) => applyRow(parseMessage(String(event.data)));
            ws.onclose = fallbackToPolling;
            ws.onerror = fallbackToPolling;
        } catch {
            fallbackToPolling();
        }
    };

    const cleanup = () => {
        if (disposed) return;
        disposed = true;
        clearTimeout(timer);
        closeRealtime();
        controller.abort();
        window.removeEventListener("online", onlineListener);
        document.removeEventListener("visibilitychange", visibilityListener);
    };

    const onlineListener = () => {
        if (disposed || ws || sse) return;
        void fetchOnce();
    };

    const visibilityListener = () => {
        if (disposed || document.visibilityState === "hidden") return;
        void fetchOnce();
    };

    window.addEventListener("online", onlineListener);
    document.addEventListener("visibilitychange", visibilityListener);

    initSse();
    if (!sse) initWebsocket();
    if (!sse && !ws) schedule(pollStepsMs[0]);

    void fetchOnce();
    return cleanup;
};
