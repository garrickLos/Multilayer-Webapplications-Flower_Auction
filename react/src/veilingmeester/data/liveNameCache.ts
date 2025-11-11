import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { liveGet } from './live';

type Watcher<T = any> = {
    start: () => Promise<void>;
    stop: () => void;
    refresh: () => Promise<void>;
    subscribe: (fn: (value: T) => void) => () => void;
};

type WatchEntry<T = any> = {
    watcher: Watcher<T>;
    unsubscribe: () => void;
};

/**
 * Houdt een live cache bij van gebruikers- en veilingenamen.
 * - /api/Gebruiker/{id} → naam
 * - /api/Veiling/{id}   → "veilingNr – eerste productnaam (+N)"
 */
export function useLiveNameCache() {
    const [gebruikersMap, setGebruikersMap] = useState<Record<number, string>>(
        {},
    );
    const [veilingenMap, setVeilingenMap] = useState<Record<number, string>>({});

    const userWatchers = useRef(
        new Map<number, WatchEntry<{ gebruikerNr?: number; naam?: unknown }>>(),
    );
    const auctionWatchers = useRef(
        new Map<
            number,
            WatchEntry<{ veilingNr?: number; producten?: { naam?: unknown }[] }>
        >(),
    );

    // --- helpers -------------------------------------------------------------

    const safeSet = (
        setter: Dispatch<SetStateAction<Record<number, string>>>,
        id: number,
        display: string,
    ) => {
        setter(prev =>
            prev[id] === display ? prev : { ...prev, [id]: display },
        );
    };

    // Gebruiker-watcher
    const startUserWatcher = (
        id: number,
    ): WatchEntry<{ gebruikerNr?: number; naam?: unknown }> => {
        const watcher = liveGet<{ gebruikerNr?: number; naam?: unknown }>(
            `/api/Gebruiker/${id}`,
            {
                refreshMs: 60_000,
                revalidateOnFocus: true,
            },
        ) as unknown as Watcher<{ gebruikerNr?: number; naam?: unknown }>;

        const unsubscribe = watcher.subscribe(v => {
            const naam =
                typeof v?.naam === 'string' ? v.naam.trim() : '';
            const display = naam || `Gebruiker ${id}`;
            safeSet(setGebruikersMap, id, display);
        });

        void watcher.start();
        return { watcher, unsubscribe };
    };

    // Veiling-watcher: gebruikt producten uit VeilingDto
    const startAuctionWatcher = (
        id: number,
    ): WatchEntry<{
        veilingNr?: number;
        producten?: { naam?: unknown }[];
    }> => {
        const watcher = liveGet<{
            veilingNr?: number;
            producten?: { naam?: unknown }[];
        }>(`/api/Veiling/${id}`, {
            refreshMs: 60_000,
            revalidateOnFocus: true,
        }) as unknown as Watcher<{
            veilingNr?: number;
            producten?: { naam?: unknown }[];
        }>;

        const unsubscribe = watcher.subscribe(v => {
            const veilingNr = v?.veilingNr ?? id;
            const producten = Array.isArray(v?.producten)
                ? v.producten
                : [];
            const first = producten[0];

            const firstName =
                first && typeof first.naam === 'string'
                    ? first.naam.trim()
                    : '';

            let display: string;
            if (firstName) {
                const extra =
                    producten.length > 1
                        ? ` (+${producten.length - 1})`
                        : '';
                display = `${veilingNr} – ${firstName}${extra}`;
            } else {
                display = `Veiling ${veilingNr}`;
            }

            safeSet(setVeilingenMap, id, display);
        });

        void watcher.start();
        return { watcher, unsubscribe };
    };

    // --- public API ----------------------------------------------------------

    const fetchGebruikers = (ids: number[]) => {
        ids.forEach(id => {
            if (!Number.isFinite(id)) return;
            const map = userWatchers.current;
            const entry = map.get(id);
            if (!entry) {
                map.set(id, startUserWatcher(id));
            } else {
                void entry.watcher.refresh();
            }
        });
    };

    const fetchVeilingen = (ids: number[]) => {
        ids.forEach(id => {
            if (!Number.isFinite(id)) return;
            const map = auctionWatchers.current;
            const entry = map.get(id);
            if (!entry) {
                map.set(id, startAuctionWatcher(id));
            } else {
                void entry.watcher.refresh();
            }
        });
    };

    // Cleanup alle watchers bij unmount
    useEffect(
        () => () => {
            userWatchers.current.forEach(({ watcher, unsubscribe }) => {
                unsubscribe();
                watcher.stop();
            });
            auctionWatchers.current.forEach(({ watcher, unsubscribe }) => {
                unsubscribe();
                watcher.stop();
            });
        },
        [],
    );

    return { gebruikersMap, veilingenMap, fetchGebruikers, fetchVeilingen };
}
