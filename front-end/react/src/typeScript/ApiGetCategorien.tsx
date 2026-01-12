import { useState, useEffect, useCallback } from 'react';

export function UseDataApi<T>(url: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        console.log("categorien ophalen")
        const controller = new AbortController();
        const { signal } = controller;

        async function fetchData() {
            setLoading(true);
            setError(null);
            
            try {
                const token = sessionStorage.getItem("token");
                const response = await fetch(url, {
                    signal,
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined // <- header toevoegen
                });
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                }

                const jsonData = await response.json();
                setData(jsonData);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Fout bij ophalen data:', err);
                    setError(err.message || 'Er is iets misgegaan');
                }
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            controller.abort();
        };
        
    // 3. refreshTrigger toevoegen aan de afhankelijkheden
    }, [url]); 

    // 4. De refresh functie teruggeven zodat je component hem kan gebruiken
    return { data, loading, error};
}

export function getBearerToken() {
    return sessionStorage.getItem("token");
}
