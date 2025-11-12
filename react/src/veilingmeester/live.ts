import { getAuctionDetail } from "./api";
import { adaptAuction, type VeilingDetailDto, type VeilingRow } from "./types";

type PatchHandler = (update: Partial<VeilingRow>) => void;

type Cleanup = () => void;

const POLL_STEPS = [2000, 4000, 8000, 15000] as const;

function shouldStop(row: VeilingRow): boolean {
    if (row.status !== "active") return true;
    if (!row.endIso) return false;
    const end = Date.parse(row.endIso);
    return Number.isFinite(end) && Date.now() >= end;
}

function createDiff(previous: VeilingRow | null, next: VeilingRow): Partial<VeilingRow> | null {
    if (!previous) return next;
    const diff: Partial<VeilingRow> = {};
    let changed = false;
    (Object.keys(next) as Array<keyof VeilingRow>).forEach((key) => {
        if (!Object.is(previous[key], next[key])) {
            diff[key] = next[key];
            changed = true;
        }
    });
    return changed ? diff : null;
}

async function pollOnce(
    veilingId: number,
    controller: AbortController,
    apply: (row: VeilingRow) => void,
): Promise<boolean> {
    try {
        const detail = await getAuctionDetail(veilingId, controller.signal);
        const row = adaptAuction(detail as VeilingDetailDto);
        apply(row);
        return shouldStop(row);
    } catch (error) {
        if ((error as { name?: string }).name === "AbortError" || controller.signal.aborted) {
            return true;
        }
        return false;
    }
}

export function subscribeAuction(veilingId: number, onPatch: PatchHandler): Cleanup {
    if (typeof window === "undefined" || Number.isNaN(veilingId)) {
        return () => undefined;
    }

    let disposed = false;
    let lastRow: VeilingRow | null = null;
    let pollTimer: ReturnType<typeof window.setTimeout> | undefined;
    let eventSource: EventSource | null = null;
    let socket: WebSocket | null = null;
    let pollIndex = 0;
    const hasDocument = typeof document !== "undefined";

    const controller = new AbortController();
    let triedSse = false;
    let triedWs = false;

    const applyRow = (row: VeilingRow) => {
        if (disposed) return;
        const diff = createDiff(lastRow, row);
        lastRow = row;
        if (diff) {
            onPatch(diff);
        }
        if (shouldStop(row)) {
            dispose();
        }
    };

    const schedulePoll = (delay: number) => {
        if (disposed) return;
        if (pollTimer) window.clearTimeout(pollTimer);
        pollTimer = window.setTimeout(async () => {
            if (disposed) return;
            if (hasDocument && document.visibilityState === "hidden") {
                schedulePoll(delay);
                return;
            }
            if (!navigator.onLine) {
                schedulePoll(delay);
                return;
            }
            const stop = await pollOnce(veilingId, controller, applyRow);
            if (!stop && !disposed) {
                pollIndex = 0;
                schedulePoll(POLL_STEPS[0]);
            }
        }, delay);
    };

    const fallbackToPolling = () => {
        if (disposed) return;
        closeRealtime();
        schedulePoll(POLL_STEPS[Math.min(pollIndex, POLL_STEPS.length - 1)]);
        pollIndex = Math.min(pollIndex + 1, POLL_STEPS.length - 1);
    };

    const handleRealtimeMessage = (data: string) => {
        if (!data) {
            void pollOnce(veilingId, controller, applyRow);
            return;
        }
        try {
            const parsed = JSON.parse(data) as VeilingDetailDto | VeilingRow;
            const row = "titel" in parsed ? adaptAuction(parsed as VeilingDetailDto) : (parsed as VeilingRow);
            applyRow(row);
        } catch {
            void pollOnce(veilingId, controller, applyRow);
        }
    };

    const initSse = () => {
        if (triedSse) return;
        triedSse = true;
        try {
            eventSource = new EventSource(`/api/Veiling/${veilingId}/stream`, { withCredentials: true } as EventSourceInit);
            eventSource.onmessage = (event) => handleRealtimeMessage(event.data);
            eventSource.onerror = () => {
                if (disposed) return;
                closeRealtime();
                initWebSocket();
                if (!socket) {
                    fallbackToPolling();
                }
            };
        } catch {
            initWebSocket();
            if (!socket) {
                fallbackToPolling();
            }
        }
    };

    const initWebSocket = () => {
        if (triedWs) return;
        triedWs = true;
        try {
            const protocol = window.location.protocol === "https:" ? "wss" : "ws";
            socket = new WebSocket(`${protocol}://${window.location.host}/api/Veiling/${veilingId}/ws`);
            socket.onmessage = (event) => handleRealtimeMessage(event.data);
            socket.onerror = fallbackToPolling;
            socket.onclose = fallbackToPolling;
        } catch {
            fallbackToPolling();
        }
    };

    const closeRealtime = () => {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        if (socket) {
            socket.close();
            socket = null;
        }
    };

    const dispose = () => {
        if (disposed) return;
        disposed = true;
        closeRealtime();
        if (pollTimer) window.clearTimeout(pollTimer);
        controller.abort();
        window.removeEventListener("online", onlineListener);
        if (hasDocument) {
            document.removeEventListener("visibilitychange", visibilityListener);
        }
    };

    const onlineListener = () => {
        if (disposed) return;
        if (socket || eventSource) return;
        pollIndex = 0;
        schedulePoll(POLL_STEPS[0]);
    };

    const visibilityListener = () => {
        if (disposed || !hasDocument) return;
        if (document.visibilityState === "visible") {
            pollIndex = 0;
            schedulePoll(POLL_STEPS[0]);
        }
    };

    window.addEventListener("online", onlineListener);
    if (hasDocument) {
        document.addEventListener("visibilitychange", visibilityListener);
    }

    initSse();
    if (!eventSource && !socket) {
        initWebSocket();
    }
    if (!eventSource && !socket) {
        schedulePoll(POLL_STEPS[0]);
    }

    void pollOnce(veilingId, controller, applyRow);

    return dispose;
}

