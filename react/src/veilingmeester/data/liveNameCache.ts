import { useEffect, useRef, useState } from 'react';
import { liveGet } from './live';

/**
 * Hook that resolves and caches user (gebruiker) and auction (veiling) names
 * using the live caching system.  Entries are kept up‑to‑date via
 * `liveGet`, which handles conditional revalidation, focus refreshes and
 * global deduplication.  Each requested id is monitored until the
 * component unmounts.
 */
export function useLiveNameCache() {
    const [gebruikersMap, setGebruikersMap] = useState<Record<number, string>>({});
    const [veilingenMap, setVeilingenMap] = useState<Record<number, string>>({});
    // Track active watchers and their unsubscribe functions per id
    const userWatchers = useRef(new Map<number, { watcher: ReturnType<typeof liveGet>; unsubscribe: () => void }>());
    const auctionWatchers = useRef(new Map<number, { watcher: ReturnType<typeof liveGet>; unsubscribe: () => void }>());

    // Create a live watcher for a gebruiker id
    const startUserWatcher = (id: number) => {
        const watcher = liveGet<{ gebruikerNr?: number; naam?: unknown }>(`/api/Gebruiker/${id}`, {
            // refresh regularly and when window regains focus
            refreshMs: 60_000,
            revalidateOnFocus: true,
        });
        const unsubscribe = watcher.subscribe(v => {
            const naam = typeof v?.naam === 'string' ? v.naam.trim() : '';
            const display = naam || `Gebruiker ${id}`;
            setGebruikersMap(prev => (prev[id] === display ? prev : { ...prev, [id]: display }));
        });
        watcher.start();
        return { watcher, unsubscribe };
    };

    // Create a live watcher for a veiling id
    const startAuctionWatcher = (id: number) => {
        const watcher = liveGet<{ veilingNr?: number; product?: { naam?: unknown } }>(`/api/Veiling/${id}`, {
            refreshMs: 60_000,
            revalidateOnFocus: true,
        });
        const unsubscribe = watcher.subscribe(v => {
            const prodName = typeof v?.product?.naam === 'string' ? v.product!.naam : undefined;
            const display = prodName ? `${v?.veilingNr ?? id} – ${prodName}` : `Veiling ${id}`;
            setVeilingenMap(prev => (prev[id] === display ? prev : { ...prev, [id]: display }));
        });
        watcher.start();
        return { watcher, unsubscribe };
    };

    // Public functions to request names.  They start watchers for new ids and
    // trigger a refresh for existing watchers.
    const fetchGebruikers = (ids: number[]) => {
        ids.forEach(id => {
            const map = userWatchers.current;
            const entry = map.get(id);
            if (!entry) {
                map.set(id, startUserWatcher(id));
            } else {
                entry.watcher.refresh();
            }
        });
    };
    const fetchVeilingen = (ids: number[]) => {
        ids.forEach(id => {
            const map = auctionWatchers.current;
            const entry = map.get(id);
            if (!entry) {
                map.set(id, startAuctionWatcher(id));
            } else {
                entry.watcher.refresh();
            }
        });
    };

    // Cleanup watchers on unmount
    useEffect(() => {
        return () => {
            userWatchers.current.forEach(({ watcher, unsubscribe }) => {
                unsubscribe();
                watcher.stop();
            });
            auctionWatchers.current.forEach(({ watcher, unsubscribe }) => {
                unsubscribe();
                watcher.stop();
            });
        };
    }, []);

    return { gebruikersMap, veilingenMap, fetchGebruikers, fetchVeilingen };
}