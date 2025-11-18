import { useState, useEffect } from 'react';

//aantal seconden dat het herhaald in miliseconden voor het ophalen van de data
const intervalInMS = 150000;

export function GetDataApi(ApiUrl: string) {
    const [ApiElement, setApiElement] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchApiGet() {
            try {
                const responseVeilingen = await fetch(ApiUrl);
                
                const dataVeilingen = await responseVeilingen.json();

                setApiElement(dataVeilingen);

            } catch (err: any) {
                console.error('Fout bij laden veilingen:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchApiGet();

        //zet de interval om elke 2 minuten te herhalen (ligt aan hoe de POLLING_INTERVAL is ingesteld qua miliseconden)
        const intervalId = setInterval(fetchApiGet, intervalInMS);

        //stopt de interval wanneer de component gebruikt wordt verwijderd (unmount)
        return () => {
            clearInterval(intervalId);
        };
        
    }, []);

    return { ApiElement: ApiElement, loading, error };
}