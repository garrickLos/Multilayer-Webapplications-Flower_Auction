import { useState, useEffect } from "react";
import { UseDataApi as GetVeilingen } from '../../typeScript/ApiGet';

// --- Interfaces ---

interface ProductLogica {
    naam: string;
    startPrijs: number;
    minPrijs: number;
}

interface VeilingLogica {
    veilingNr: number;
    status: string;
    startIso: string;
    endIso: string;
    producten: ProductLogica[];
}

interface ApiVeilingResponse {
    veilingNr: number;
    status: string;
    begintijd: string;
    eindtijd: string;
    producten: Array<{
        naam: string;
        // LET OP: Pas deze namen aan aan wat je ECHT uit de database krijgt (waarschijnlijk kleine letters)
        minimumprijs?: number; 
        startprijs?: number;
    }>;
}

// --- Functies ---

function CalculateActiveProductPrice(veiling: VeilingLogica): number {
    // FOUT HERSTELD: Return altijd een nummer, geen string, anders crasht .toFixed()
    if (!veiling || veiling.status !== 'active') return 0;

    const start = veiling.startIso ? new Date(veiling.startIso).getTime() : Date.now();
    const now = Date.now();

    if (now < start) {
        return veiling.producten.length > 0 ? veiling.producten[0].startPrijs : 0;
    }

    const verstrekenTijd = now - start;
    
    // FOUT HERSTELD: 'Math' met hoofdletter M
    let resterendeTijdInSec = Math.floor(verstrekenTijd / 1000);

    for (let i = 0; i < veiling.producten.length; i++) {
        const product = veiling.producten[i];

        console.log(product.naam);
        console.log(product.minPrijs);

        const prijsVerschil = product.startPrijs - product.minPrijs;
        
        // 1 cent = 1 seconde. Dus prijsverschil * 100 = seconden.
        const productDuurInSec = Math.round(prijsVerschil * 100);

        if (resterendeTijdInSec <= productDuurInSec) {
            
            const korting = resterendeTijdInSec * 0.01;
            let huidigePrijs = product.startPrijs - korting;

            return Number(huidigePrijs.toFixed(2));
        }

        // Trek de tijd van dit product af van het totaal en ga naar de volgende
        resterendeTijdInSec -= productDuurInSec;
    }

    const laatsteProduct = veiling.producten[veiling.producten.length - 1]
    return laatsteProduct ? laatsteProduct.minPrijs : 0;
}

interface TimerProps {
    onPrijsUpdate: (nieuwePrijs: number) => void;
    targetVeilingNr: number;
}

// --- Component ---

export function Timer({ onPrijsUpdate, targetVeilingNr }: TimerProps) {
    const [refreshApi, setRefreshApi] = useState(Date.now());
    const [currentTime, setCurrentTime] = useState(Date.now());

    const { data } = GetVeilingen<ApiVeilingResponse[]>(`/api/Veiling?refresh=${refreshApi}`);

    const safeData = data || [];

    const veilingenLijst: VeilingLogica[] = safeData.map((item) => {
        return {
            veilingNr: item.veilingNr,
            status: item.status,
            startIso: item.begintijd,
            endIso: item.eindtijd,
            producten: (item.producten || []).map(prod => ({
                naam: prod.naam,
                // FOUT HERSTELD: Mappen naar de waarschijnlijke API velden
                startPrijs: prod.startprijs || 0,
                minPrijs: prod.minimumprijs || 0
            }))
        };
    });

    useEffect(() => {
        const visualInterval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(visualInterval);
    }, []);

    useEffect(() => {
        const apiInterval = setInterval(() => {
            setRefreshApi(Date.now());
        }, 1000);
        return () => clearInterval(apiInterval);
    }, []);

    const item = veilingenLijst.length > 0 
        ? veilingenLijst.find(v => v.veilingNr === targetVeilingNr)  
        : null;
    
    const price = item ? CalculateActiveProductPrice(item) : 0;



    useEffect(() => {
        // Controleer of onPrijsUpdate bestaat voordat je hem aanroept
        if (item && onPrijsUpdate) {
            onPrijsUpdate(price);
        }
    }, [price, item, onPrijsUpdate]); 

    if (!item) {
        return <p>Veiling laden...</p>;
    }

    return (
        <div className="veiling-klok">
            <p>€ {price.toFixed(2)}</p>
        </div>
    );
}