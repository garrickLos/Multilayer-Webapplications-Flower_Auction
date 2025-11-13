import { useState, useEffect } from 'react';

export function useVeilingData() {
    const [veilingen, setVeilingen] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVeilingen() {
            try {
                const response = await fetch('/api/Veiling');
                if (!response.ok) throw new Error('Netwerkfout');
                
                const data = await response.json();

                

                setVeilingen(data);

            } catch (err: any) {
                console.error('Fout bij laden veilingen:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchVeilingen();
        
    }, []);

    return { veilingen, loading, error };
}