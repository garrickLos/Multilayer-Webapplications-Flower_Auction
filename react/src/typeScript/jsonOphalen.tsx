import {useState, useEffect} from 'react';

export interface AuctionItems {
    imagePath?: string;
    "afbeelding-alt"?: string;
    header_info?: string;
    paragraph?: string;
}

export function useAuctionData(key: string, url: string) {
    const [data, setData] = useState<AuctionItems[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const jsonArray = await dataOphalen(key, url);

                if (!jsonArray || jsonArray.length === 0) {
                    setData([]);

                } else {
                    
                    setData(jsonArray);
                }
            } catch (err) {
                console.error(err);
                setError('Fout bij het ophalen van de data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [key, url]);
    return { data, isLoading, error };
}

async function dataOphalen(jsonItem: string, jsonurl: string): Promise<AuctionItems[] | undefined> {
    const url = jsonurl; 

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Fout bij het ophalen: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();

        if (Array.isArray(jsonData[jsonItem])) {
            return jsonData[jsonItem] as AuctionItems[];
        } else {
            throw new Error('De opgehaalde data is geen array van veilingitems.');
        }

    } catch (error) {
        console.error('Er ging iets mis tijdens de fetch-operatie:', error);
        return undefined;
    }
}