import { useState, useEffect } from 'react';

const INTERVAL_MS = 150000; // 2.5 minuut

// <T> zorgt dat je straks kan aangeven welk type data je verwacht (bijv. <VeilingItem[]>), wordt aangegeven met een interface die de types die je moet zien gebruikt
export function UseDataApi<T>(url: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // AbortController stopt de fetch als de component verdwijnt
        const controller = new AbortController();
        const { signal } = controller;

        async function fetchData() {
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(url, { signal });

                // Check of de server daadwerkelijk succesvol antwoordde
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                }

                const jsonData = await response.json();
                setData(jsonData);
            } catch (err: any) {
                // Negeer errors die komen door het annuleren van de fetch
                if (err.name !== 'AbortError') {
                    console.error('Fout bij ophalen data:', err);
                    setError(err.message || 'Er is iets misgegaan');
                }
            } finally {
                // Alleen loading uitzetten als we niet geaborted zijn
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        }

        // Directe eerste call
        fetchData();

        // 3. Interval instellen
        const intervalId = setInterval(fetchData, INTERVAL_MS);

        // 4. Cleanup functie: stopt interval én lopende requests bij unmounten/URL wissel
        return () => {
            clearInterval(intervalId);
            controller.abort();
        };
        
    }, [url]); // 5. url in dependency array!

    return { data, loading, error };
}