import { fetchAuctionDetail } from "../api";
import { appConfig } from "../config";
import { DomainMapper, type VeilingDetailDto, type VeilingRow } from "../types";

export type AuctionPatchHandler = (update: Partial<VeilingRow>) => void;
export type Cleanup = () => void;

const POLL_STEPS = appConfig.realtime.pollStepsMs;

const diff = (previous: VeilingRow | null, next: VeilingRow): Partial<VeilingRow> | null => {
    if (!previous) return next;
    const patch: Partial<VeilingRow> = {};
    let changed = false;
    (Object.keys(next) as (keyof VeilingRow)[]).forEach((key) => {
        if (!Object.is(previous[key], next[key])) {
            patch[key] = next[key];
            changed = true;
        }
    });
    return changed ? patch : null;
};

const finished = (row: VeilingRow): boolean => {
    if (row.status !== "active") return true;
    const end = Date.parse(row.endDate);
    return Number.isFinite(end) && Date.now() >= end;
};

const parseMessage = (payload: string): VeilingRow | null => {
    if (!payload) return null;
    try {
        const parsed = JSON.parse(payload) as VeilingDetailDto | VeilingRow;
        return "titel" in parsed ? DomainMapper.mapAuction(parsed) : (parsed as VeilingRow);
    } catch {
        return null;
    }
};

export function subscribeAuction(veilingId: number, onPatch: AuctionPatchHandler): Cleanup {
    if (typeof window === "undefined" || Number.isNaN(veilingId)) return () => undefined;

    let last: VeilingRow | null = null;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sse: EventSource | null = null;
    let ws: WebSocket | null = null;
    const controller = new AbortController();

    const applyRow = (row: VeilingRow | null) => {
        if (!row || disposed) return;
        const patch = diff(last, row);
        last = row;
        if (patch) onPatch(patch);
        if (finished(row)) cleanup();
    };

    const fetchOnce = async () => {
        try {
            const detail = await fetchAuctionDetail(veilingId, controller.signal);
            applyRow(detail);
        } catch (error) {
            if ((error as { name?: string }).name === "AbortError") return;
            fallbackToPolling();
        }
    };

    const schedule = (delay: number) => {
        if (disposed) return;
        clearTimeout(timer);
        timer = setTimeout(fetchOnce, delay);
    };

    const fallbackToPolling = () => {
        if (disposed) return;
        closeRealtime();
        schedule(POLL_STEPS[0]);
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
            sse.onmessage = (event) => {
                const row = parseMessage(event.data);
                if (row) applyRow(row);
            };
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
        fetchOnce();
    };

    const visibilityListener = () => {
        if (disposed || document.visibilityState === "hidden") return;
        fetchOnce();
    };

    window.addEventListener("online", onlineListener);
    document.addEventListener("visibilitychange", visibilityListener);

    initSse();
    if (!sse) initWebsocket();
    if (!sse && !ws) schedule(POLL_STEPS[0]);

    void fetchOnce();
    return cleanup;
}
