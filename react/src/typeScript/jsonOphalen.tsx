// useFetchDatajson.ts
import { useState, useEffect } from 'react';

export interface FetchState<T> {
    data: T[];
    isLoading: boolean;
    error: string | null;
}

export function useFetchDatajson<T>(key: string, url: string): FetchState<T> {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

async function dataOphalen<T>(jsonItem: string, jsonurl: string): Promise<T[] | undefined> {    
    try {
        const res = await fetch(jsonurl);
        
        if (!res.ok) throw new Error(`Fout bij het ophalen: ${res.status} ${res.statusText}`);
        
        const json = await res.json();
        const items = json[jsonItem];
        
        if (!Array.isArray(items)) throw new Error(`"${jsonItem}" is geen array.`);
        
        return items as T[];
    } catch (err) {
        console.error('Fetch fout:', err);
        return undefined;
    }
}
