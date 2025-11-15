import { useState, useEffect } from 'react';

//aantal seconden dat het herhaald in miliseconden voor het ophalen van de data
const intervalInMS = 180000;

export function useVeilingData() {
    const [veilingen, setVeilingen] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVeilingen() {
            try {
                const responseVeilingen = await fetch('/api/Veiling');
                
                const dataVeilingen = await responseVeilingen.json();

                setVeilingen(dataVeilingen);

            } catch (err: any) {
                console.error('Fout bij laden veilingen:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchVeilingen();

        //zet de interval om elke 2 minuten te herhalen (ligt aan hoe de POLLING_INTERVAL is ingesteld qua miliseconden)
        const intervalId = setInterval(fetchVeilingen, intervalInMS);

        //stopt de interval wanneer de component gebruikt wordt verwijderd (unmount)
        return () => {
            clearInterval(intervalId);
        };
        
    }, []);

    return { veilingen, loading, error };
}