// useFetchDatajson.ts
import { useState, useEffect } from 'react';

/**
 * Standaard state die deze hook teruggeeft:
 * - data: de opgehaalde items (altijd een array)
 * - isLoading: true tijdens het ophalen
 * - error: foutmelding (of null als alles goed ging)
 */
export interface FetchState<T> {
    data: T[];
    isLoading: boolean;
    error: string | null;
}

/**
 * Custom React hook om JSON data op te halen en te bewaren in state.
 * Verwacht dat de response een object is met een property (key) die een array bevat.
 *
 * Voorbeeld: response = { producten: [...] }
 * useFetchDatajson("producten", "/api/..") -> pakt response["producten"].
 */
export function useFetchDatajson<T>(key: string, url: string): FetchState<T> {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Voert de fetch uit zodra key of url verandert.
     * Zet loading aan, reset errors, en verwerkt de response in data/error.
     */
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const jsonArray = await dataOphalen<T>(key, url);
                setData(jsonArray ?? []);
            } catch (err) {
                setError(String(err));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [key, url]);

    return { data, isLoading, error };
}

/**
 * Haalt JSON op van een url en leest daaruit json[jsonItem] als array.
 * Geeft undefined terug als er een fout optreedt (en logt dit in de console).
 */
async function dataOphalen<T>(jsonItem: string, jsonurl: string): Promise<T[] | undefined> {
    try {
        const res = await fetch(jsonurl);

        // HTTP error afvangen (bijv. 404/500)
        if (!res.ok) throw new Error(`Fout bij het ophalen: ${res.status} ${res.statusText}`);

        // Response body lezen
        const json = await res.json();

        // Verwachte property uit het JSON object halen
        const items = json[jsonItem];

        // Check: moet een array zijn
        if (!Array.isArray(items)) throw new Error(`"${jsonItem}" is geen array.`);

        return items as T[];
    } catch (err) {
        console.error('Fetch fout:', err);
        return undefined;
    }
}
