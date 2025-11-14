import { useState, useEffect } from 'react';

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
        
    }, []);

    return { veilingen, loading, error };
}